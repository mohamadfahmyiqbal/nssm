import React from 'react';
import { Briefcase, XCircle } from 'lucide-react';
import WorkOrderDeviceSelect from '../forms/WorkOrderDeviceSelect';
import WorkOrderTechnicianSelect from '../forms/WorkOrderTechnicianSelect';
import WorkOrderTimeScheduleFields from '../forms/WorkOrderTimeScheduleFields';
import WorkOrderActualFields from '../forms/WorkOrderActualFields';

export default function WorkOrderModal({
    isOpen,
    editingWo,
    formData,
    setFormData,
    technicians,
    inventoryDevices = [],
    onClose,
    onSubmit,
    onSelectTechnician
}) {
    if (!isOpen) return null;

    const handleFieldChange = (partial) => {
        setFormData(prev => ({ ...prev, ...partial }));
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-[88vw] max-w-5xl h-[88vh] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-100 text-base">
                                {editingWo ? `Edit Work Order: ${editingWo.woNumber}` : 'Alokasi Man Power & Terbitkan Work Order'}
                            </h3>
                            <span className="text-xs text-slate-400">
                                {editingWo ? 'Perbarui jadwal pengerjaan, realisasi teknisi, status, dan catatan lapangan' : 'Lengkapi formulir penerbitan surat perintah kerja'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
                        title="Tutup Modal"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={onSubmit} className="p-6 flex-1 overflow-y-auto flex flex-col gap-4 text-xs custom-scrollbar">
                    {/* Baris 1: Tipe Work Order, Prioritas, & Status Penugasan */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                        <div>
                            <label className="block text-slate-400 font-medium mb-1">Tipe Tugas / Sumber</label>
                            <select
                                value={formData.woType}
                                onChange={(e) => handleFieldChange({ woType: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                            >
                                <option value="PREVENTIVE_MAINTENANCE">Preventive Maintenance (Jadwal ITAM)</option>
                                <option value="INCIDENT_ANOMALY">Incident & Anomaly Remediation</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-400 font-medium mb-1">Prioritas</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => handleFieldChange({ priority: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                            >
                                <option value="LOW">LOW</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="HIGH">HIGH</option>
                                <option value="CRITICAL">CRITICAL</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-400 font-medium mb-1">Status Penugasan</label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleFieldChange({ status: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 font-bold"
                            >
                                <option value="OPEN">OPEN</option>
                                <option value="ASSIGNED">ASSIGNED</option>
                                <option value="IN_PROGRESS">IN_PROGRESS</option>
                                <option value="RESOLVED">RESOLVED</option>
                                <option value="CLOSED">CLOSED</option>
                            </select>
                        </div>
                    </div>

                    {/* Baris 2: Judul & Deskripsi */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div>
                            <label className="block text-slate-400 font-medium mb-1">Judul Work Order *</label>
                            <input
                                type="text"
                                placeholder="Contoh: Pembersihan & Validasi Firmware NVR Lantai 2"
                                value={formData.title}
                                onChange={(e) => handleFieldChange({ title: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-semibold focus:outline-none focus:border-blue-500 text-xs"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 font-medium mb-1">Deskripsi & Instruksi Pengerjaan</label>
                            <textarea
                                rows="1"
                                placeholder="Instruksi pengerjaan teknisi, checklist pengecekan, catatan lapangan..."
                                value={formData.description}
                                onChange={(e) => handleFieldChange({ description: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                            />
                        </div>
                    </div>

                    {/* 1. Multi Device Selection */}
                    <div className="bg-slate-950/30 p-3.5 rounded-xl border border-slate-800/80">
                        <WorkOrderDeviceSelect
                            devices={formData.devices || []}
                            inventoryDevices={inventoryDevices}
                            unitCycleTimeMinutes={formData.unitCycleTimeMinutes}
                            onChange={(newDevices, newTargetMins) => {
                                handleFieldChange({
                                    devices: newDevices,
                                    targetDurationMinutes: newTargetMins
                                });
                            }}
                        />
                    </div>

                    {/* 2. Man Power & Technician Allocation */}
                    <div className="bg-slate-950/30 p-3.5 rounded-xl border border-slate-800/80">
                        <WorkOrderTechnicianSelect
                            assignedTechnicianNik={formData.assignedTechnicianNik}
                            targetDate={formData.targetDate}
                            teamMembers={formData.teamMembers || []}
                            technicians={technicians}
                            onSelectTechnician={onSelectTechnician}
                            onChange={handleFieldChange}
                        />
                    </div>

                    {/* 3. Slot Jam Kerja & Durasi Target */}
                    <div className="bg-slate-950/30 p-3.5 rounded-xl border border-slate-800/80">
                        <WorkOrderTimeScheduleFields
                            startTime={formData.startTime}
                            endTime={formData.endTime}
                            estimatedHours={formData.estimatedHours}
                            targetDurationMinutes={formData.targetDurationMinutes}
                            onChange={handleFieldChange}
                        />
                    </div>

                    {/* 4. Realisasi / Actual Pengerjaan & Remarks */}
                    <WorkOrderActualFields
                        actualStartTime={formData.actualStartTime}
                        actualEndTime={formData.actualEndTime}
                        actualDurationMinutes={formData.actualDurationMinutes}
                        actualHours={formData.actualHours}
                        completionNotes={formData.completionNotes}
                        remarks={formData.remarks}
                        onChange={handleFieldChange}
                    />
                </form>

                {/* Modal Footer */}
                <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between flex-shrink-0">
                    <span className="text-xs text-slate-500 font-mono">
                        {editingWo ? `ID: ${editingWo.id} • ${editingWo.woNumber}` : 'Draft Work Order Baru'}
                    </span>
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-semibold text-xs"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={onSubmit}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-semibold shadow-lg shadow-blue-500/20 text-xs"
                        >
                            {editingWo ? 'Simpan Perubahan' : 'Terbitkan Work Order & Alokasikan'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
