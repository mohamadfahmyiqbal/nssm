import React from 'react';
import {
    Briefcase,
    Calendar,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    Activity,
    Edit3,
    FileText,
    CheckSquare,
    Square
} from 'lucide-react';

export default function WorkOrderDetailModal({
    isOpen,
    wo,
    onClose,
    onEdit
}) {
    if (!isOpen || !wo) return null;

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
                return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
            case 'IN_PROGRESS':
                return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
            case 'ASSIGNED':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
            default:
                return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
        }
    };

    // Parsing target devices
    let targetDevices = [];
    if (wo.devicesJson) {
        try { targetDevices = JSON.parse(wo.devicesJson); } catch (e) {}
    } else if (Array.isArray(wo.devices)) {
        targetDevices = wo.devices;
    }

    // Parsing team members
    let teamMembers = [];
    if (wo.teamMembersJson) {
        try { teamMembers = JSON.parse(wo.teamMembersJson); } catch (e) {}
    } else if (Array.isArray(wo.teamMembers)) {
        teamMembers = wo.teamMembers;
    }

    // Parsing checklist items dari deskripsi
    const desc = wo.description || '';
    const checklistItems = [];
    if (desc.includes('Daftar Checklist Standar:')) {
        const parts = desc.split('Daftar Checklist Standar:');
        if (parts[1]) {
            const lines = parts[1].split('\n').map(l => l.trim()).filter(Boolean);
            lines.forEach(l => checklistItems.push(l.replace(/^\d+[\.\)]\s*/, '')));
        }
    } else if (desc.trim()) {
        const lines = desc.split('\n').map(l => l.trim()).filter(Boolean);
        lines.forEach(l => checklistItems.push(l.replace(/^\d+[\.\)]\s*/, '')));
    }

    const isResolved = wo.status === 'RESOLVED' || wo.status === 'CLOSED';

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl md:w-[95vw] h-[92vh] max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
                
                {/* 1. KOP DOKUMEN & HEADER (Gaya Surat Perintah Kerja Resmi / PDF) */}
                <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h3 className="font-bold text-lg tracking-wide font-sans text-slate-100">
                                    SURAT PERINTAH KERJA (WORK ORDER)
                                </h3>
                                <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                                    {wo.woNumber}
                                </span>
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded border font-mono ${getStatusBadge(wo.status)}`}>
                                    {wo.status}
                                </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 font-medium">
                                Network Telemetry & Maintenance System (NTMS) • IT Infrastructure Dept
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
                        title="Tutup Modal"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                {/* Sub-Bar Metadata Cetak & Periode */}
                <div className="bg-slate-950/70 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <span>Target Tanggal: <strong className="text-white font-bold">{wo.targetDate || '-'}</strong></span>
                        <span className="text-slate-600">•</span>
                        <span>Jadwal Alokasi: <strong className="text-cyan-300 font-bold">{wo.startTime || '08:00'} - {wo.endTime || '10:00'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-0.5 rounded border text-[11px] font-semibold ${getPriorityBadge(wo.priority)}`}>
                            Prioritas: {wo.priority}
                        </span>
                        <span className="px-2.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-200 text-[11px] font-semibold">
                            {wo.woType === 'PREVENTIVE_MAINTENANCE' ? 'Preventive Maintenance' : 'Incident Remediation'}
                        </span>
                    </div>
                </div>

                {/* Body Content (Format Form Dokumen PDF) */}
                <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 text-xs custom-scrollbar">

                    {/* SECTION I: IDENTITAS PENUGASAN & MAN POWER */}
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                        <div className="bg-slate-800/60 px-4 py-2 text-slate-200 font-bold text-xs flex items-center gap-2 border-b border-slate-800">
                            <User className="w-3.5 h-3.5 text-blue-400" />
                            <span>I. IDENTITAS TEKNISI & ALOKASI MAN POWER</span>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                                    <span className="text-slate-400">Teknisi Utama (PIC):</span>
                                    <span className="font-bold text-white font-mono">{wo.assignedTechnicianName || '-'}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                                    <span className="text-slate-400">NIK PIC:</span>
                                    <span className="font-mono text-cyan-300">{wo.assignedTechnicianNik || '-'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Anggota Pendamping:</span>
                                    <span className="font-medium text-slate-300">
                                        {teamMembers.length > 0 ? teamMembers.map(m => m.name || m.nama || m).join(', ') : '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                                    <span className="text-slate-400">Estimasi Alokasi:</span>
                                    <span className="font-mono text-blue-300 font-bold">
                                        {Math.round((parseFloat(wo.estimatedHours) || 1) * 60)} Menit ({wo.estimatedHours || 1} Jam)
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                                    <span className="text-slate-400">Target Durasi Standar:</span>
                                    <span className="font-mono text-cyan-400 font-bold">
                                        {wo.targetDurationMinutes || Math.round((parseFloat(wo.estimatedHours) || 1) * 60)} Menit
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Target Perangkat:</span>
                                    <span className="font-medium text-slate-200">
                                        {targetDevices.length > 0 ? targetDevices.join(', ') : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION II: TABEL RINCIAN CHECKLIST ITEM & INSTRUKSI KERJA */}
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                        <div className="bg-slate-800/60 px-4 py-2 text-slate-200 font-bold text-xs flex items-center justify-between border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                                <span>II. LEMBAR PENGECEKAN & DAFTAR CHECKLIST STANDAR</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 font-normal">
                                {checklistItems.length} Poin Pemeriksaan
                            </span>
                        </div>

                        <div className="p-4 flex flex-col gap-3">
                            <div className="text-sm font-bold text-white">
                                {wo.title}
                            </div>

                            {/* Tabel Checklist Item Seperti di PDF */}
                            <div className="border border-slate-800 rounded-lg overflow-hidden">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-900 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                                            <th className="py-2.5 px-3 w-10 text-center">No</th>
                                            <th className="py-2.5 px-3">Uraian / Item Pengecekan</th>
                                            <th className="py-2.5 px-3 w-36 text-center">Status</th>
                                            <th className="py-2.5 px-3 w-32 text-center">Hasil & Paraf</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {checklistItems.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="py-4 text-center text-slate-500 italic">
                                                    Tidak ada rincian checklist item terpisah untuk tugas ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            checklistItems.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                                                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <div className="flex items-center gap-2 font-medium text-slate-200">
                                                            {isResolved ? (
                                                                <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                            ) : (
                                                                <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                                            )}
                                                            <span>{item}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                                            isResolved
                                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                                                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                                        }`}>
                                                            {isResolved ? 'COMPLETED' : 'IN_PLAN'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                                                        {isResolved ? (
                                                            <span className="text-emerald-400 font-bold">✓ [ OK ]</span>
                                                        ) : (
                                                            <span className="text-slate-500">[  ] OK   [  ] NOK</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* SECTION III: REALISASI PENGERJAAN, CATATAN & REMARKS */}
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                        <div className="bg-slate-800/60 px-4 py-2 text-slate-200 font-bold text-xs flex items-center gap-2 border-b border-slate-800">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>III. REALISASI / ACTUAL PENGERJAAN LAPANGAN</span>
                        </div>

                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jam Mulai Aktual</span>
                                <span className="text-sm font-bold text-emerald-400 font-mono">
                                    {wo.actualStartTime || '-'}
                                </span>
                            </div>

                            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jam Selesai Aktual</span>
                                <span className="text-sm font-bold text-emerald-400 font-mono">
                                    {wo.actualEndTime || '-'}
                                </span>
                            </div>

                            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Durasi Realisasi</span>
                                <span className="text-sm font-bold text-emerald-400 font-mono">
                                    {wo.actualDurationMinutes !== null && wo.actualDurationMinutes !== undefined && wo.actualDurationMinutes !== ''
                                        ? `${wo.actualDurationMinutes} Menit`
                                        : (wo.actualHours ? `${Math.round(parseFloat(wo.actualHours) * 60)} Menit` : '-')}
                                </span>
                            </div>
                        </div>

                        {/* Catatan Lapangan & Remarks */}
                        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                    Catatan Penyelesaian Lapangan
                                </span>
                                <span className="text-xs text-emerald-200 whitespace-pre-line leading-relaxed">
                                    {wo.completionNotes || '-'}
                                </span>
                            </div>

                            <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                                    Remarks / Catatan Khusus
                                </span>
                                <span className="text-xs text-amber-200 whitespace-pre-line leading-relaxed">
                                    {wo.remarks || '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION IV: PENGESAHAN & TANDA TANGAN (Format Sama Seperti di PDF) */}
                    <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 flex flex-col gap-3">
                        <div className="text-center font-bold text-slate-300 text-xs uppercase tracking-wider">
                            Lembar Pengesahan Penugasan & Penyelesaian Tugas
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center font-sans text-[11px] pt-1">
                            <div className="flex flex-col items-center justify-between border border-slate-800/80 rounded-lg p-3 bg-slate-900/40">
                                <span className="text-slate-400 font-medium">Diberikan / Disetujui Oleh,</span>
                                <span className="text-[10px] text-slate-500">Supervisor IT</span>
                                <div className="w-28 border-b border-dashed border-slate-700 my-4" />
                                <span className="text-slate-400">( ........................................ )</span>
                            </div>

                            <div className="flex flex-col items-center justify-between border border-blue-500/30 rounded-lg p-3 bg-blue-950/20">
                                <span className="text-blue-300 font-medium">Diterima & Dilaksanakan Oleh,</span>
                                <span className="text-[10px] text-blue-400">Teknisi / Pelaksana Tugas</span>
                                <div className="w-28 border-b border-blue-500/40 my-4" />
                                <div className="flex flex-col">
                                    <strong className="text-white font-bold">{wo.assignedTechnicianName || 'Teknisi'}</strong>
                                    <span className="text-[10px] text-slate-400 font-mono">NIK: {wo.assignedTechnicianNik || '-'}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-between border border-slate-800/80 rounded-lg p-3 bg-slate-900/40">
                                <span className="text-slate-400 font-medium">Diverifikasi / Diperiksa Oleh,</span>
                                <span className="text-[10px] text-slate-500">Dept Head / Verifikator</span>
                                <div className="w-28 border-b border-dashed border-slate-700 my-4" />
                                <span className="text-slate-400">( ........................................ )</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Modal Action */}
                <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-mono">
                        Dibuat Sistem: {wo.createdAt ? new Date(wo.createdAt).toLocaleString('id-ID') : '-'}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition-colors text-xs"
                        >
                            Tutup
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                onEdit(wo);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5 text-xs shadow-lg shadow-blue-500/20"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Penugasan</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
