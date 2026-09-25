import React from 'react';
import {
    Briefcase,
    Save,
    X,
    FileText,
    CheckCircle2,
    Calendar,
    Clock,
    UserCheck,
    Layers,
    FileCheck
} from 'lucide-react';
import WorkOrderDeviceSelect from '../forms/WorkOrderDeviceSelect';
import WorkOrderTechnicianSelect from '../forms/WorkOrderTechnicianSelect';
import WorkOrderTimeScheduleFields from '../forms/WorkOrderTimeScheduleFields';
import WorkOrderActualFields from '../forms/WorkOrderActualFields';

export default function WorkOrderPipelineEditor({
    formData,
    setFormData,
    editingWo,
    technicians = [],
    inventoryDevices = [],
    onSubmit,
    onCancel,
    onSelectTechnician,
    isLoading = false
}) {
    const handleFieldChange = (partial) => {
        setFormData(prev => ({ ...prev, ...partial }));
    };

    return (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl backdrop-blur-md overflow-hidden">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-slate-100">
                                {editingWo ? `Edit Work Order: ${editingWo.woNumber}` : 'Formulir Penerbitan Surat Perintah Kerja (Work Order)'}
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
                                {formData.woType === 'INCIDENT_ANOMALY' ? 'Incident & Anomaly' : 'Preventive Maintenance (PM)'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">
                            {editingWo
                                ? 'Perbarui rincian tugas teknisi, alokasi jam kerja, realisasi aktual, dan catatan hasil pengerjaan'
                                : 'Pilih antrean tugas di panel kiri atau lengkapi formulir di bawah ini untuk menerbitkan SPK'}
                        </p>
                    </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                        >
                            <X className="w-4 h-4 text-slate-400" />
                            <span>Batal / Reset</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        <span>{editingWo ? 'Simpan Perubahan WO' : 'Terbitkan & Tugaskan SPK'}</span>
                    </button>
                </div>
            </div>

            {/* Form Fields Body */}
            <form onSubmit={onSubmit} className="flex flex-col gap-4 text-xs overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar pr-1">
                {/* Section 1: Klasifikasi & Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                    <div>
                        <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-blue-400" />
                            <span>Tipe Tugas / Sumber</span>
                        </label>
                        <select
                            value={formData.woType}
                            onChange={(e) => handleFieldChange({ woType: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                        >
                            <option value="PREVENTIVE_MAINTENANCE">Preventive Maintenance (Jadwal ITAM)</option>
                            <option value="INCIDENT_ANOMALY">Incident & Anomaly Remediation</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Prioritas Penanganan</span>
                        </label>
                        <select
                            value={formData.priority}
                            onChange={(e) => handleFieldChange({ priority: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                        >
                            <option value="LOW">LOW (Rendah)</option>
                            <option value="MEDIUM">MEDIUM (Sedang)</option>
                            <option value="HIGH">HIGH (Tinggi)</option>
                            <option value="CRITICAL">CRITICAL (Kritis)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Status Penugasan</span>
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => handleFieldChange({ status: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 font-bold text-blue-400"
                        >
                            <option value="OPEN">OPEN (Belum Ditugaskan)</option>
                            <option value="ASSIGNED">ASSIGNED (Ditugaskan ke Teknisi)</option>
                            <option value="IN_PROGRESS">IN_PROGRESS (Sedang Dikerjakan)</option>
                            <option value="RESOLVED">RESOLVED (Selesai Pengerjaan)</option>
                            <option value="CLOSED">CLOSED (Disetujui & Ditutup)</option>
                        </select>
                    </div>
                </div>

                {/* Section 2: Judul & Instruksi Pekerjaan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-950/30 p-4 rounded-xl border border-slate-800/80">
                    <div>
                        <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Judul Work Order *</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: Pembersihan & Validasi Firmware NVR Lantai 2"
                            value={formData.title}
                            onChange={(e) => handleFieldChange({ title: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-semibold focus:outline-none focus:border-blue-500 text-xs"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Deskripsi & Instruksi Pengerjaan Lapangan</span>
                        </label>
                        <textarea
                            rows="2"
                            placeholder="Tuliskan instruksi teknis, catatan keselamatan kerja, atau breakdown checklist..."
                            value={formData.description}
                            onChange={(e) => handleFieldChange({ description: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                        />
                    </div>
                </div>

                {/* Section 3: Target Perangkat / Equipment */}
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                    <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        1. Cakupan Perangkat & Standar Waktu Pengerjaan
                    </h4>
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

                {/* Section 4: Alokasi Teknisi & Man Power */}
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                    <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                        <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                        2. Alokasi Man Power & Penugasan Teknisi
                    </h4>
                    <WorkOrderTechnicianSelect
                        assignedTechnicianNik={formData.assignedTechnicianNik}
                        targetDate={formData.targetDate}
                        teamMembers={formData.teamMembers || []}
                        technicians={technicians}
                        onSelectTechnician={onSelectTechnician}
                        onChange={handleFieldChange}
                    />
                </div>

                {/* Section 5: Target Jadwal & Slot Waktu */}
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                    <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        3. Perencanaan Jadwal & Durasi Target
                    </h4>
                    <WorkOrderTimeScheduleFields
                        startTime={formData.startTime}
                        endTime={formData.endTime}
                        estimatedHours={formData.estimatedHours}
                        targetDurationMinutes={formData.targetDurationMinutes}
                        onChange={handleFieldChange}
                    />
                </div>

                {/* Section 6: Realisasi Actual Pengerjaan & Remarks (Khusus Update Lapangan) */}
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                    <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                        4. Realisasi Aktual Pengerjaan & Catatan Lapangan (PIC Update)
                    </h4>
                    <WorkOrderActualFields
                        actualStartTime={formData.actualStartTime}
                        actualEndTime={formData.actualEndTime}
                        actualDurationMinutes={formData.actualDurationMinutes}
                        completionNotes={formData.completionNotes}
                        remarks={formData.remarks}
                        onChange={handleFieldChange}
                    />
                </div>

                {/* Bottom Submit Footer */}
                <div className="flex items-center justify-end gap-3 pt-2 pb-4">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                        >
                            Batal
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        <span>{editingWo ? 'Simpan Perubahan Work Order' : 'Terbitkan & Simpan Surat Perintah Kerja'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
