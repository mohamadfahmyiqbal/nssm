import { Op, Sequelize } from 'sequelize';
import Network from '../../models/Network.js';
import Asset from '../../models/Asset.js';
import DeviceTelemetryLog from '../../models/DeviceTelemetryLog.js';
import { resolveVendorProfile, fetchVendorMetrics } from '../../services/vendorSnmpService.js';
import { evaluateSmartThresholdsAndAnomalies } from '../../services/anomalyService.js';
import { resolveDeviceSnmpCredential, getCustomVendorProfiles } from './snmpHelper.js';

// GET /api/devices/:ip/nvr-snmp
export const getNvrSnmp = async (req, res) => {
    const { ip } = req.params;

    try {
        const device = await Network.findOne({ where: { IP: ip } });
        const credential = await resolveDeviceSnmpCredential(ip, device);
        const customProfiles = await getCustomVendorProfiles();

        const profile = resolveVendorProfile(device?.VENDOR, device?.TYPE || 'nvr', device?.HOSTNAME, customProfiles);
        const metrics = await fetchVendorMetrics(ip, credential, profile);

        if (device) {
            Asset.update({ STATUS: 'UP' }, {
                where: {
                    [Op.or]: [
                        { PID: device.PID },
                        { HOSTNAME: device.HOSTNAME }
                    ]
                }
            }).catch(() => {});
        }

        return res.status(200).json({
            success: true,
            data: {
                info: {
                    manufacturer: metrics.info.manufacturer || metrics.vendor,
                    model: metrics.info.model || metrics.info.deviceModel || 'N/A',
                    serialNumber: metrics.info.serialNumber || 'N/A',
                    firmware: metrics.info.firmware || 'N/A',
                    userAccessCount: metrics.info.userAccessCount || '0',
                    alarmSummary: metrics.info.alarmSummary || 'Normal',
                    temperature: metrics.info.temperature || metrics.resources.temperature || null,
                    sysDescr: metrics.info.sysDescr || 'N/A',
                    uptime: metrics.info.uptime || 'N/A'
                },
                hdd: metrics.hdd || [],
                cameras: metrics.cameras || [],
                resources: metrics.resources || {},
                vendor: metrics.vendor
            }
        });
    } catch (error) {
        console.error(`❌ [NVR SNMP Error] on ${ip}:`, error.toString());
        return res.status(500).json({ success: false, error: 'Gagal mengambil data NVR', details: error.toString() });
    }
};

// GET /api/devices/:ip/metrics
export const getDeviceVendorMetrics = async (req, res) => {
    const { ip } = req.params;

    try {
        const cleanIp = String(ip).trim();
        const device = await Network.findOne({ 
            where: { 
                [Op.or]: [
                    { IP: cleanIp },
                    Sequelize.where(Sequelize.fn('TRIM', Sequelize.col('IP')), cleanIp)
                ]
            } 
        });
        
        const customProfiles = await getCustomVendorProfiles();
        const profile = resolveVendorProfile(device?.VENDOR, device?.TYPE, device?.HOSTNAME, customProfiles);
        const credential = await resolveDeviceSnmpCredential(ip, device);

        const metrics = await fetchVendorMetrics(ip, credential, profile);
        console.log(`🔍 [Vendor Metrics Fetch] IP: ${ip}, Device Vendor: "${device?.VENDOR}", Resolved Profile: "${profile.id}", Success: ${!!metrics}`);
        if (metrics) {
            console.log(`   Data Info:`, JSON.stringify(metrics.info));
            console.log(`   Data Resources:`, JSON.stringify(metrics.resources));
        }

        if (metrics && device) {
            await Asset.update({ STATUS: 'UP' }, {
                where: {
                    [Op.or]: [
                        { PID: device.PID },
                        { HOSTNAME: device.HOSTNAME }
                    ]
                }
            }).catch(() => {});

            // Record Time-Series Telemetry Log
            try {
                const parseNum = (v) => {
                    if (!v || v === 'N/A' || v === '-') return null;
                    const num = parseFloat(String(v).replace(/[^0-9.]/g, ''));
                    return isNaN(num) ? null : num;
                };

                const cpuVal = parseNum(metrics.resources?.cpu);
                const ramVal = parseNum(metrics.resources?.memory);
                const tempVal = parseNum(metrics.resources?.temperature || metrics.info?.temperature);
                const trafficInVal = parseNum(metrics.resources?.trafficIn);
                const trafficOutVal = parseNum(metrics.resources?.trafficOut);

                await DeviceTelemetryLog.create({
                    PID: device.PID,
                    IP: device.IP,
                    DEVICE_TYPE: device.TYPE || (profile.isSwitch ? 'switch' : (profile.isNvr ? 'nvr' : 'device')),
                    CPU_USAGE: cpuVal,
                    RAM_USAGE: ramVal,
                    TEMPERATURE: tempVal,
                    TRAFFIC_IN: trafficInVal ? Math.round(trafficInVal * 1024 * 1024) : null,
                    TRAFFIC_OUT: trafficOutVal ? Math.round(trafficOutVal * 1024 * 1024) : null,
                    PORT_DATA: metrics.ports ? JSON.stringify(metrics.ports) : null,
                    RECORDED_AT: new Date()
                });

                // Evaluasi Ambang Batas Cerdas & Deteksi Anomali
                await evaluateSmartThresholdsAndAnomalies(device, metrics, req.io);
            } catch (logErr) {
                console.error('⚠️ [Telemetry Log Ingestion Error]:', logErr.message);
            }

            if (req.io) {
                req.io.emit('device:status_update', {
                    pid: device.PID,
                    ip: device.IP,
                    hostname: device.HOSTNAME,
                    status: 'UP',
                    updatedAt: new Date().toISOString(),
                    snmpData: {
                        ...metrics.info,
                        ports: metrics.ports || [],
                        ...metrics.resources
                    }
                });
            }
        }

        return res.status(200).json({
            success: true,
            data: metrics
        });
    } catch (error) {
        console.error('❌ [Vendor Metrics Error]:', error);
        return res.status(500).json({ success: false, error: 'Gagal mengambil metrik vendor perangkat' });
    }
};
