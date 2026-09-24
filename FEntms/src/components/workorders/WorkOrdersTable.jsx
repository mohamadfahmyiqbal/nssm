import React from 'react';
import {
    Briefcase,
    RefreshCw,
    Calendar,
    Edit3,
    Trash2,
    Eye
} from 'lucide-react';

export default function WorkOrdersTable({
    workOrders,
    isLoading,
    dateMode,
    selectedDate,
    formatDisplayDate,
    getPriorityBadge,
    getStatusBadge,
    onEditWo,
    onDeleteWo,
    onQuickStatusChange,
    onViewDetail
}) {
    return (
        <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
            {/* Active Date Banner */}
            <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-400 font-medium">Work Order Tanggal:</span>
                    <span className="font-bold text-white font-mono">
                        {dateMode === 'DAILY' ? formatDisplayDate(selectedDate) : 'Semua Tanggal'}
                    </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                    {workOrders.length} Work Order Terdaftar
                </span>
            </div>

            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-3 px-4">No. WO & Target</th>
                            <th className="py-3 px-4">Tipe & Prioritas</th>
                            <th className="py-3 px-4">Tugas Pengerjaan</th>
                            <th className="py-3 px-4">Man Power Ditugaskan</th>
                            <th className="py-3 px-4">Est. Durasi & Target</th>
                            <th className="py-3 px-4 text-emerald-400">Actual Pengerjaan</th>
                            <th className="py-3 px-4">Status Pengerjaan</th>
                            <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {isLoading ? (
                            <tr>
                                <td colSpan="8" className="text-center py-16 text-slate-400">
                                    <RefreshCw className="w-7 h-7 animate-spin mx-auto text-blue-500 mb-2" />
                                    <span>Memuat Work Orders...</span>
                                </td>
                            </tr>
                        ) : workOrders.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="text-center py-16 text-slate-500">
                                    <Briefcase className="w-10 h-10 stroke-[1.5] mx-auto text-slate-600 mb-2" />
                                    <div className="text-sm font-semibold">Belum Ada Work Order pada Tanggal Ini</div>
                                    <div className="text-xs text-slate-600 mt-0.5">Buka tab "Daftar Tugas Sumber" dan klik "Tugaskan Teknisi".</div>
                                </td>
                            </tr>
                        ) : (
                            workOrders.map((wo) => {
                                const hasActual = wo.actualStartTime || wo.actualEndTime || (wo.actualDurationMinutes !== null && wo.actualDurationMinutes !== undefined && wo.actualDurationMinutes !== '') || (wo.actualHours !== null && wo.actualHours !== undefined && wo.actualHours !== '');
                                const actMins = wo.actualDurationMinutes !== null && wo.actualDurationMinutes !== undefined && wo.actualDurationMinutes !== ''
                                    ? wo.actualDurationMinutes
                                    : (wo.actualHours ? Math.round(parseFloat(wo.actualHours) * 60) : null);

                                return (
                                    <tr key={wo.id} className="hover:bg-slate-800/30 transition-colors group">
                                        {/* No. WO & Target */}
                                        <td className="py-3 px-4">
                                            <div className="font-mono font-bold text-blue-400">{wo.woNumber}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                                                <Calendar className="w-3 h-3 text-slate-500" />
                                                {wo.targetDate || '-'}
                                            </div>
                                        </td>

                                        {/* Tipe & Prioritas */}
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                                    wo.woType === 'PREVENTIVE_MAINTENANCE'
                                                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                                }`}>
                                                    {wo.woType === 'PREVENTIVE_MAINTENANCE' ? 'Preventive Maint.' : 'Incident & Anomaly'}
                                                </span>
                                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${getPriorityBadge(wo.priority)}`}>
                                                    {wo.priority}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Task Title & Desc */}
                                        <td className="py-3 px-4 max-w-xs">
                                            <div className="font-semibold text-slate-100 truncate text-sm" title={wo.title}>
                                                {wo.title}
                                            </div>
                                            <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5" title={wo.description}>
                                                {wo.description || '-'}
                                            </div>
                                        </td>

                                        {/* Man Power Allocation */}
                                        <td className="py-3 px-4">
                                            {wo.assignedTechnicianName ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-xs">
                                                        {wo.assignedTechnicianName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-200">{wo.assignedTechnicianName}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono">NIK: {wo.assignedTechnicianNik || '-'}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-500 italic text-[11px]">Belum Ditugaskan</span>
                                            )}
                                        </td>

                                        {/* Jadwal Jam Kerja, Alokasi & Target ITAM */}
                                        <td className="py-3 px-4 font-mono">
                                            <div className="text-blue-400 font-bold text-xs">
                                                {wo.startTime || '08:00'} - {wo.endTime || '10:00'}
                                            </div>
                                            <div className="text-slate-400 text-[10px]">
                                                Alokasi: {Math.round((parseFloat(wo.estimatedHours) || 1) * 60)} Mnt
                                            </div>
                                            <div className="text-cyan-400 text-[10px] font-semibold mt-0.5">
                                                Target: {wo.targetDurationMinutes || Math.round((parseFloat(wo.estimatedHours) || 1) * 60)} Mnt
                                            </div>
                                        </td>

                                        {/* Realisasi / Actual Pengerjaan */}
                                        <td className="py-3 px-4 font-mono">
                                            {hasActual ? (
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                                                        <span>{wo.actualStartTime || '-'}</span>
                                                        <span>s/d</span>
                                                        <span>{wo.actualEndTime || '-'}</span>
                                                    </div>
                                                    {actMins !== null && (
                                                        <div className="text-[11px] text-emerald-300 font-semibold">
                                                            Durasi: {actMins} Menit
                                                        </div>
                                                    )}
                                                    {wo.completionNotes && (
                                                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={`Catatan: ${wo.completionNotes}`}>
                                                            📝 {wo.completionNotes}
                                                        </div>
                                                    )}
                                                    {wo.remarks && (
                                                        <div className="text-[10px] text-amber-400/90 truncate max-w-[140px] font-sans" title={`Remarks: ${wo.remarks}`}>
                                                            💬 {wo.remarks}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-slate-500 italic text-[11px]">-</span>
                                                    {wo.remarks && (
                                                        <div className="text-[10px] text-amber-400/90 truncate max-w-[140px] font-sans" title={`Remarks: ${wo.remarks}`}>
                                                            💬 {wo.remarks}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="py-3 px-4">
                                            <select
                                                value={wo.status}
                                                onChange={(e) => onQuickStatusChange(wo.id, e.target.value)}
                                                className={`text-xs font-semibold px-2 py-1 rounded border bg-slate-950/80 cursor-pointer focus:outline-none ${getStatusBadge(wo.status)}`}
                                            >
                                                <option value="OPEN">OPEN</option>
                                                <option value="ASSIGNED">ASSIGNED</option>
                                                <option value="IN_PROGRESS">IN_PROGRESS</option>
                                                <option value="RESOLVED">RESOLVED</option>
                                                <option value="CLOSED">CLOSED</option>
                                            </select>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => onViewDetail && onViewDetail(wo)}
                                                    title="Lihat Detail Work Order"
                                                    className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onEditWo(wo)}
                                                    title="Edit Work Order"
                                                    className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded-lg transition-colors"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteWo(wo.id, wo.woNumber)}
                                                    title="Hapus Work Order"
                                                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
