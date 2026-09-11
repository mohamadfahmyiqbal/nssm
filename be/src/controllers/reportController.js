import Asset from '../models/Asset.js';
import DeviceLog from '../models/DeviceLog.js';
import Network from '../models/Network.js';
import { Op } from 'sequelize';

export const getSlaReport = async (req, res) => {
    try {
        const days = 7;
        const periodMs = days * 24 * 60 * 60 * 1000;
        const startTime = new Date(Date.now() - periodMs);
        const now = new Date();

        // Ambil semua perangkat terdaftar
        const networks = await Network.findAll();
        // Ambil semua aset
        const assets = await Asset.findAll();
        // Ambil semua log 7 hari ke belakang
        const logs = await DeviceLog.findAll({
            where: { createdAt: { [Op.gte]: startTime } },
            order: [['createdAt', 'ASC']]
        });

        const reportData = [];

        for (const net of networks) {
            if (!net.PID) continue;

            const asset = assets.find(a => a.PID === net.PID);
            const deviceLogs = logs.filter(l => l.PID === net.PID);

            let downtimeMs = 0;
            let incidentCount = 0;
            let lastDownTime = null;

            // Hitung downtime dari logs
            for (const log of deviceLogs) {
                if (log.NEW_STATUS === 'DOWN') {
                    if (!lastDownTime) {
                        lastDownTime = new Date(log.createdAt);
                        incidentCount++;
                    }
                } else if (log.NEW_STATUS === 'UP') {
                    if (lastDownTime) {
                        downtimeMs += (new Date(log.createdAt) - lastDownTime);
                        lastDownTime = null;
                    }
                }
            }

            // Jika sampai saat ini masih DOWN
            if (lastDownTime) {
                downtimeMs += (now - lastDownTime);
            }

            // Cek edge case: tidak ada log dalam 7 hari terakhir, tetapi status saat ini DOWN
            if (deviceLogs.length === 0 && asset && asset.STATUS === 'DOWN') {
                downtimeMs = periodMs;
                incidentCount = 1;
            }

            // Kalkulasi persentase SLA
            const uptimeMs = periodMs - downtimeMs;
            let slaPercent = (uptimeMs / periodMs) * 100;
            if (slaPercent < 0) slaPercent = 0;

            let healthStatus = 'Critical';
            if (slaPercent > 99) {
                healthStatus = 'Optimal';
            } else if (slaPercent >= 95) {
                healthStatus = 'Warning';
            }

            const downtimeMinutes = Math.floor(downtimeMs / 60000);

            reportData.push({
                id: net.PID,
                device: net.HOSTNAME || '-',
                ip: net.IP || '-',
                vendor: 'Generic', // Idealnya diambil dari Network table jika ada Merek
                sla: slaPercent.toFixed(2) + '%',
                incidents: incidentCount,
                downtime: downtimeMinutes + 'm',
                status: healthStatus
            });
        }

        res.json({ success: true, data: reportData });
    } catch (error) {
        console.error('❌ [Report Controller Error]:', error.message);
        res.status(500).json({ success: false, message: 'Gagal menghitung laporan SLA', error: error.message });
    }
};
