import cron from 'node-cron';
import PQueue from 'p-queue';
import Network from '../models/Network.js';
import Asset from '../models/Asset.js';
import Setting from '../models/Setting.js';
import TopologyDrawing from '../models/TopologyDrawing.js';
import DeviceLog from '../models/DeviceLog.js';
import { checkPing } from '../services/pingService.js';
import { checkSnmp, fetchNvrData, fetchDeviceSnmpData } from '../services/snmpV3Service.js';
import { resolveVendorProfile, fetchVendorMetrics } from '../services/vendorSnmpService.js';
import { inferSwitchStatus } from '../services/topologyService.js';
import { performRootCauseAnalysis } from '../services/rcaService.js';
import { sendTeamsAlert } from '../services/teamsService.js';
import { globalNvrCache, globalSnmpCache, globalMetricsCache } from '../utils/cache.js';

// Global Memory Map untuk kalkulasi Delta Traffic
const trafficCounterMap = new Map();

// Batasi konkurensi (maksimal 5 eksekusi TCP socket berjalan bersamaan)
const pingQueue = new PQueue({ concurrency: 5 });

/**
 * Fungsi utama memproses polling perangkat
 */
export const processDevicePolling = async (io) => {
    try {
        const devices = await Network.findAll();
        let validDevices = devices.filter((dev) => dev.IP && dev.IP !== '-');

        if (validDevices.length === 0) return;

        // 1. Kumpulkan semua node ID unik yang terpasang di drawing topologi
        const activeTopoIds = new Set();
        const activeTopoIps = new Set();
        const activeTopoHosts = new Set();

        try {
            const allDrawings = await TopologyDrawing.findAll();
            if (allDrawings && allDrawings.length > 0) {
                allDrawings.forEach(dw => {
                    const nodes = dw.nodes || {};
                    Object.keys(nodes).forEach(key => {
                        if (key.startsWith('group-') || nodes[key]?.isGroup) return;
                        const cleanKey = String(key).trim().toLowerCase();
                        activeTopoIds.add(cleanKey);
                        if (nodes[key]?.ip) activeTopoIps.add(String(nodes[key].ip).trim().toLowerCase());
                        if (nodes[key]?.label) activeTopoHosts.add(String(nodes[key].label).trim().toLowerCase());
                        if (nodes[key]?.hostname) activeTopoHosts.add(String(nodes[key].hostname).trim().toLowerCase());
                    });
                });
            }
        } catch (e) {
            console.error('Gagal membaca TopologyDrawings untuk filter polling:', e.message);
        }

        // Filter validDevices: HANYA polling perangkat yang benar-benar ada di drawing topologi aktif
        validDevices = validDevices.filter((dev) => {
            const pid = String(dev.PID || dev.id || '').trim().toLowerCase();
            const ip = String(dev.IP || dev.ip || '').trim().toLowerCase();
            const host = String(dev.HOSTNAME || dev.hostname || dev.label || dev.name || '').trim().toLowerCase();

            return (pid && activeTopoIds.has(pid)) || 
                   (ip && (activeTopoIds.has(ip) || activeTopoIps.has(ip))) ||
                   (host && (activeTopoIds.has(host) || activeTopoHosts.has(host)));
        });

        // Ambil daftar perangkat yang dinonaktifkan polling-nya (Disabled Polling List)
        let disabledPolling = {};
        try {
            const disabledSetting = await Setting.findOne({ where: { key: 'disabled_polling_devices' } });
            if (disabledSetting && disabledSetting.value) {
                disabledPolling = typeof disabledSetting.value === 'string' ? JSON.parse(disabledSetting.value) : disabledSetting.value;
            }
        } catch (e) {}

        // Saring keluar perangkat yang polling-nya di-pause / dinonaktifkan
        validDevices = validDevices.filter((dev) => {
            const pid = dev.PID || dev.id;
            const ip = dev.IP || dev.ip;
            const host = dev.HOSTNAME || dev.hostname;
            if (disabledPolling[pid] || disabledPolling[ip] || disabledPolling[host]) {
                return false;
            }
            return true;
        });

        if (validDevices.length === 0) return;

        console.log(`\n⏳ [Cron Engine] Memulai polling ${validDevices.length} perangkat pada ${new Date().toLocaleTimeString('id-ID')}...`);

        // Ambil konfigurasi kredensial SNMP dari database 1 kali
        const snmpSetting = await Setting.findOne({ where: { key: 'snmp_credentials' } });
        let credentials = {};
        if (snmpSetting && snmpSetting.value) {
            try { credentials = JSON.parse(snmpSetting.value); } catch (e) { }
        }

        // Ambil override metode koneksi (HTTP vs SNMP) dari database
        const methodSetting = await Setting.findOne({ where: { key: 'polling_methods' } });
        let pollingOverrides = {};
        if (methodSetting && methodSetting.value) {
            try { pollingOverrides = JSON.parse(methodSetting.value); } catch (e) { }
        }

        // Ambil konfigurasi notifikasi dari database
        const notifSetting = await Setting.findOne({ where: { key: 'notification_preferences' } });
        let notificationPrefs = {};
        if (notifSetting && notifSetting.value) {
            try { notificationPrefs = JSON.parse(notifSetting.value); } catch (e) { }
        }

        // Ambil profil vendor kustom jika ada
        const vendorSetting = await Setting.findOne({ where: { key: 'vendor_profiles' } });
        let customProfiles = {};
        if (vendorSetting && vendorSetting.value) {
            try { customProfiles = JSON.parse(vendorSetting.value); } catch (e) { }
        }

        // Peta status memori untuk Evaluasi Topologi
        const deviceStatusMap = new Map();

        const rawResults = [];

        // Pass 1: Ping semua devices dan simpan status mentah
        const tasks = validDevices.map((dev) =>
            pingQueue.add(async () => {
                const jitter = Math.floor(Math.random() * (500 - 100 + 1) + 100);
                await new Promise((res) => setTimeout(res, jitter));

                const profile = resolveVendorProfile(dev.VENDOR, dev.TYPE, dev.HOSTNAME, customProfiles);
                const isCctv = profile.category === 'nvr' || profile.isNvr;
                const isSwitch = profile.category === 'switch' || profile.isSwitch;
                const isAp = profile.category === 'ap' || profile.isAp;

                const methodOverride = pollingOverrides[dev.IP] || pollingOverrides[dev.PID];
                const finalMethod = dev.PING_METHOD ? dev.PING_METHOD.toLowerCase() : (methodOverride ? methodOverride : profile.defaultMethod);

                const hasExplicitSnmp = dev.SNMP_VERSION && dev.SNMP_VERSION !== 'none' && dev.SNMP_VERSION !== '';
                const isSnmpDisabled = dev.SNMP_VERSION === 'none' || (!hasExplicitSnmp && !dev.SNMP_COMMUNITY && dev.PING_METHOD !== 'snmp');

                // Merge device specific SNMP configs with global ones jika SNMP aktif
                let devCreds = credentials[dev.IP] || {};
                if (hasExplicitSnmp) devCreds = { ...devCreds, version: dev.SNMP_VERSION };
                if (dev.SNMP_PORT) devCreds = { ...devCreds, port: parseInt(dev.SNMP_PORT) };
                if (dev.SNMP_COMMUNITY) devCreds = { ...devCreds, community: dev.SNMP_COMMUNITY };
                if (dev.SNMP_USER) devCreds = { ...devCreds, user: dev.SNMP_USER };
                if (dev.SNMP_AUTH_PROTO) devCreds = { ...devCreds, authProtocol: dev.SNMP_AUTH_PROTO };
                if (dev.SNMP_AUTH_KEY) devCreds = { ...devCreds, authKey: dev.SNMP_AUTH_KEY };
                if (dev.SNMP_PRIV_PROTO) devCreds = { ...devCreds, privProtocol: dev.SNMP_PRIV_PROTO };
                if (dev.SNMP_PRIV_KEY) devCreds = { ...devCreds, privKey: dev.SNMP_PRIV_KEY };

                let pingResult;
                let nvrData = null;
                let snmpData = null;

                if (finalMethod === 'snmp' && !isSnmpDisabled) {
                    pingResult = await checkSnmp(dev.IP, devCreds);
                } else if (finalMethod === 'icmp') {
                    pingResult = await checkPing(dev.IP, 80, 2000, 'icmp');
                } else {
                    pingResult = await checkPing(dev.IP, 80, 2000, 'tcp');
                    // Fallback: Hanya jika SNMP tidak dimatikan dan TCP gagal
                    if (!pingResult.isAlive && !isSnmpDisabled && (isCctv || isSwitch || isAp || hasExplicitSnmp || dev.SNMP_COMMUNITY)) {
                        const snmpPing = await checkSnmp(dev.IP, devCreds);
                        if (snmpPing.isAlive) {
                            pingResult = snmpPing;
                        }
                    }
                }

                let vendorMetrics = null;

                if (pingResult.isAlive) {
                    // Hanya ambil metrik SNMP jika SNMP TIDAK dinonaktifkan
                    if (!isSnmpDisabled && (finalMethod === 'snmp' || profile.defaultMethod === 'snmp' || hasExplicitSnmp)) {
                        vendorMetrics = await fetchVendorMetrics(dev.IP, devCreds, profile);
                        if (vendorMetrics) {
                            if (isCctv) {
                                nvrData = {
                                    info: {
                                        manufacturer: vendorMetrics.info.manufacturer || vendorMetrics.vendor,
                                        model: vendorMetrics.info.model || 'N/A',
                                        serialNumber: vendorMetrics.info.serialNumber || 'N/A',
                                        firmware: vendorMetrics.info.firmware || 'N/A',
                                        userAccessCount: vendorMetrics.info.userAccessCount || '0',
                                        alarmSummary: vendorMetrics.info.alarmSummary || 'Normal',
                                        temperature: vendorMetrics.info.temperature || vendorMetrics.resources?.temperature || null,
                                        fanStatus: vendorMetrics.info.fanStatus || null,
                                        psuStatus: vendorMetrics.info.psuStatus || null,
                                        raidStatus: vendorMetrics.info.raidStatus || null,
                                        recordingState: vendorMetrics.info.recordingState || null,
                                    },
                                    hdd: vendorMetrics.hdd || [],
                                    cameras: vendorMetrics.cameras || []
                                };
                                globalNvrCache.set(String(dev.PID).trim(), nvrData);
                            }
                            snmpData = {
                                ...vendorMetrics.info,
                                ports: vendorMetrics.ports || [],
                                ...vendorMetrics.resources
                            };
                            globalSnmpCache.set(String(dev.PID).trim(), snmpData);
                            globalMetricsCache.set(String(dev.PID).trim(), vendorMetrics);
                        }
                    }
                }

                const newStatus = pingResult.isAlive ? 'UP' : 'DOWN';
                deviceStatusMap.set(dev.PID, newStatus);
                
                const tempInfo = vendorMetrics?.resources?.temperature ?? vendorMetrics?.info?.temperature;
                const tempStr = tempInfo !== undefined && tempInfo !== null ? ` | Temp: ${tempInfo}°C` : '';
                console.log(`   👉 [Poll] ${dev.HOSTNAME || dev.PID} (${dev.IP}) -> Method: ${finalMethod.toUpperCase()} | Status: ${newStatus} | Latency: ${pingResult.ms}ms${tempStr}`);

                rawResults.push({
                    dev,
                    profile,
                    finalMethod,
                    pingResult,
                    nvrData,
                    snmpData,
                    vendorMetrics
                });
            })
        );

        await Promise.all(tasks);

        // Pass 2: INFER SWITCH STATUS (Topological Override) pada Map memory
        await inferSwitchStatus(validDevices, deviceStatusMap, credentials, io, trafficCounterMap);

        // Pass 2.5: Automated Root Cause Analysis (RCA Engine)
        const rcaReport = performRootCauseAnalysis(validDevices, deviceStatusMap);
        if (rcaReport.rootCauses.length > 0) {
            console.log(`🔥 [RCA Engine] Terdeteksi ${rcaReport.rootCauses.length} Root Cause Failure(s) berdampak pada ${rcaReport.summary.cascadingDownCount} perangkat turunan.`);
        }

        // Pass 3: Simpan final status (hasil override) ke DB dan emit ke frontend
        for (const res of rawResults) {
            const { dev, finalMethod, pingResult, nvrData, snmpData } = res;
            const finalStatus = deviceStatusMap.get(dev.PID);
            const rcaInfo = rcaReport.deviceRcaMap[dev.PID] || null;

            const [asset, created] = await Asset.findOrCreate({
                where: { PID: dev.PID },
                defaults: { STATUS: finalStatus, ASSET: dev.HOSTNAME }
            });

            const prevStatus = asset.STATUS;

            if (!created && prevStatus !== finalStatus) {
                await DeviceLog.create({
                    PID: dev.PID,
                    HOSTNAME: dev.HOSTNAME,
                    PREVIOUS_STATUS: prevStatus,
                    NEW_STATUS: finalStatus,
                    METHOD: finalMethod,
                    LATENCY: pingResult.ms
                });

                await Asset.update(
                    { STATUS: finalStatus },
                    { where: { PID: dev.PID } }
                );

                if (finalStatus === 'DOWN' || finalStatus === 'UP') {
                    const isNotifEnabled = notificationPrefs[dev.PID] !== false && notificationPrefs[dev.HOSTNAME] !== false;
                    if (isNotifEnabled) {
                        sendTeamsAlert(dev, new Date().toLocaleString(), finalStatus, rcaInfo);
                    } else {
                        console.log(`🔕 Notifikasi ${finalStatus} untuk ${dev.HOSTNAME} (${dev.PID}) diskip.`);
                    }
                }
            } else if (created) {
                await DeviceLog.create({
                    PID: dev.PID,
                    HOSTNAME: dev.HOSTNAME,
                    PREVIOUS_STATUS: 'NEW',
                    NEW_STATUS: finalStatus,
                    METHOD: finalMethod,
                    LATENCY: pingResult.ms
                });
            }

            if (io) {
                io.emit('device:status_update', {
                    pid: dev.PID,
                    ip: dev.IP,
                    hostname: dev.HOSTNAME,
                    status: finalStatus,
                    latency: pingResult.ms,
                    updatedAt: new Date().toISOString(),
                    nvrData: nvrData,
                    snmpData: snmpData,
                    rca: rcaInfo
                });
            }
        }

        if (io) {
            io.emit('network:rca_report', rcaReport);
        }

        console.log(`✅ [Cron Engine] Selesai polling ${validDevices.length} perangkat pada ${new Date().toLocaleTimeString('id-ID')}\n`);
    } catch (err) {
        console.error('❌ [Cron Worker Error]:', err.message);
    }
};

/**
 * Inisialisasi Penjadwal
 */
export const initWorker = (io) => {
    // Jalankan polling otomatis setiap 2 menit ('*/2 * * * *')
    cron.schedule('*/2 * * * *', async () => {
        await processDevicePolling(io);
    });

    // Eksekusi 1x langsung saat server pertama kali menyala
    processDevicePolling(io);

    console.log('⚡ [Cron Engine] Device Polling Active (TCP & SNMP, interval 2 menit).');
};