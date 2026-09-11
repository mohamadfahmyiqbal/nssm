import React, { useState, useEffect } from 'react';
import { AlertCircle, Minimize2, X, CheckCircle } from 'lucide-react';
import axios from 'axios';
import darkSwal, { showToast } from '../../utils/swal';

export default function LiveAlertLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            const response = await axios.get('http://pik1com074.local.ikoito.co.id:5000/api/logs');
            if (response.data.success) {
                // Tampilkan hanya log DOWN yang belum di-acknowledge (maksimal 10)
                const activeAlerts = response.data.data
                    .filter(log => log.NEW_STATUS === 'DOWN' && !log.IS_ACKNOWLEDGED)
                    .slice(0, 10);
                setLogs(activeAlerts);
            }
        } catch (error) {
            console.error('Failed to fetch alert logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 10000); // refresh tiap 10 detik
        return () => clearInterval(interval);
    }, []);

    const handleAck = async (id) => {
        const { value: note } = await darkSwal.fire({
            title: 'Acknowledge Alert',
            input: 'text',
            inputLabel: 'Catatan Penanganan',
            inputValue: 'Sedang ditangani',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) return 'Catatan tidak boleh kosong!';
            }
        });

        if (!note) return; // User cancelled

        try {
            await axios.post(`http://pik1com074.local.ikoito.co.id:5000/api/logs/${id}/ack`, { note, user: 'Admin' });
            fetchLogs(); // refresh data
            showToast('success', 'Alert berhasil di-acknowledge');
        } catch (error) {
            showToast('error', 'Gagal melakukan acknowledge!');
            console.error(error);
        }
    };
    return (
        <div className="absolute bottom-6 left-6 z-20 w-80 bg-slate-950/90 border border-slate-800 rounded-2xl p-3 shadow-2xl backdrop-blur-md font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <div className="flex items-center gap-2 text-slate-200 font-bold">
                    <AlertCircle className="w-4 h-4 text-blue-400" />
                    <span>DOCKED LIVE ALERT LOG</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                    <Minimize2 className="w-3.5 h-3.5 cursor-pointer hover:text-slate-300" />
                    <X className="w-3.5 h-3.5 cursor-pointer hover:text-slate-300" />
                </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
                {logs.length === 0 && !loading && (
                    <div className="text-slate-500 text-center py-2">Tidak ada active alert.</div>
                )}
                {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-[10px] bg-slate-900/50 p-2 rounded">
                        <div className="flex-1">
                            <span className="text-slate-500 block mb-1">{new Date(log.createdAt).toLocaleString()}</span>
                            <span className="text-slate-300 font-bold">{log.HOSTNAME || log.PID}</span>
                            <span className="text-rose-400 font-bold ml-2">
                                • {log.NEW_STATUS} ({log.METHOD})
                            </span>
                        </div>
                        <button 
                            onClick={() => handleAck(log.id)}
                            className="ml-2 flex items-center gap-1 bg-amber-500/20 text-amber-400 px-2 py-1 rounded hover:bg-amber-500/40 transition-colors"
                            title="Acknowledge Alert"
                        >
                            <CheckCircle className="w-3 h-3" />
                            <span>Ack</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}