import { Op } from 'sequelize';
import Network from '../../models/Network.js';
import DeviceTelemetryLog from '../../models/DeviceTelemetryLog.js';
import { runPredictiveAnalysis } from '../../services/predictiveService.js';

// GET /api/devices/:pid/history?range=1h|24h|7d|30d
export const getDeviceTelemetryHistory = async (req, res) => {
    const { pid } = req.params;
    const { range = '24h' } = req.query;

    try {
        let startTime = new Date();
        if (range === '1h') startTime.setHours(startTime.getHours() - 1);
        else if (range === '24h') startTime.setHours(startTime.getHours() - 24);
        else if (range === '7d') startTime.setDate(startTime.getDate() - 7);
        else if (range === '30d') startTime.setDate(startTime.getDate() - 30);
        else startTime.setHours(startTime.getHours() - 24);

        const logs = await DeviceTelemetryLog.findAll({
            where: {
                [Op.or]: [
                    { PID: pid },
                    { IP: pid }
                ],
                RECORDED_AT: {
                    [Op.gte]: startTime
                }
            },
            order: [['RECORDED_AT', 'ASC']],
            limit: 2000
        });

        return res.status(200).json({
            success: true,
            pid,
            range,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        console.error('❌ [Telemetry History Error]:', error.message);
        return res.status(500).json({ success: false, error: 'Gagal mengambil data historis telemetri' });
    }
};

// GET /api/devices/:pid/predictions
export const getDevicePredictions = async (req, res) => {
    try {
        const { pid } = req.params;
        const device = await Network.findOne({
            where: {
                [Op.or]: [{ PID: pid }, { IP: pid }]
            }
        });

        if (!device) {
            return res.status(404).json({ success: false, message: 'Perangkat tidak ditemukan' });
        }

        const predictionData = await runPredictiveAnalysis(device.PID);

        return res.status(200).json({
            success: true,
            pid: device.PID,
            hostname: device.HOSTNAME,
            ip: device.IP,
            data: predictionData
        });
    } catch (error) {
        console.error('❌ [Predictions Controller Error]:', error.message);
        return res.status(500).json({ success: false, error: 'Gagal menganalisis prediksi perangkat' });
    }
};
