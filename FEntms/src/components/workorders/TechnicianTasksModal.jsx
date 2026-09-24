import React from 'react';
import {
    User,
    Briefcase,
    Calendar,
    Clock,
    XCircle,
    Eye,
    CheckCircle2,
    AlertTriangle,
    Download,
    FileText
} from 'lucide-react';
import { generateTechnicianWorkOrderPDF } from '../../utils/technicianWorkOrderPdfGenerator';
import { showToast } from '../../utils/swal';

export default function TechnicianTasksModal({
    isOpen,
    technician,
    workOrders,
    scheduleBreaks = [],
    selectedDate = null,
    onClose,
    onViewDetail
}) {
    if (!isOpen || !technician) return null;

    // Filter semua WO milik teknisi ini (sebagai PIC Utama maupun Helper)
    const techNik = String(technician.nik || '').trim();
    const techName = String(technician.name || '').trim().toLowerCase();

    const techWos = workOrders.filter(w => {
        const wNik = String(w.assignedTechnicianNik || '').trim();
        const wName = String(w.assignedTechnicianName || '').trim().toLowerCase();
        const isPic = (techNik && wNik === techNik) || (techName && wName === techName);

        let isHelper = false;
        let membersList = [];
        if (w.teamMembersJson) {
            try { membersList = JSON.parse(w.teamMembersJson); } catch (e) {}
        } else if (Array.isArray(w.teamMembers)) {
            membersList = w.teamMembers;
        }
        if (Array.isArray(membersList)) {
            isHelper = membersList.some(m => {
                const mNik = String(m.nik || m.NIK || '').trim();
                const mName = String(m.name || m.nama || m.NAMA || '').trim().toLowerCase();
                return (techNik && mNik === techNik) || (techName && mName === techName);
            });
        }

        return isPic || isHelper;
    });

    const handleDownloadPdf = () => {
        try {
            generateTechnicianWorkOrderPDF({
                technician,
                workOrders,
                scheduleBreaks,
                selectedDate
            });
            showToast('success', `PDF Work Order untuk ${technician.name || 'Teknisi'} berhasil diunduh.`);
        } catch (error) {
            console.error('PDF Generate Error:', error);
            showToast('error', 'Gagal membuat file PDF Work Order.');
        }
    };

    const getPriorityBadge = (p) => {
        switch ((p || '').toUpperCase()) {
            case 'CRITICAL':
                return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
            case 'HIGH':
                return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
            case 'MEDIUM':
                return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
            default:
                return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
        }
    };

    const getStatusBadge = (s) => {
        switch ((s || '').toUpperCase()) {
            case 'RESOLVED':
            case 'CLOSED':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            case 'IN_PROGRESS':
                return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
            case 'ASSIGNED':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            default:
                return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-base shadow-inner">
                            {technician.name?.charAt(0) || 'T'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white text-base">
                                    {technician.name}
                                </h3>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    NIK: {technician.nik || '-'}
                                </span>
                            </div>
                            <span className="text-xs text-slate-400">
                                Departemen: {technician.dept || 'IT Infrastructure'} • Total {techWos.length} Work Order Ditugaskan
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownloadPdf}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all"
                            title="Download PDF Lembar Kerja & Surat Tugas Teknisi Ini"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* List Tasks Content */}
                <div className="p-6 overflow-y-auto max-h-[65vh] flex flex-col gap-3">
                    {techWos.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-2">
                            <Briefcase className="w-10 h-10 stroke-[1.5] text-slate-600" />
                            <div className="text-sm font-semibold">Belum Ada Work Order untuk Teknisi Ini</div>
                            <div className="text-xs text-slate-600">Teknisi sedang tidak memiliki beban tugas aktif.</div>
                        </div>
                    ) : (
                        techWos.map((wo) => {
                            return (
                                <div
                                    key={wo.id}
                                    className="p-3.5 bg-slate-950/60 border border-slate-800/80 hover:border-blue-500/40 rounded-xl flex items-center justify-between gap-4 transition-all group"
                                >
                                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-xs text-blue-400">
                                                {wo.woNumber}
                                            </span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                                wo.woType === 'PREVENTIVE_MAINTENANCE'
                                                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                            }`}>
                                                {wo.woType === 'PREVENTIVE_MAINTENANCE' ? 'Preventive' : 'Incident'}
                                            </span>
                                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${getPriorityBadge(wo.priority)}`}>
                                                {wo.priority}
                                            </span>
                                        </div>

                                        <div className="font-semibold text-white text-sm truncate" title={wo.title}>
                                            {wo.title}
                                        </div>

                                        {/* Tampilan Langsung Checklist Item */}
                                        {(() => {
                                            const desc = wo.description || '';
                                            let items = [];
                                            if (desc.includes('Daftar Checklist Standar:')) {
                                                const parts = desc.split('Daftar Checklist Standar:');
                                                if (parts[1]) {
                                                    items = parts[1].split('\n').map(l => l.trim()).filter(Boolean);
                                                }
                                            } else if (desc.trim()) {
                                                items = desc.split('\n').map(l => l.trim()).filter(Boolean);
                                            }

                                            if (items.length === 0) return null;

                                            return (
                                                <div className="mt-1.5 p-2 bg-slate-900/90 rounded-lg border border-slate-800 flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                                                        Rincian Checklist ({items.length} Item):
                                                    </span>
                                                    <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pl-1 pr-0.5">
                                                        {items.map((it, i) => (
                                                            <div key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-snug">
                                                                <span className="text-cyan-500 font-mono text-[10px] mt-0.5">▪</span>
                                                                <span>{it.replace(/^\d+[\.\)]\s*/, '')}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono mt-0.5">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-slate-500" />
                                                Target: {wo.targetDate || '-'}
                                            </span>
                                            <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                                                <Clock className="w-3 h-3 text-cyan-400" />
                                                {wo.estimatedHours || 1} Jam
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5 flex-shrink-0">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded border ${getStatusBadge(wo.status)}`}>
                                            {wo.status}
                                        </span>

                                        <button
                                            onClick={() => {
                                                onViewDetail(wo);
                                            }}
                                            title="Lihat Detail Lengkap Work Order"
                                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>Detail</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                        Total Beban Waktu: <strong className="text-slate-100 font-mono">{technician.totalEstimatedHours || 0} Jam</strong>
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownloadPdf}
                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition-colors text-xs"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
