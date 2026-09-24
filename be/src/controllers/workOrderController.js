import WorkOrder from '../models/WorkOrder.js';
import Akses from '../models/Akses.js';
import IncidentReport from '../models/IncidentReport.js';
import { Op } from 'sequelize';

// Inisialisasi tabel jika belum ada
WorkOrder.sync({ alter: true }).catch(err => {
    console.error('⚠️ [WorkOrder Sync Error]:', err.message);
});

/**
 * Mendapatkan daftar semua Work Order dengan filter
 */
export const getAllWorkOrders = async (req, res) => {
    try {
        const { type, status, priority, technicianNik, date } = req.query;
        const where = {};

        if (type && type !== 'ALL') {
            where.woType = type;
        }
        if (status && status !== 'ALL') {
            where.status = status;
        }
        if (priority && priority !== 'ALL') {
            where.priority = priority;
        }
        if (technicianNik && technicianNik !== 'ALL') {
            where.assignedTechnicianNik = technicianNik;
        }
        if (date) {
            where.targetDate = date;
        }

        const workOrders = await WorkOrder.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            total: workOrders.length,
            data: workOrders
        });
    } catch (error) {
        console.error('❌ [getAllWorkOrders Error]:', error);
        return res.status(500).json({
            success: false,
            error: 'Gagal mengambil data work order.',
            details: error.message
        });
    }
};

/**
 * Mendapatkan statistik ringkasan Work Order dan beban Man Power
 */
export const getWorkOrderSummary = async (req, res) => {
    try {
        const allWos = await WorkOrder.findAll();
        const technicians = await Akses.findAll({
            attributes: ['NIK', 'NAMA', 'DEPT', 'AKSES']
        });

        const summary = {
            total: allWos.length,
            open: allWos.filter(w => w.status === 'OPEN').length,
            assigned: allWos.filter(w => w.status === 'ASSIGNED').length,
            inProgress: allWos.filter(w => w.status === 'IN_PROGRESS').length,
            resolved: allWos.filter(w => w.status === 'RESOLVED' || w.status === 'CLOSED').length,
            preventiveCount: allWos.filter(w => w.woType === 'PREVENTIVE_MAINTENANCE').length,
            incidentCount: allWos.filter(w => w.woType === 'INCIDENT_ANOMALY').length
        };

        // Beban kerja per teknisi
        const technicianWorkloads = technicians.map(t => {
            const techNik = String(t.NIK || '').trim();
            const techName = String(t.NAMA || '').trim().toLowerCase();

            const assignedWos = allWos.filter(w => {
                const wNik = String(w.assignedTechnicianNik || '').trim();
                const wName = String(w.assignedTechnicianName || '').trim().toLowerCase();
                const isMatched = (techNik && wNik === techNik) || (techName && wName === techName);
                const isNotClosed = w.status !== 'CLOSED' && w.status !== 'RESOLVED';
                return isMatched && isNotClosed;
            });

            const totalHours = assignedWos.reduce((sum, w) => sum + (parseFloat(w.estimatedHours) || 1), 0);
            return {
                nik: t.NIK,
                name: t.NAMA,
                dept: t.DEPT,
                activeTaskCount: assignedWos.length,
                totalEstimatedHours: Number(totalHours.toFixed(1))
            };
        });

        return res.status(200).json({
            success: true,
            summary,
            technicianWorkloads
        });
    } catch (error) {
        console.error('❌ [getWorkOrderSummary Error]:', error);
        return res.status(500).json({
            success: false,
            error: 'Gagal mengambil ringkasan work order.',
            details: error.message
        });
    }
};

/**
 * Membuat Work Order Baru (Manual atau dari Schedule / Incident)
 */
export const createWorkOrder = async (req, res) => {
    try {
        const {
            woType,
            title,
            description,
            priority = 'MEDIUM',
            status = 'ASSIGNED',
            targetDate,
            startTime = '08:00',
            endTime = '10:00',
            estimatedHours = 1.0,
            targetDurationMinutes = 0,
            actualHours,
            actualStartTime,
            actualEndTime,
            actualDurationMinutes,
            assignedTechnicianNik,
            assignedTechnicianName,
            teamMembers,
            devices,
            referenceId,
            sourceMetadata,
            remarks
        } = req.body;

        if (!title || !woType) {
            return res.status(400).json({
                success: false,
                error: 'Judul dan Tipe Work Order wajib diisi.'
            });
        }

        // Generate WO Number unik: WO-YYYYMMDD-XXXX
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const prefix = woType === 'PREVENTIVE_MAINTENANCE' ? 'WO-PM' : 'WO-INC';
        const woNumber = `${prefix}-${dateStr}-${randomNum}`;

        const newWorkOrder = await WorkOrder.create({
            woNumber,
            woType,
            title,
            description,
            priority,
            status,
            targetDate: targetDate || new Date().toISOString().slice(0, 10),
            startTime: startTime || '08:00',
            endTime: endTime || '10:00',
            estimatedHours: parseFloat(estimatedHours) || 1.0,
            targetDurationMinutes: parseInt(targetDurationMinutes, 10) || 0,
            actualHours: actualHours !== undefined && actualHours !== '' ? parseFloat(actualHours) : null,
            actualStartTime: actualStartTime || null,
            actualEndTime: actualEndTime || null,
            actualDurationMinutes: actualDurationMinutes !== undefined && actualDurationMinutes !== '' ? parseInt(actualDurationMinutes, 10) : null,
            assignedTechnicianNik,
            assignedTechnicianName,
            teamMembersJson: teamMembers ? JSON.stringify(teamMembers) : null,
            devicesJson: devices ? JSON.stringify(devices) : null,
            referenceId: referenceId ? String(referenceId) : null,
            sourceMetadataJson: sourceMetadata ? JSON.stringify(sourceMetadata) : null,
            remarks: remarks || null,
            createdBy: req.user?.username || 'ADMIN'
        });

        return res.status(201).json({
            success: true,
            message: 'Work Order berhasil dibuat.',
            data: newWorkOrder
        });
    } catch (error) {
        console.error('❌ [createWorkOrder Error]:', error);
        return res.status(500).json({
            success: false,
            error: 'Gagal membuat work order baru.',
            details: error.message
        });
    }
};

/**
 * Update Man Power & Status Work Order
 */
export const updateWorkOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            priority,
            status,
            targetDate,
            startTime,
            endTime,
            estimatedHours,
            targetDurationMinutes,
            actualHours,
            actualStartTime,
            actualEndTime,
            actualDurationMinutes,
            assignedTechnicianNik,
            assignedTechnicianName,
            teamMembers,
            devices,
            completionNotes,
            remarks
        } = req.body;

        const workOrder = await WorkOrder.findByPk(id);
        if (!workOrder) {
            return res.status(404).json({
                success: false,
                error: 'Work Order tidak ditemukan.'
            });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (priority !== undefined) updateData.priority = priority;
        if (status !== undefined) {
            updateData.status = status;
            if (status === 'RESOLVED' || status === 'CLOSED') {
                updateData.completedAt = new Date();
            }
        }
        if (targetDate !== undefined) updateData.targetDate = targetDate;
        if (startTime !== undefined) updateData.startTime = startTime;
        if (endTime !== undefined) updateData.endTime = endTime;
        if (estimatedHours !== undefined) updateData.estimatedHours = parseFloat(estimatedHours);
        if (targetDurationMinutes !== undefined) updateData.targetDurationMinutes = parseInt(targetDurationMinutes, 10) || 0;
        if (actualHours !== undefined) updateData.actualHours = actualHours !== '' && actualHours !== null ? parseFloat(actualHours) : null;
        if (actualStartTime !== undefined) updateData.actualStartTime = actualStartTime || null;
        if (actualEndTime !== undefined) updateData.actualEndTime = actualEndTime || null;
        if (actualDurationMinutes !== undefined) updateData.actualDurationMinutes = actualDurationMinutes !== '' && actualDurationMinutes !== null ? parseInt(actualDurationMinutes, 10) : null;
        if (assignedTechnicianNik !== undefined) updateData.assignedTechnicianNik = assignedTechnicianNik;
        if (assignedTechnicianName !== undefined) updateData.assignedTechnicianName = assignedTechnicianName;
        if (teamMembers !== undefined) updateData.teamMembersJson = JSON.stringify(teamMembers);
        if (devices !== undefined) updateData.devicesJson = JSON.stringify(devices);
        if (completionNotes !== undefined) updateData.completionNotes = completionNotes;
        if (remarks !== undefined) updateData.remarks = remarks;

        await workOrder.update(updateData);

        return res.status(200).json({
            success: true,
            message: 'Work Order berhasil diperbarui.',
            data: workOrder
        });
    } catch (error) {
        console.error('❌ [updateWorkOrder Error]:', error);
        return res.status(500).json({
            success: false,
            error: 'Gagal memperbarui work order.',
            details: error.message
        });
    }
};

/**
 * Menghapus Work Order
 */
export const deleteWorkOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const workOrder = await WorkOrder.findByPk(id);
        if (!workOrder) {
            return res.status(404).json({
                success: false,
                error: 'Work Order tidak ditemukan.'
            });
        }

        await workOrder.destroy();
        return res.status(200).json({
            success: true,
            message: 'Work Order berhasil dihapus.'
        });
    } catch (error) {
        console.error('❌ [deleteWorkOrder Error]:', error);
        return res.status(500).json({
            success: false,
            error: 'Gagal menghapus work order.',
            details: error.message
        });
    }
};
