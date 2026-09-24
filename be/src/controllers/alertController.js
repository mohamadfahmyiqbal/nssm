import DeviceLog from '../models/DeviceLog.js';
import DeviceAlert from '../models/DeviceAlert.js';

// GET /api/alerts
export const getSmartAlerts = async (req, res) => {
    try {
        const alerts = await DeviceAlert.findAll({
            order: [['RECORDED_AT', 'DESC']],
            limit: 200
        });

        res.status(200).json({
            success: true,
            data: alerts
        });
    } catch (error) {
        console.error('❌ [Get Smart Alerts Error]:', error);
        res.status(500).json({ success: false, error: 'Gagal mengambil daftar alert cerdas.' });
    }
};

// POST /api/alerts/:id/ack
export const ackSmartAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const { note, user } = req.body;

        const alert = await DeviceAlert.findByPk(id);
        if (!alert) {
            return res.status(404).json({ success: false, error: 'Smart alert not found' });
        }

        alert.IS_ACKNOWLEDGED = true;
        alert.ACK_BY = user || 'Operator';
        alert.ACK_AT = new Date();
        alert.ACK_NOTE = note || 'Acknowledged by operator';
        await alert.save();

        res.json({ success: true, message: 'Smart alert acknowledged successfully', data: alert });
    } catch (error) {
        console.error('❌ [Ack Smart Alert Error]:', error);
        res.status(500).json({ success: false, error: 'Gagal acknowledge smart alert.' });
    }
};

// POST /api/logs/:id/ack
export const acknowledgeAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const { note, user } = req.body;

        const log = await DeviceLog.findByPk(id);
        
        if (!log) {
            return res.status(404).json({ success: false, error: 'Alert not found' });
        }

        // Update the log with ACK details
        log.IS_ACKNOWLEDGED = true;
        log.ACK_BY = user || 'Operator';
        log.ACK_AT = new Date();
        log.ACK_NOTE = note || 'Acknowledged by operator';
        
        await log.save();

        res.json({ success: true, message: 'Alert acknowledged successfully', data: log });
    } catch (error) {
        console.error('❌ [Acknowledge Alert Error]:', error);
        res.status(500).json({ success: false, error: 'Gagal melakukan acknowledge alert.' });
    }
};
