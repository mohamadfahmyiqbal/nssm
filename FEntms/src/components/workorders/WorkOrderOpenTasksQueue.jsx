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
import { calculateTaskDurationMinutes, calculateGroupDurationMinutes } from './workOrderUtils';

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
                    return (
                        <div
                            key={group.key}
                            onClick={() => onSelectGroup(group)}
                            className="bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-blue-500/50 rounded-xl p-3 cursor-pointer transition-all flex flex-col gap-1.5 group relative"
                        >
                            <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-blue-950/80 text-blue-300 border border-blue-800 flex items-center gap-1">
                                    <Layers className="w-2.5 h-2.5" />
                                    Bundle PM ({group.tasks.length} Checklists)
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-cyan-400" />
                                    {durMins} m
                                </span>
                            </div>

                            <div className="font-bold text-slate-200 text-xs group-hover:text-blue-300 transition-colors">
                                {group.perangkat}
                            </div>
                            <div className="text-[11px] text-slate-400">
                                {group.subKategori} • {group.category}
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/50 text-[10px] text-blue-400 font-mono font-medium">
                                <span>Klik untuk Load ke Form</span>
                                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    );
                })}

                {/* 2. Individual Tasks / Incidents */}
                {filteredSingles.map(task => {
                    const durMins = calculateTaskDurationMinutes(task);
                    const isIncident = task.type === 'INCIDENT_ANOMALY';
                    return (
                        <div
                            key={task.uniqueId}
                            onClick={() => onSelectTask(task)}
                            className="bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-blue-500/50 rounded-xl p-3 cursor-pointer transition-all flex flex-col gap-1.5 group relative"
                        >
                            <div className="flex items-center justify-between">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono border ${
                                    isIncident
                                        ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                }`}>
                                    {isIncident ? 'INCIDENT' : 'PREVENTIVE'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-cyan-400" />
                                    {durMins} m
                                </span>
                            </div>

                            <div className="font-bold text-slate-200 text-xs group-hover:text-blue-300 transition-colors">
                                {task.title}
                            </div>
                            {task.perangkat && (
                                <div className="text-[11px] text-slate-400">
                                    Perangkat: {task.perangkat}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/50 text-[10px] text-blue-400 font-mono font-medium">
                                <span>Klik untuk Load ke Form</span>
                                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
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
