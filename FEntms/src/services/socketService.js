// FEntms\src\services\socketService.js
import { io } from 'socket.io-client';
import { showToast } from '../utils/swal';

const getSocketUrl = () => {
    if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'pik1com074.local.ikoito.co.id';
    return `http://${hostname}:5000`;
};

const SOCKET_URL = getSocketUrl();

class SocketService {
    constructor() {
        this.socket = null;
    }

    /**
     * Inisialisasi & Hubungkan WebSocket dengan JWT Token
     */
    connect() {
        if (this.socket) return;

        const token = localStorage.getItem('ntms_token');

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 3000,
            timeout: 60000
        });

        this.socket.on('connect', () => {
            console.log('⚡ [NTMS Socket] Connected to WebSocket Server:', this.socket.id);
        });

        this.socket.on('connect_error', (err) => {
            console.warn('⚠️ [NTMS Socket] Connection Error:', err.message);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ [NTMS Socket] Disconnected:', reason);
        });

        // Default Listener untuk Alert Notification Real-Time via SweetAlert2
        this.socket.on('device:status_update', (payload) => {
            this.handleIncomingAlertToast(payload);
        });
    }

    /**
     * Tampilkan Toast Swal otomatis saat status berubah
     */
    handleIncomingAlertToast(data) {
        const { hostname, status, ip } = data;

        if (status === 'WARNING') {
            showToast('warning', `WARNING: ${hostname} (${ip}) High Usage!`);
        } else if (status === 'UP' && data.previousStatus === 'DOWN') {
            showToast('success', `RECOVERED: ${hostname} (${ip}) is back UP.`);
        }
    }

    /**
     * Subscribe event status update di dalam komponen React
     */
    onStatusUpdate(callback) {
        if (!this.socket) this.connect();
        this.socket.on('device:status_update', callback);
    }

    /**
     * Unsubscribe event saat komponen unmount
     */
    offStatusUpdate(callback) {
        if (this.socket) {
            this.socket.off('device:status_update', callback);
        }
    }

    /**
     * Subscribe event laporan RCA real-time
     */
    onRcaReport(callback) {
        if (!this.socket) this.connect();
        this.socket.on('network:rca_report', callback);
    }

    /**
     * Unsubscribe event laporan RCA
     */
    offRcaReport(callback) {
        if (this.socket) {
            this.socket.off('network:rca_report', callback);
        }
    }

    /**
     * Putus koneksi WebSocket (saat Logout)
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

const socketService = new SocketService();
export default socketService;