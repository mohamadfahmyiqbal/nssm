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
    getDeviceVendorMetrics
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
    deleteTopologyDrawing
} from '../controllers/topologyController.js';
import { getDeviceLogs } from '../controllers/logController.js';
import { acknowledgeAlert } from '../controllers/alertController.js';
import { getSlaReport } from '../controllers/reportController.js';
import agentRoutes from './agentRoutes.js';

const router = express.Router();

router.use('/agent', agentRoutes);

// Laporan SLA
router.get('/reports/sla', getSlaReport);

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
router.post('/devices/snmp-test', testSnmp);
router.post('/devices/bulk-delete', bulkDeleteDevices);
router.delete('/devices/:pid', deleteDevice);

// Topology Routes
router.get('/topology', getTopology);
router.get('/topology/drawings', getAllTopologyDrawings);
router.get('/topology/drawings/:id', getTopologyDrawingById);
router.post('/topology/drawings', saveTopologyDrawing);
router.delete('/topology/drawings/:id', deleteTopologyDrawing);

// Logs Routes
router.get('/logs', getDeviceLogs);
router.post('/logs/:id/ack', acknowledgeAlert);

// Multi-Drawing Floorplan Routes (Tanpa Auth Sementara)
router.get('/floorplans', getAllFloorplans);
router.get('/floorplans/:id', getFloorplanById);
router.post('/floorplans', saveFloorplan);
router.delete('/floorplans/:id', deleteFloorplan);

// Setting Routes
router.get('/settings/:key', getSettingByKey);
router.post('/settings', saveSetting);

export default router;