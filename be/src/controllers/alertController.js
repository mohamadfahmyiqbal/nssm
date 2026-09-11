import DeviceLog from '../models/DeviceLog.js';

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
