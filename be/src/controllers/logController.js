import DeviceLog from '../models/DeviceLog.js';

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
