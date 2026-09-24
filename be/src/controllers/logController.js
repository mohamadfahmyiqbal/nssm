import DeviceLog from '../models/DeviceLog.js';
import { generateLogSummaryAndTriage } from '../services/logTriageService.js';

export const getDeviceLogs = async (req, res) => {
    try {
        const logs = await DeviceLog.findAll({
            order: [['createdAt', 'DESC']],
            limit: 500
        });

        res.status(200).json({
            success: true,
            data: logs
        });
    } catch (err) {
        console.error('Failed to fetch device logs:', err.message);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil histori log',
            error: err.message
        });
    }
};

// GET /api/logs/summary
export const getLogSummary = async (req, res) => {
    try {
        const { window = '24h' } = req.query;
        const summaryData = await generateLogSummaryAndTriage(window);

        res.status(200).json({
            success: true,
            data: summaryData
        });
    } catch (err) {
        console.error('Failed to generate log summary:', err.message);
        res.status(500).json({
            success: false,
            message: 'Gagal memproses ringkasan dan triage log',
            error: err.message
        });
    }
};
