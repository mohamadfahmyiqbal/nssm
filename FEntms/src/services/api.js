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
    timeout: 10000,
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

export default api;