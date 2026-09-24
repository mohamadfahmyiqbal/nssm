import React, { useState, useMemo } from 'react';
import {
    Layers,
    RefreshCw,
    Calendar,
    UserCheck,
    ChevronDown,
    ChevronRight,
    Server,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Eye
} from 'lucide-react';

export default function SourceTasksTable({
    tasks,
    isLoading,
    dateMode,
    selectedDate,
    formatDisplayDate,
    onAssignTask,
    onAssignGroup,
    onEditAssignedWo,
    onViewDetail
}) {
    // State untuk Accordion collapse/expand per grup (default: semua tertutup agar ringkas)
    const [expandedGroups, setExpandedGroups] = useState({});

    const toggleGroup = (groupKey) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupKey]: !prev[groupKey]
        }));
    };

    const expandAll = () => {
        const all = {};
        groupedTasks.forEach(g => { all[g.key] = true; });
        setExpandedGroups(all);
    };

    const collapseAll = () => {
        setExpandedGroups({});
    };

    // Grouping Tasks by Sub Kategori -> Perangkat
    const groupedTasks = useMemo(() => {
        const groups = new Map();

        tasks.forEach(task => {
            const subCat = (task.subKategori || 'Lainnya / Uncategorized').trim();
            const device = (task.perangkat || 'General Device').trim();
            const groupKey = `${subCat}__${device}`;

            if (!groups.has(groupKey)) {
                groups.set(groupKey, {
                    key: groupKey,
                    subKategori: subCat,
                    perangkat: device,
                    category: task.category,
                    type: task.type,
                    tasks: []
                });
            }
            groups.get(groupKey).tasks.push(task);
        });

        return Array.from(groups.values()).sort((a, b) => {
            if (a.subKategori === b.subKategori) {
                return a.perangkat.localeCompare(b.perangkat);
            }
            return a.subKategori.localeCompare(b.subKategori);
        });
    }, [tasks]);

    return (
        <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
            {/* Active Date Banner */}
            <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-400 font-medium">Jadwal Tugas Tanggal:</span>
                    <span className="font-bold text-white font-mono">
                        {dateMode === 'DAILY' ? formatDisplayDate(selectedDate) : 'Semua Tanggal'}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="text-blue-400 font-bold">{groupedTasks.length} Unit Perangkat</span>
                    <span className="text-slate-400">({tasks.length} Checklist Item)</span>
                    <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
                        <button
                            onClick={expandAll}
                            className="text-[10px] text-slate-400 hover:text-cyan-400 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
                        >
                            Buka Semua
                        </button>
                        <span className="text-slate-600">|</span>
                        <button
                            onClick={collapseAll}
                            className="text-[10px] text-slate-400 hover:text-cyan-400 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
                        >
                            Tutup Semua
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Grouped Lists */}
            <div className="overflow-y-auto flex-1 p-3 flex flex-col gap-2.5">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <RefreshCw className="w-7 h-7 animate-spin text-blue-500 mb-1" />
                        <span>Memuat Jadwal Maintenance ITAM & Laporan Insiden...</span>
                    </div>
                ) : groupedTasks.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-2">
                        <Layers className="w-10 h-10 stroke-[1.5] text-slate-600" />
                        <div className="text-sm font-semibold">Tidak Ada Jadwal / Insiden pada Tanggal Ini</div>
                        <div className="text-xs text-slate-600">Gunakan navigasi tanggal di atas untuk melihat tanggal lain.</div>
                    </div>
                ) : (
                    groupedTasks.map((group) => {
                        const isExpanded = !!expandedGroups[group.key];
                        const assignedCount = group.tasks.filter(t => t.isAssigned).length;
                        const hasAnyAssigned = assignedCount > 0;

                        return (
                            <div
                                key={group.key}
                                className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                                    hasAnyAssigned 
                                        ? 'bg-slate-950/40 border-slate-800/60' 
                                        : 'bg-slate-950/70 border-slate-700/80 shadow-md'
                                }`}
                            >
                                {/* Group Header Accordion */}
                                <div className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-850 flex items-center justify-between border-b border-slate-800/60 transition-colors">
                                    <div 
                                        onClick={() => toggleGroup(group.key)}
                                        className="flex items-center gap-3 cursor-pointer flex-1 select-none py-1"
                                    >
                                        <button className="text-slate-400 hover:text-white p-0.5">
                                            {isExpanded ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4" />}
                                        </button>

                                        <div className={`p-1.5 rounded-lg border ${
                                            hasAnyAssigned 
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}>
                                            <Server className="w-4 h-4" />
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-100 text-sm">
                                                    {group.perangkat}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                                                    {group.subKategori}
                                                </span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                                    group.type === 'PREVENTIVE_MAINTENANCE'
                                                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                                }`}>
                                                    {group.type === 'PREVENTIVE_MAINTENANCE' ? 'Preventive Maint.' : 'Incident'}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                                <span>Kategori: <strong className="text-slate-300">{group.category}</strong></span>
                                                <span>•</span>
                                                <span className="text-slate-400 font-mono">{group.tasks.length} item checklist</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Header: Status Ringkas & Tombol Penugasan Perangkat */}
                                    <div className="flex items-center gap-2.5">
                                        {hasAnyAssigned ? (
                                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                <span>Sudah Dibuat WO</span>
                                            </span>
                                        ) : (
                                            onAssignGroup && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAssignGroup(group);
                                                    }}
                                                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 whitespace-nowrap"
                                                    title="Terbitkan Work Order untuk unit perangkat ini"
                                                >
                                                    <UserCheck className="w-3.5 h-3.5" />
                                                    <span>Tugaskan Perangkat Ini</span>
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* Group Tasks Items Table (Hanya muncul saat dibuka) */}
                                {isExpanded && (
                                    <div className="overflow-x-auto bg-slate-950/40">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    <th className="py-2 px-4">Item Checklist</th>
                                                    <th className="py-2 px-4">Periodik & Bagian</th>
                                                    <th className="py-2 px-4">Target Tanggal</th>
                                                    <th className="py-2 px-4">Status Man Power</th>
                                                    <th className="py-2 px-4 text-right">Aksi Item</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/40">
                                                {group.tasks.map((task) => (
                                                    <tr key={task.uniqueId} className="hover:bg-slate-800/30 transition-colors">
                                                        {/* Checklist item */}
                                                        <td className="py-2 px-4 max-w-xs">
                                                            <div className="font-semibold text-slate-200 text-xs">
                                                                {task.checkItem}
                                                            </div>
                                                        </td>

                                                        {/* Periodik & Bagian */}
                                                        <td className="py-2 px-4 font-mono">
                                                            <span className="text-slate-300 font-semibold">{task.periodik}</span>
                                                            <span className="text-slate-500 text-[10px] ml-1">({task.bagian})</span>
                                                        </td>

                                                        {/* Target Tanggal */}
                                                        <td className="py-2 px-4 font-mono text-slate-300 text-xs">
                                                            {task.targetDate}
                                                        </td>

                                                        {/* Status Man Power */}
                                                        <td className="py-2 px-4">
                                                            {task.isAssigned ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                                    <div>
                                                                        <span className="text-[11px] font-bold text-emerald-400">
                                                                            {task.assignedWo?.assignedTechnicianName || 'Teknisi'}
                                                                        </span>
                                                                        <div className="text-[10px] font-mono text-slate-400">
                                                                            WO: {task.assignedWo?.woNumber}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                                                                    Belum Ditugaskan
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Aksi */}
                                                        <td className="py-2 px-4 text-right">
                                                            {task.isAssigned ? (
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    <button
                                                                        onClick={() => onViewDetail && onViewDetail(task.assignedWo)}
                                                                        className="px-2 py-0.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded text-[11px] font-semibold border border-cyan-500/30 transition-colors"
                                                                    >
                                                                        Detail WO
                                                                    </button>
                                                                    <button
                                                                        onClick={() => onEditAssignedWo(task.assignedWo)}
                                                                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold border border-slate-700 transition-colors"
                                                                    >
                                                                        Ubah
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => onAssignTask(task)}
                                                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-semibold transition-all border border-slate-700 flex items-center gap-1 ml-auto"
                                                                >
                                                                    <UserCheck className="w-3 h-3 text-blue-400" />
                                                                    <span>Tugaskan Item</span>
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
