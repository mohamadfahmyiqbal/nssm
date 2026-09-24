import axios from 'axios';
import { showToast, showAlert } from '../utils/swal';

const getBackendUrl = () => {
    if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'pik1com074.local.ikoito.co.id';
    return `http://${hostname}:5000/api`;
};

const API_URL = getBackendUrl();

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('ntms_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response ? error.response.status : null;

        if (status === 401) {
            localStorage.removeItem('ntms_token');
            showToast('error', 'Sesi login telah berakhir. Silakan login kembali.');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else if (status === 403) {
            showAlert('Akses Ditolak', 'Anda tidak memiliki hak akses untuk tindakan ini!', 'error');
        } else if (status === 500) {
            showToast('error', 'Terjadi kesalahan pada Server Backend NTMS (500)');
        } else if (!error.response) {
            showToast('error', 'Gagal terhubung ke Server Backend NTMS.');
        }

        return Promise.reject(error);
    }
);

/* ==========================================================================
   MULTI-DRAWING FLOORPLAN API SERVICES
   ========================================================================== */

export const getAllFloorplansFromDB = async () => {
    const response = await api.get('/floorplans');
    return response.data;
};

export const getFloorplanByIdFromDB = async (id) => {
    const response = await api.get(`/floorplans/${id}`);
    return response.data;
};

export const saveFloorplanToDB = async (floorplanData) => {
    const response = await api.post('/floorplans', floorplanData);
    return response.data;
};

export const deleteFloorplanFromDB = async (id) => {
    const response = await api.delete(`/floorplans/${id}`);
    return response.data;
};

/* ==========================================================================
   MULTI-DRAWING TOPOLOGY API SERVICES
   ========================================================================== */

export const getAllTopologyDrawingsFromDB = async () => {
    const response = await api.get('/topology/drawings');
    return response.data;
};

export const getTopologyDrawingByIdFromDB = async (id) => {
    const response = await api.get(`/topology/drawings/${id}`);
    return response.data;
};

export const saveTopologyDrawingToDB = async (drawingData) => {
    const response = await api.post('/topology/drawings', drawingData);
    return response.data;
};

export const deleteTopologyDrawingFromDB = async (id) => {
    const response = await api.delete(`/topology/drawings/${id}`);
    return response.data;
};

/* ==========================================================================
   DEVICES & INVENTORY API SERVICES
   ========================================================================== */

export const getAllDevicesFromDB = async () => {
    const response = await api.get('/devices');
    return response.data;
};

export const createDeviceInDB = async (deviceData) => {
    const response = await api.post('/devices', deviceData);
    return response.data;
};

export const updateDeviceInDB = async (pid, deviceData) => {
    const response = await api.put(`/devices/${pid}`, deviceData);
    return response.data;
};

export const pingDeviceInDB = async (pid) => {
    const response = await api.post(`/devices/${pid}/ping`);
    return response.data;
};

export const deleteDeviceFromDB = async (pid) => {
    const response = await api.delete(`/devices/${pid}`);
    return response.data;
};

export const bulkDeleteDevicesFromDB = async (pids) => {
    const response = await api.post('/devices/bulk-delete', { pids });
    return response.data;
};

export const getDeviceTelemetryHistoryFromDB = async (pid, range = '24h') => {
    const response = await api.get(`/devices/${pid}/history?range=${range}`);
    return response.data;
};

export const getSmartAlertsFromDB = async () => {
    const response = await api.get('/alerts');
    return response.data;
};

export const ackSmartAlertInDB = async (id, noteData) => {
    const response = await api.post(`/alerts/${id}/ack`, noteData);
    return response.data;
};

export const getLogSummaryFromDB = async (window = '24h') => {
    const response = await api.get(`/logs/summary?window=${window}`);
    return response.data;
};

export const getDevicePredictionsFromDB = async (pid) => {
    const response = await api.get(`/devices/${pid}/predictions`);
    return response.data;
};

export const getRootCauseAnalysisFromDB = async () => {
    const response = await api.get('/topology/rca');
    return response.data;
};

/* ==========================================================================
   INCIDENT REPORTS & BERITA ACARA API SERVICES
   ========================================================================== */

export const getIncidentReportsFromDB = async (status = 'ALL') => {
    const response = await api.get(`/incident-reports?status=${status}`);
    return response.data;
};

export const saveIncidentReportToDB = async (reportData) => {
    const response = await api.post('/incident-reports', reportData);
    return response.data;
};

export const updateIncidentReportStatusInDB = async (id, updateData) => {
    const response = await api.put(`/incident-reports/${id}/status`, updateData);
    return response.data;
};

export const deleteIncidentReportFromDB = async (id) => {
    const response = await api.delete(`/incident-reports/${id}`);
    return response.data;
};

/* ==========================================================================
   USER & RBAC MANAGEMENT API SERVICES (SPV & DEPT HEAD)
   ========================================================================== */

export const getUsersFromDB = async () => {
    const response = await api.get('/users');
    return response.data;
};

export const createUserInDB = async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
};

export const updateUserInDB = async (nik, userData) => {
    const response = await api.put(`/users/${nik}`, userData);
    return response.data;
};

export const deleteUserFromDB = async (nik) => {
    const response = await api.delete(`/users/${nik}`);
    return response.data;
};

/* ==========================================================================
   MAINTENANCE SCHEDULES (ITAM) API SERVICES
   ========================================================================== */

export const getMaintenanceSchedulesFromDB = async (params = {}) => {
    const response = await api.get('/maintenance-schedules', { params });
    return response.data;
};

export const getMaintenanceSummaryFromDB = async () => {
    const response = await api.get('/maintenance-schedules/summary');
    return response.data;
};

/* ==========================================================================
   WORK ORDER & MAN POWER ALLOCATION API SERVICES
   ========================================================================== */

export const getWorkOrdersFromDB = async (params = {}) => {
    const response = await api.get('/work-orders', { params });
    return response.data;
};

export const getWorkOrderSummaryFromDB = async () => {
    const response = await api.get('/work-orders/summary');
    return response.data;
};

export const saveWorkOrderToDB = async (woData) => {
    const response = await api.post('/work-orders', woData);
    return response.data;
};

export const updateWorkOrderInDB = async (id, woData) => {
    const response = await api.put(`/work-orders/${id}`, woData);
    return response.data;
};

export const deleteWorkOrderFromDB = async (id) => {
    const response = await api.delete(`/work-orders/${id}`);
    return response.data;
};

/* ==========================================================================
   SCHEDULE BREAKS (WAKTU ISTIRAHAT DINAMIS) API SERVICES
   ========================================================================== */

export const getScheduleBreaksFromDB = async (params = {}) => {
    const response = await api.get('/schedule-breaks', { params });
    return response.data;
};

export const saveScheduleBreakToDB = async (breakData) => {
    const response = await api.post('/schedule-breaks', breakData);
    return response.data;
};

export const updateScheduleBreakInDB = async (id, breakData) => {
    const response = await api.put(`/schedule-breaks/${id}`, breakData);
    return response.data;
};

export const deleteScheduleBreakFromDB = async (id) => {
    const response = await api.delete(`/schedule-breaks/${id}`);
    return response.data;
};

export default api;