import express from 'express';
import sequelize from '../config/database.js';
import { loginUser } from '../controllers/authController.js';
import {
    getAllDevices,
    createDevice,
    updateDevice,
    pingDevice,
    deleteDevice,
    bulkDeleteDevices
} from '../controllers/deviceController.js';
import {
    getDeviceSnmp,
    getNvrSnmp,
    testSnmp,
    getDeviceVendorMetrics,
    getDeviceTelemetryHistory,
    getDevicePredictions
} from '../controllers/snmpController.js';
import {
    getAllFloorplans,
    getFloorplanById,
    saveFloorplan,
    deleteFloorplan
} from '../controllers/floorplanController.js';
import {
    saveSetting,
    getSettingByKey
} from '../controllers/settingController.js';
import {
    getTopology,
    getAllTopologyDrawings,
    getTopologyDrawingById,
    saveTopologyDrawing,
    deleteTopologyDrawing,
    getRootCauseAnalysis
} from '../controllers/topologyController.js';
import { getDeviceLogs, getLogSummary } from '../controllers/logController.js';
import { acknowledgeAlert, getSmartAlerts, ackSmartAlert } from '../controllers/alertController.js';
import { getSlaReport } from '../controllers/reportController.js';
import {
    getIncidentReports,
    createIncidentReport,
    updateIncidentReportStatus,
    deleteIncidentReport
} from '../controllers/incidentReportController.js';
import {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser
} from '../controllers/userController.js';
import {
    getMaintenanceSchedules,
    getMaintenanceSummary
} from '../controllers/maintenanceScheduleController.js';
import {
    getAllWorkOrders,
    getWorkOrderSummary,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder
} from '../controllers/workOrderController.js';
import {
    getScheduleBreaks,
    createScheduleBreak,
    updateScheduleBreak,
    deleteScheduleBreak
} from '../controllers/scheduleBreakController.js';
import agentRoutes from './agentRoutes.js';

const router = express.Router();

router.use('/agent', agentRoutes);

// Work Order & Man Power Management Routes
router.get('/work-orders', getAllWorkOrders);
router.get('/work-orders/summary', getWorkOrderSummary);
router.post('/work-orders', createWorkOrder);
router.put('/work-orders/:id', updateWorkOrder);
router.delete('/work-orders/:id', deleteWorkOrder);

// Schedule Breaks Routes (Waktu Istirahat Dinamis)
router.get('/schedule-breaks', getScheduleBreaks);
router.post('/schedule-breaks', createScheduleBreak);
router.put('/schedule-breaks/:id', updateScheduleBreak);
router.delete('/schedule-breaks/:id', deleteScheduleBreak);

// Maintenance Schedules (ITAM DB - Read Only)
router.get('/maintenance-schedules', getMaintenanceSchedules);
router.get('/maintenance-schedules/summary', getMaintenanceSummary);


// User Management (RBAC: SPV & Dept Head)
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:nik', updateUser);
router.delete('/users/:nik', deleteUser);

// Laporan SLA
router.get('/reports/sla', getSlaReport);

// Incident Reports & Berita Acara
router.get('/incident-reports', getIncidentReports);
router.post('/incident-reports', createIncidentReport);
router.put('/incident-reports/:id/status', updateIncidentReportStatus);
router.delete('/incident-reports/:id', deleteIncidentReport);

// Health Check Endpoint
router.get('/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.status(200).json({
            status: 'OK',
            message: 'NTMS Backend Running Successfully!',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Database Connection Failed',
            error: err.message
        });
    }
});

// Auth Routes
router.post('/auth/login', loginUser);

// Device Routes
router.get('/devices', getAllDevices);
router.post('/devices', createDevice);
router.put('/devices/:pid', updateDevice);
router.post('/devices/:pid/ping', pingDevice);
router.get('/devices/:ip/snmp', getDeviceSnmp);
router.get('/devices/:ip/nvr-snmp', getNvrSnmp);
router.get('/devices/:ip/metrics', getDeviceVendorMetrics);
router.get('/devices/:pid/history', getDeviceTelemetryHistory);
router.get('/devices/:pid/predictions', getDevicePredictions);
router.post('/devices/snmp-test', testSnmp);
router.post('/devices/bulk-delete', bulkDeleteDevices);
router.delete('/devices/:pid', deleteDevice);

// Topology Routes
router.get('/topology', getTopology);
router.get('/topology/rca', getRootCauseAnalysis);
router.get('/topology/drawings', getAllTopologyDrawings);
router.get('/topology/drawings/:id', getTopologyDrawingById);
router.post('/topology/drawings', saveTopologyDrawing);
router.delete('/topology/drawings/:id', deleteTopologyDrawing);

// Logs Routes
router.get('/logs', getDeviceLogs);
router.get('/logs/summary', getLogSummary);
router.post('/logs/:id/ack', acknowledgeAlert);

// Smart Alerts & Anomaly Routes
router.get('/alerts', getSmartAlerts);
router.post('/alerts/:id/ack', ackSmartAlert);

// Multi-Drawing Floorplan Routes (Tanpa Auth Sementara)
router.get('/floorplans', getAllFloorplans);
router.get('/floorplans/:id', getFloorplanById);
router.post('/floorplans', saveFloorplan);
router.delete('/floorplans/:id', deleteFloorplan);

// Setting Routes
router.get('/settings/:key', getSettingByKey);
router.post('/settings', saveSetting);

export default router;