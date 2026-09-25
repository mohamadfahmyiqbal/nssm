import React from 'react';
import {
    Briefcase,
    Search,
    Layers,
    Clock,
    Plus,
    AlertTriangle,
    ShieldAlert,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { calculateTaskDurationMinutes, calculateGroupDurationMinutes } from '../utils/workOrderUtils';

export default function WorkOrderOpenTasksQueue({
    tasks = [],
    searchQuery,
    setSearchQuery,
    selectedTask,
    onSelectTask,
    onSelectGroup,
    onOpenCreateCustom
}) {
    // Grouping tasks by SubKategori + Perangkat
    const groupedMap = {};
    const unGroupedTasks = [];

    tasks.forEach(task => {
        if (task.type === 'PREVENTIVE_MAINTENANCE' && task.subKategori && task.perangkat) {
            const key = `${task.subKategori}___${task.perangkat}`;
            if (!groupedMap[key]) {
                groupedMap[key] = {
                    key,
                    type: task.type,
                    category: task.category,
                    subKategori: task.subKategori,
                    perangkat: task.perangkat,
                    tasks: []
                };
            }
            groupedMap[key].tasks.push(task);
        } else {
            unGroupedTasks.push(task);
        }
    });

    const groupsList = Object.values(groupedMap);

    // Filter based on search query
    const filteredGroups = groupsList.filter(g => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (g.perangkat && g.perangkat.toLowerCase().includes(q)) ||
            (g.subKategori && g.subKategori.toLowerCase().includes(q))
        );
    });

    const filteredSingles = unGroupedTasks.filter(t => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (t.title && t.title.toLowerCase().includes(q)) ||
            (t.perangkat && t.perangkat.toLowerCase().includes(q)) ||
            (t.checkItem && t.checkItem.toLowerCase().includes(q))
        );
    });

    return (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl backdrop-blur-md overflow-hidden h-[calc(100vh-320px)] min-h-[550px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <div>
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                            Antrean Task & PM Open
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono">
                            Pilih task untuk mengisi formulir SPK
                        </p>
                    </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                    {tasks.length} Item
                </span>
            </div>

            {/* Tombol Buat Work Order Manual */}
            <button
                type="button"
                onClick={onOpenCreateCustom}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-950/70 to-indigo-950/70 hover:from-blue-900/90 hover:to-indigo-900/90 text-blue-300 border border-blue-800/60 hover:border-blue-500 rounded-xl text-xs font-bold font-mono transition-all shadow-sm group"
            >
                <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform text-blue-400" />
                <span>+ Buat Work Order Kosong</span>
            </button>

            {/* Search Filter Input */}
            <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    placeholder="Cari Task / Perangkat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
            </div>

            {/* List Item Antrean */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 custom-scrollbar pr-1">
                {/* 1. Bundled PM Groups */}
                {filteredGroups.map(group => {
                    const durMins = calculateGroupDurationMinutes(group);
                    const assetId = `AST-${(group.perangkat || 'DEV').replace(/\s+/g, '-').slice(0, 10).toUpperCase()}`;
                    const location = 'Server Room 2B, Lt. 2';
                    const priority = 'P2 Medium';
                    const slaRemaining = '4h remaining';

                    return (
                        <div
                            key={group.key}
                            className="bg-slate-950/80 hover:bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/50 rounded-xl p-3 transition-all flex flex-col gap-2 group shadow-md"
                        >
                            {/* Top Row: Asset ID, Priority, SLA */}
                            <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30 truncate">
                                    {assetId}
                                </span>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border bg-amber-500/20 text-amber-300 border-amber-500/40">
                                        {priority}
                                    </span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5 text-amber-400" />
                                        <span>{slaRemaining}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Middle Row: Device Name & Precise Location */}
                            <div>
                                <div className="font-extrabold text-slate-100 text-xs truncate group-hover:text-cyan-300 transition-colors">
                                    {group.perangkat}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-sans">
                                    <span className="text-slate-300 font-medium truncate">{location}</span>
                                    <span className="text-slate-500">• {group.subKategori}</span>
                                </div>
                            </div>

                            {/* Bottom Row: Checklist count & Action Buttons */}
                            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-mono text-slate-400">
                                    {group.tasks.length} Checklist ({durMins}m)
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => onSelectGroup(group)}
                                        className="px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                                    >
                                        <span>Add to Schedule</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onSelectGroup(group)}
                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-md shadow-blue-600/20"
                                    >
                                        <span>Assign</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* 2. Individual Tasks / Incidents */}
                {filteredSingles.map(task => {
                    const durMins = calculateTaskDurationMinutes(task);
                    const isIncident = task.type === 'INCIDENT_ANOMALY';
                    const assetId = task.assetId || `AST-${(task.perangkat || 'DEV').replace(/\s+/g, '-').slice(0, 10).toUpperCase()}`;
                    const location = task.location || 'Server Room 2B, Lt. 2';
                    const priority = isIncident ? 'P1 Critical' : (task.suggestedPriority || 'P2 Medium');
                    const slaRemaining = isIncident ? '1h 30m remaining' : '4h remaining';

                    return (
                        <div
                            key={task.uniqueId}
                            className="bg-slate-950/80 hover:bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/50 rounded-xl p-3 transition-all flex flex-col gap-2 group shadow-md"
                        >
                            {/* Top Row: Asset ID, Priority, SLA */}
                            <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30 truncate">
                                    {assetId}
                                </span>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                                        isIncident
                                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    }`}>
                                        {priority}
                                    </span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5 text-amber-400" />
                                        <span>{slaRemaining}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Middle Row: Title & Precise Location */}
                            <div>
                                <div className="font-extrabold text-slate-100 text-xs truncate group-hover:text-cyan-300 transition-colors">
                                    {task.title || task.checkItem}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-sans">
                                    <span className="text-slate-300 font-medium truncate">{location}</span>
                                    {task.perangkat && <span className="text-slate-500">• {task.perangkat}</span>}
                                </div>
                            </div>

                            {/* Bottom Row: Duration & Action Buttons */}
                            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                                    {durMins} Menit
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => onSelectTask(task)}
                                        className="px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                                    >
                                        <span>Add to Schedule</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onSelectTask(task)}
                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-md shadow-blue-600/20"
                                    >
                                        <span>Assign</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredGroups.length === 0 && filteredSingles.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-xs">
                        Tidak ada antrean task yang cocok.
                    </div>
                )}
            </div>
        </div>
    );
}
