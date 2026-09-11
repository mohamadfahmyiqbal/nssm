// src/components/dashboard/MaintenanceModal.jsx
import React, { useState } from 'react';
import api from '../../services/api';
import { showToast, showConfirm } from '../../utils/swal';
import { Wrench, RefreshCw, Trash2, X, AlertTriangle } from 'lucide-react';

export default function MaintenanceModal({ device, onClose, onRefreshData }) {
    const [loadingAction, setLoadingAction] = useState(null); // 'maintenance' | 'poll' | 'delete'

    if (!device) return null;

    // 1. Toggle Maintenance Mode
    const handleToggleMaintenance = async () => {
        const isMaintenance = device.isMaintenance;
        const confirmMessage = isMaintenance
            ? `Matikan Maintenance Mode untuk ${device.deviceName}? Email alert akan aktif kembali.`
            : `Aktifkan Maintenance Mode untuk ${device.deviceName}? Email alert akan dinonaktifkan sementara.`;

        const result = await showConfirm(
            'Konfirmasi Maintenance Mode',
            confirmMessage,
            isMaintenance ? 'Ya, Matikan' : 'Ya, Aktifkan'
        );

        if (result.isConfirmed) {
            setLoadingAction('maintenance');
            try {
                await api.patch(`/devices/${device.deviceId}/maintenance`, {
                    isMaintenance: !isMaintenance,
                });

                showToast(
                    'success',
                    `Maintenance mode ${!isMaintenance ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'} untuk ${device.deviceName}`
                );
                if (onRefreshData) onRefreshData();
                onClose();
            } catch (err) {
                showToast('error', 'Gagal memperbarui status Maintenance Mode.');
            } finally {
                setLoadingAction(null);
            }
        }
    };

    // 2. Manual Trigger Re-Poll
    const handleTriggerPoll = async () => {
        setLoadingAction('poll');
        try {
            await api.post(`/devices/${device.deviceId}/poll`);
            showToast('success', `Polling manual dikirim untuk ${device.deviceName}. Status akan diperbarui.`);
            if (onRefreshData) onRefreshData();
        } catch (err) {
            showToast('error', 'Gagal mengirim perintah Polling manual.');
        } finally {
            setLoadingAction(null);
        }
    };

    // 3. Hapus Perangkat
    const handleDeleteDevice = async () => {
        const result = await showConfirm(
            'Hapus Perangkat?',
            `Perangkat ${device.deviceName} (${device.ipAddress}) akan dihapus permanen dari SQL Server!`,
            'Ya, Hapus'
        );

        if (result.isConfirmed) {
            setLoadingAction('delete');
            try {
                await api.delete(`/devices/${device.deviceId}`);
                showToast('success', `Perangkat ${device.deviceName} berhasil dihapus.`);
                if (onRefreshData) onRefreshData();
                onClose();
            } catch (err) {
                showToast('error', 'Gagal menghapus perangkat.');
            } finally {
                setLoadingAction(null);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 text-slate-100 relative">
                {/* Header Modal */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
                            <Wrench className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-100">{device.deviceName}</h3>
                            <p className="font-mono text-xs text-slate-400">{device.ipAddress}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Status Mode Badge */}
                {device.isMaintenance && (
                    <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-amber-400 text-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Perangkat dalam <strong>Maintenance Mode</strong>. Alert email dinonaktifkan.</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="mt-5 flex flex-col gap-2.5 font-mono text-xs">
                    {/* Toggle Maintenance Button */}
                    <button
                        onClick={handleToggleMaintenance}
                        disabled={loadingAction !== null}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border font-bold transition-all ${device.isMaintenance
                                ? 'bg-amber-950/40 border-amber-700/60 text-amber-300 hover:bg-amber-900/60'
                                : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4" />
                            <span>{device.isMaintenance ? 'Nonaktifkan Maintenance Mode' : 'Set Maintenance Mode'}</span>
                        </div>
                        {loadingAction === 'maintenance' && <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
                    </button>

                    {/* Trigger Manual Poll Button */}
                    <button
                        onClick={handleTriggerPoll}
                        disabled={loadingAction !== null}
                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 hover:bg-slate-800 font-bold transition-all"
                    >
                        <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-blue-400" />
                            <span>Trigger Manual Re-Poll</span>
                        </div>
                        {loadingAction === 'poll' && <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
                    </button>

                    {/* Delete Device Button */}
                    <button
                        onClick={handleDeleteDevice}
                        disabled={loadingAction !== null}
                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-rose-950/30 border border-rose-800/50 text-rose-400 hover:bg-rose-900/50 font-bold transition-all mt-2"
                    >
                        <div className="flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            <span>Hapus Perangkat dari NTMS</span>
                        </div>
                        {loadingAction === 'delete' && <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />}
                    </button>
                </div>

                {/* Footer */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl font-mono text-xs font-bold transition-colors"
                    >
                        TUTUP
                    </button>
                </div>
            </div>
        </div>
    );
}