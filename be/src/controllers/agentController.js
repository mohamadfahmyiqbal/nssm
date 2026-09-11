import Network from '../models/Network.js';
import Asset from '../models/Asset.js';
import Setting from '../models/Setting.js';
import DeviceLog from '../models/DeviceLog.js';
import TopologyEdge from '../models/TopologyEdge.js';
import { inferSwitchStatus } from '../services/topologyService.js';
import { sendTeamsAlert } from '../services/teamsService.js';
import { io as getIo } from '../../server.js';
import { globalNvrCache } from '../utils/cache.js';

export const getPollingTasks = async (req, res) => {
    try {
        const agentId = req.query.agent_id || null;
        
        // Ambil device berdasarkan agent_id jika disediakan
        const whereClause = agentId ? { AGENT_ID: agentId } : {};
        const devices = await Network.findAll({ where: whereClause });
        
        const validDevices = devices.filter((dev) => dev.IP && dev.IP !== '-');

        console.log(`🤖 [Agent] Agent ${agentId || 'Unknown'} requesting polling tasks. Total tasks: ${validDevices.length}`);

        if (validDevices.length === 0) {
            return res.json({ tasks: [], credentials: {}, pollingOverrides: {} });
        }

        // Ambil konfigurasi kredensial SNMP
        const snmpSetting = await Setting.findOne({ where: { key: 'snmp_credentials' } });
        let credentials = {};
        if (snmpSetting && snmpSetting.value) {
            try { credentials = JSON.parse(snmpSetting.value); } catch (e) { }
        }

        // Ambil override metode koneksi
        const methodSetting = await Setting.findOne({ where: { key: 'polling_methods' } });
        let pollingOverrides = {};
        if (methodSetting && methodSetting.value) {
            try { pollingOverrides = JSON.parse(methodSetting.value); } catch (e) { }
        }

        // Ambil konfigurasi notifikasi (untuk dikirim ke agent atau disaring di server, 
        // lebih baik disaring di server saat memproses hasil)
        
        res.json({
            tasks: validDevices,
            credentials,
            pollingOverrides
        });
    } catch (err) {
        console.error('❌ [AgentController GET Tasks Error]:', err.message);
        res.status(500).json({ error: err.message });
    }
};

export const submitPollingResults = async (req, res) => {
    try {
        const { results } = req.body;
        if (!results || !Array.isArray(results)) {
            return res.status(400).json({ error: 'Invalid payload, expected array of results' });
        }

        // Ambil konfigurasi notifikasi
        const notifSetting = await Setting.findOne({ where: { key: 'notification_preferences' } });
        let notificationPrefs = {};
        if (notifSetting && notifSetting.value) {
            try { notificationPrefs = JSON.parse(notifSetting.value); } catch (e) { }
        }
        
        const snmpSetting = await Setting.findOne({ where: { key: 'snmp_credentials' } });
        let credentials = {};
        if (snmpSetting && snmpSetting.value) {
            try { credentials = JSON.parse(snmpSetting.value); } catch (e) { }
        }

        const deviceStatusMap = new Map();
        const prefetchedSwitchData = {};
        const io = getIo; // Mengambil instance io
        const allDevices = await Network.findAll();

        // [PASS 1] Populate deviceStatusMap awal dengan status mentah
        for (const result of results) {
            deviceStatusMap.set(result.PID, result.newStatus);
            if (result.switchData) {
                prefetchedSwitchData[result.IP] = result.switchData;
            }
        }

        // Ambil data topologi untuk RCA
        const edges = await TopologyEdge.findAll();

        // Helper untuk mengecek apakah parent mati
        const isParentDown = (childPid) => {
            const edge = edges.find(e => e.target === childPid);
            if (!edge) return false;
            const parentStatus = deviceStatusMap.get(edge.source);
            return parentStatus === 'DOWN' || parentStatus === 'UNREACHABLE';
        };

        // Topological override pada map memori terlebih dahulu!
        await inferSwitchStatus(allDevices, deviceStatusMap, credentials, io, null, prefetchedSwitchData);

        // [PASS 2] Simpan final status ke DB dengan RCA
        for (let result of results) {
            let { PID, HOSTNAME, IP, newStatus, finalMethod, latency, nvrData } = result;

            // Dapatkan final status dari map hasil inferensi
            newStatus = deviceStatusMap.get(PID) || newStatus;

            // RCA Logic: Jika device DOWN tapi parent-nya juga DOWN, jadikan UNREACHABLE
            if (newStatus === 'DOWN' && isParentDown(PID)) {
                newStatus = 'UNREACHABLE';
                deviceStatusMap.set(PID, 'UNREACHABLE'); // update map
            }

            const [asset, created] = await Asset.findOrCreate({
                where: { PID: PID },
                defaults: { STATUS: newStatus, ASSET: HOSTNAME }
            });

            const prevStatus = asset.STATUS;
            
            // Reconstruct pseudo dev object for sendTeamsAlert
            const dev = { PID, HOSTNAME, IP };

            if (!created && prevStatus !== newStatus) {
                await DeviceLog.create({
                    PID,
                    HOSTNAME,
                    PREVIOUS_STATUS: prevStatus,
                    NEW_STATUS: newStatus,
                    METHOD: finalMethod,
                    LATENCY: latency
                });

                await Asset.update(
                    { STATUS: newStatus },
                    { where: { PID } }
                );

                if (newStatus === 'DOWN' || newStatus === 'UP') {
                    const isNotifEnabled = notificationPrefs[PID] !== false && notificationPrefs[HOSTNAME] !== false;
                    if (isNotifEnabled) {
                        sendTeamsAlert(dev, new Date().toLocaleString(), newStatus);
                    }
                }
            } else if (created) {
                await DeviceLog.create({
                    PID,
                    HOSTNAME,
                    PREVIOUS_STATUS: 'NEW',
                    NEW_STATUS: newStatus,
                    METHOD: finalMethod,
                    LATENCY: latency
                });
            }

            if (nvrData) {
                globalNvrCache.set(String(PID).trim(), nvrData);
            }

            if (io) {
                io.emit('device:status_update', {
                    pid: PID,
                    ip: IP,
                    hostname: HOSTNAME,
                    status: newStatus,
                    latency: latency,
                    updatedAt: new Date().toISOString(),
                    nvrData: nvrData
                });
            }
        }

        console.log(`🤖 [Agent] Received and processed ${results.length} polling results.`);
        res.json({ message: 'Results processed successfully' });
    } catch (err) {
        console.error('❌ [AgentController POST Results Error]:', err.message);
        res.status(500).json({ error: err.message });
    }
};
