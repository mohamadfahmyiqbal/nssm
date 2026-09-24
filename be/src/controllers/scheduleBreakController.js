import ScheduleBreak from '../models/ScheduleBreak.js';
import { Op } from 'sequelize';

// Sync table if needed
ScheduleBreak.sync({ alter: true }).catch(err => {
    console.error('⚠️ [ScheduleBreak Sync Error]:', err.message);
});

/**
 * Get all schedule breaks by technician
 */
export const getScheduleBreaks = async (req, res) => {
    try {
        const { technicianNik } = req.query;
        const where = {};

        if (technicianNik && technicianNik !== 'ALL') {
            where[Op.or] = [
                { technicianNik: 'ALL' },
                { technicianNik }
            ];
        }

        const breaks = await ScheduleBreak.findAll({
            where,
            order: [['startTime', 'ASC']]
        });

        return res.status(200).json({
            success: true,
            total: breaks.length,
            data: breaks
        });
    } catch (error) {
        console.error('❌ [getScheduleBreaks Error]:', error);
        return res.status(500).json({
            success: false,
            error: 'Gagal mengambil data jadwal istirahat.',
            details: error.message
        });
    }
};

/**
 * Create a new schedule break
 */
export const createScheduleBreak = async (req, res) => {
    try {
        const {
            technicianNik = 'ALL',
            technicianName = 'Semua Teknisi',
            label = 'Istirahat',
            startTime = '12:00',
            endTime = '13:00',
            notes = ''
        } = req.body;

        if (!startTime || !endTime) {
            return res.status(400).json({
                success: false,
                error: 'Jam Mulai dan Jam Selesai wajib diisi.'
            });
        }

        // Calculate duration in minutes
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        const startMins = (sh || 0) * 60 + (sm || 0);
        const endMins = (eh || 0) * 60 + (em || 0);
        const durationMinutes = Math.max(5, endMins - startMins);

        const newBreak = await ScheduleBreak.create({
            technicianNik,
            technicianName,
            label,
            startTime,
            endTime,
            durationMinutes,
            notes
        });

        return res.status(201).json({
            success: true,
            message: 'Jadwal istirahat berhasil ditambahkan.',
            data: newBreak
        });
    } catch (error) {
        console.error('❌ [createScheduleBreak Error]:', error);
        return res.status(500).json({
            success: false,
            error: 'Gagal menambahkan jadwal istirahat.',
            details: error.message
        });
    }
};

/**
 * Update an existing schedule break
 */
export const updateScheduleBreak = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            technicianNik,
            technicianName,
            label,
            startTime,
            endTime,
            notes
        } = req.body;

        const breakItem = await ScheduleBreak.findByPk(id);
        if (!breakItem) {
            return res.status(404).json({
                success: false,
                error: 'Jadwal istirahat tidak ditemukan.'
            });
        }

        const updateData = {};
        if (technicianNik !== undefined) updateData.technicianNik = technicianNik;
        if (technicianName !== undefined) updateData.technicianName = technicianName;
        if (label !== undefined) updateData.label = label;
        if (startTime !== undefined) updateData.startTime = startTime;
        if (endTime !== undefined) updateData.endTime = endTime;
        if (notes !== undefined) updateData.notes = notes;

        const effectiveStart = startTime || breakItem.startTime;
        const effectiveEnd = endTime || breakItem.endTime;
        if (effectiveStart && effectiveEnd) {
            const [sh, sm] = effectiveStart.split(':').map(Number);
            const [eh, em] = effectiveEnd.split(':').map(Number);
            const startMins = (sh || 0) * 60 + (sm || 0);
            const endMins = (eh || 0) * 60 + (em || 0);
            updateData.durationMinutes = Math.max(5, endMins - startMins);
        }

        await breakItem.update(updateData);

        return res.status(200).json({
            success: true,
            message: 'Jadwal istirahat berhasil diperbarui.',
            data: breakItem
        });
    } catch (error) {
        console.error('❌ [updateScheduleBreak Error]:', error);
        return res.status(500).json({
            success: false,
            error: 'Gagal memperbarui jadwal istirahat.',
            details: error.message
        });
    }
};

/**
 * Delete a schedule break
 */
export const deleteScheduleBreak = async (req, res) => {
    try {
        const { id } = req.params;
        const breakItem = await ScheduleBreak.findByPk(id);
        if (!breakItem) {
            return res.status(404).json({
                success: false,
                error: 'Jadwal istirahat tidak ditemukan.'
            });
        }

        await breakItem.destroy();

        return res.status(200).json({
            success: true,
            message: 'Jadwal istirahat berhasil dihapus.'
        });
    } catch (error) {
        console.error('❌ [deleteScheduleBreak Error]:', error);
        return res.status(500).json({
            success: false,
            error: 'Gagal menghapus jadwal istirahat.',
            details: error.message
        });
    }
};
