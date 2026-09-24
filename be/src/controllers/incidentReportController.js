import { Op } from 'sequelize';
import IncidentReport from '../models/IncidentReport.js';
import DeviceAlert from '../models/DeviceAlert.js';
import { sendIncidentReportTeamsAlert } from '../services/teamsService.js';

/**
 * Controller untuk mengelola Arsip Berita Acara / Laporan Insiden IT
 */
export const getIncidentReports = async (req, res) => {
    try {
        const { status, limit = 100 } = req.query;
        const whereClause = {};
        if (status && status !== 'ALL') {
            if (status === 'OPEN' || status === 'IN_PROGRESS') {
                whereClause.status = { [Op.in]: ['OPEN', 'IN_PROGRESS', 'IN PROGRESS'] };
            } else {
                whereClause.status = status;
            }
        }

        const reports = await IncidentReport.findAll({
            where: whereClause,
            order: [['id', 'DESC']],
            limit: parseInt(limit, 10)
        });

        // Parse JSON devices list for easy FE usage
        const formatted = reports.map(r => {
            const json = r.toJSON();
            try {
                json.devices = JSON.parse(json.devicesJson);
            } catch (e) {
                json.devices = [];
            }
            return json;
        });

        return res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        console.error('❌ [getIncidentReports Error]:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil daftar arsip berita acara.',
            error: error.message
        });
    }
};

export const createIncidentReport = async (req, res) => {
    try {
        const {
            reportNumber,
            reportDate,
            reporter,
            discoveredTime,
            startTime,
            endTime,
            totalDowntime,
            status = 'OPEN',
            devices = [],
            primaryHostname,
            primaryIp,
            location,
            assignedTechnician,
            assignedTechnicianNik,
            symptom,
            impact,
            rootCause,
            actionTaken,
            createdBy = 'SYSTEM',
            sendToTeams = true
        } = req.body;

        if (!reportNumber) {
            return res.status(400).json({ success: false, message: 'Nomor Laporan wajib diisi.' });
        }

        const devicesJson = JSON.stringify(devices);

        // Check jika laporan dengan reportNumber ini sudah ada di database (Upsert)
        let report = await IncidentReport.findOne({ where: { reportNumber } });

        if (report) {
            // Update existing report
            report.reportDate = reportDate || report.reportDate;
            report.reporter = reporter || report.reporter;
            if (discoveredTime) report.discoveredTime = discoveredTime;
            if (startTime) report.startTime = startTime;
            if (endTime) report.endTime = endTime;
            if (totalDowntime) report.totalDowntime = totalDowntime;
            if (status) report.status = status;
            report.devicesJson = devicesJson;
            report.primaryHostname = primaryHostname || (devices[0]?.hostname || devices[0]?.name || report.primaryHostname);
            report.primaryIp = primaryIp || (devices[0]?.ip || report.primaryIp);
            report.location = location || (devices[0]?.location || report.location);
            if (assignedTechnician) report.assignedTechnician = assignedTechnician;
            if (assignedTechnicianNik) report.assignedTechnicianNik = assignedTechnicianNik;
            if (symptom) report.symptom = symptom;
            if (impact) report.impact = impact;
            if (rootCause) report.rootCause = rootCause;
            if (actionTaken) report.actionTaken = actionTaken;
            await report.save();
        } else {
            // Create new report
            report = await IncidentReport.create({
                reportNumber,
                reportDate: reportDate || new Date().toLocaleDateString('id-ID'),
                reporter: reporter || 'Sistem Monitoring IT',
                discoveredTime,
                startTime,
                endTime,
                totalDowntime,
                status,
                devicesJson,
                primaryHostname: primaryHostname || (devices[0]?.hostname || devices[0]?.name || 'Device'),
                primaryIp: primaryIp || (devices[0]?.ip || '-'),
                location: location || (devices[0]?.location || '-'),
                assignedTechnician,
                assignedTechnicianNik,
                symptom,
                impact,
                rootCause,
                actionTaken,
                createdBy
            });
        }

        // Auto-acknowledge DeviceAlert jika laporan ini menangani alert tersebut (via reportNumber ALERT-x atau hostname/IP yang matching)
        try {
            if (reportNumber && reportNumber.startsWith('ALERT-')) {
                const alertId = reportNumber.replace('ALERT-', '');
                await DeviceAlert.update(
                    {
                        IS_ACKNOWLEDGED: true,
                        ACK_BY: reporter || assignedTechnician || 'Operator',
                        ACK_AT: new Date(),
                        ACK_NOTE: `Ditangani via Laporan Gangguan No. ${report.reportNumber} (Status: ${report.status})`
                    },
                    { where: { id: alertId } }
                );
            } else if (report.primaryHostname || report.primaryIp) {
                // Acknowledge alert aktif yang cocok dengan perangkat yang dilaporkan
                const alertWhere = {};
                if (report.primaryIp && report.primaryIp !== '-') {
                    alertWhere.IP = report.primaryIp;
                } else if (report.primaryHostname) {
                    alertWhere.HOSTNAME = report.primaryHostname;
                }
                if (Object.keys(alertWhere).length > 0) {
                    await DeviceAlert.update(
                        {
                            IS_ACKNOWLEDGED: true,
                            ACK_BY: reporter || assignedTechnician || 'Operator',
                            ACK_AT: new Date(),
                            ACK_NOTE: `Ditangani via Laporan Gangguan No. ${report.reportNumber} (Status: ${report.status})`
                        },
                        { where: { ...alertWhere, IS_ACKNOWLEDGED: false } }
                    );
                }
            }
        } catch (alertAckErr) {
            console.error('⚠️ [Auto-Ack Alert Warning]:', alertAckErr.message);
        }

        // Broadcast / Kirim ke MS Teams jika diaktifkan
        if (sendToTeams) {
            sendIncidentReportTeamsAlert({
                reportNumber,
                reportDate: report.reportDate,
                reporter: report.reporter,
                assignedTechnician: report.assignedTechnician,
                assignedTechnicianNik: report.assignedTechnicianNik,
                discoveredTime: report.discoveredTime,
                startTime: report.startTime,
                endTime: report.endTime,
                totalDowntime: report.totalDowntime,
                status: report.status,
                devices,
                primaryHostname: report.primaryHostname,
                primaryIp: report.primaryIp,
                location: report.location,
                symptom: report.symptom,
                actionTaken: report.actionTaken,
                rootCause: report.rootCause
            }).catch(e => console.error('Teams alert async error:', e.message));
        }

        return res.status(200).json({
            success: true,
            message: 'Berita acara berhasil disimpan ke arsip.',
            data: report
        });
    } catch (error) {
        console.error('❌ [createIncidentReport Error]:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal menyimpan berita acara.',
            error: error.message
        });
    }
};

export const updateIncidentReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, endTime, totalDowntime, actionTaken, rootCause, assignedTechnician, assignedTechnicianNik, sendToTeams = true } = req.body;

        const report = await IncidentReport.findByPk(id);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Berita acara tidak ditemukan.' });
        }

        if (status) report.status = status;
        if (endTime !== undefined) report.endTime = endTime;
        if (totalDowntime !== undefined) report.totalDowntime = totalDowntime;
        if (actionTaken !== undefined) report.actionTaken = actionTaken;
        if (rootCause !== undefined) report.rootCause = rootCause;
        if (assignedTechnician !== undefined) report.assignedTechnician = assignedTechnician;
        if (assignedTechnicianNik !== undefined) report.assignedTechnicianNik = assignedTechnicianNik;

        await report.save();

        // Kirim update ke MS Teams jika status ditutup / diselesaikan
        if (sendToTeams) {
            let devices = [];
            try {
                devices = JSON.parse(report.devicesJson);
            } catch (e) {}

            sendIncidentReportTeamsAlert({
                reportNumber: report.reportNumber,
                reportDate: report.reportDate,
                reporter: report.reporter,
                assignedTechnician: report.assignedTechnician,
                assignedTechnicianNik: report.assignedTechnicianNik,
                discoveredTime: report.discoveredTime,
                startTime: report.startTime,
                endTime: report.endTime,
                totalDowntime: report.totalDowntime,
                status: report.status,
                devices,
                primaryHostname: report.primaryHostname,
                primaryIp: report.primaryIp,
                location: report.location,
                symptom: report.symptom,
                actionTaken: report.actionTaken,
                rootCause: report.rootCause
            }).catch(e => console.error('Teams alert async error:', e.message));
        }

        return res.json({
            success: true,
            message: `Status Berita Acara diperbarui menjadi ${report.status}`,
            data: report
        });
    } catch (error) {
        console.error('❌ [updateIncidentReportStatus Error]:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal memperbarui status berita acara.',
            error: error.message
        });
    }
};

export const deleteIncidentReport = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await IncidentReport.findByPk(id);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Berita acara tidak ditemukan.' });
        }

        await report.destroy();
        return res.json({
            success: true,
            message: 'Berita acara berhasil dihapus dari arsip.'
        });
    } catch (error) {
        console.error('❌ [deleteIncidentReport Error]:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal menghapus berita acara.',
            error: error.message
        });
    }
};
