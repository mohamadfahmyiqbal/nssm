import React, { useState } from 'react';
import {
    Layers,
    Server,
    AlertTriangle,
    Clock,
    Search,
    GripVertical,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Plus,
    Coffee
} from 'lucide-react';

const QUICK_BREAK_DURATIONS = [
    { label: 'Istirahat 15 Menit', durationMinutes: 15 },
    { label: 'Istirahat 30 Menit', durationMinutes: 30 },
    { label: 'Istirahat 45 Menit', durationMinutes: 45 },
    { label: 'Istirahat 60 Menit', durationMinutes: 60 }
];

export default function TaskPoolSidebar({
    tasks,
    onAssignTask,
    onAssignGroup,
    onAssignBreak,
    onDragStart
}) {
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [expandedGroups, setExpandedGroups] = useState({});

    const toggleGroup = (key) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Grouping by Sub Kategori & Perangkat (Semua tugas dapat di-assign berkali-kali ke teknisi berbeda)
    const grouped = React.useMemo(() => {
        const map = new Map();
        tasks.forEach(task => {
            const subCat = (task.subKategori || 'Lainnya').trim();
            const device = (task.perangkat || 'General Device').trim();
            const key = `${subCat}__${device}`;

            if (!map.has(key)) {
                map.set(key, {
                    key,
                    subKategori: subCat,
                    perangkat: device,
                    category: task.category,
                    type: task.type,
                    tasks: []
                });
            }
            map.get(key).tasks.push(task);
        });

        return Array.from(map.values()).filter(g => {
            const matchesSearch = 
                g.perangkat.toLowerCase().includes(search.toLowerCase()) ||
                g.subKategori.toLowerCase().includes(search.toLowerCase()) ||
                g.tasks.some(t => t.checkItem.toLowerCase().includes(search.toLowerCase()));

            const matchesType = filterType === 'ALL' || g.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [tasks, search, filterType]);

    // Helper kalkulasi durasi standar dari cycle_time_minutes ITAM
    const getTaskMinutes = (task) => {
        if (!task) return 5;
        if (task.type === 'INCIDENT_ANOMALY') return 120;
        return task.cycleTimeMinutes != null ? Number(task.cycleTimeMinutes) : 5;
    };

    const getGroupMinutes = (group) => {
        if (!group || !group.tasks || group.tasks.length === 0) return 5;
        if (group.type === 'INCIDENT_ANOMALY') return 120;
        return group.tasks.reduce((sum, t) => sum + (t.cycleTimeMinutes != null ? Number(t.cycleTimeMinutes) : 5), 0);
    };

    return (
        <div className="w-84 flex-shrink-0 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl h-full max-h-full">
            {/* Sidebar Header */}
            <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-col gap-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-white text-xs">Daftar Tugas / Backlog</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold">
                        {tasks.length} Task
                    </span>
                </div>

                {/* Search & Filter Mini */}
                <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari task / perangkat..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-blue-500"
                    >
                        <option value="ALL">Semua</option>
                        <option value="PREVENTIVE_MAINTENANCE">PM</option>
                        <option value="INCIDENT_ANOMALY">Insiden</option>
                        <option value="BREAK">☕ Istirahat</option>
                    </select>
                </div>
            </div>

            {/* Section Drag & Drop Waktu Istirahat */}
            {(filterType === 'ALL' || filterType === 'BREAK') && (
                <div className="p-2.5 bg-amber-950/20 border-b border-amber-500/20 flex flex-col gap-1.5 flex-shrink-0">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                        <span className="flex items-center gap-1.5">
                            <Coffee className="w-3.5 h-3.5 text-amber-400" />
                            <span>Waktu Istirahat (Drag ke Timeline)</span>
                        </span>
                        <button
                            onClick={() => onAssignBreak && onAssignBreak()}
                            className="text-[10px] font-semibold text-amber-400 hover:text-amber-300 underline"
                        >
                            + Custom Jam
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        {QUICK_BREAK_DURATIONS.map((bItem, idx) => (
                            <div
                                key={idx}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('application/json', JSON.stringify({
                                        kind: 'BREAK',
                                        breakItem: { label: bItem.label },
                                        durationMinutes: bItem.durationMinutes
                                    }));
                                }}
                                className="p-1.5 bg-slate-950/80 border border-amber-500/30 hover:border-amber-400 rounded-lg cursor-grab active:cursor-grabbing text-[10px] flex items-center justify-between group shadow-sm transition-all"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-amber-200 group-hover:text-amber-100 truncate">
                                        {bItem.label}
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                                        <Clock className="w-2.5 h-2.5 text-amber-400" />
                                        <span>{bItem.durationMinutes} Menit</span>
                                    </div>
                                </div>
                                <GripVertical className="w-3 h-3 text-amber-500/60 group-hover:text-amber-400 flex-shrink-0 ml-1" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Hint Drag & Drop */}
            <div className="px-3 py-1.5 bg-blue-950/40 border-b border-blue-900/40 text-[10px] text-cyan-300 flex items-center gap-1.5 flex-shrink-0">
                <GripVertical className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 animate-pulse" />
                <span>Drag kartu tugas atau istirahat ke timeline</span>
            </div>

            {/* List Tugas / Perangkat Backlog (Scrollable) */}
            <div className="overflow-y-auto flex-1 p-2 flex flex-col gap-2 min-h-0 divide-y divide-transparent">
                {grouped.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-1 text-xs">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500/50 stroke-[1.5]" />
                        <span className="font-semibold text-slate-400">Semua Tugas Telah Terjadwal</span>
                        <span className="text-[10px] text-slate-600">Tidak ada backlog tugas pada tanggal ini.</span>
                    </div>
                ) : (
                    grouped.map((group) => {
                        const isExpanded = !!expandedGroups[group.key];
                        const groupStdMins = getGroupMinutes(group);

                        return (
                            <div
                                key={group.key}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('application/json', JSON.stringify({
                                        kind: 'GROUP',
                                        group,
                                        standardMinutes: groupStdMins
                                    }));
                                    if (onDragStart) onDragStart(group);
                                }}
                                className="bg-slate-950/70 border border-slate-800/90 hover:border-blue-500/50 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing shadow-sm transition-all group hover:shadow-cyan-950/30"
                            >
                                {/* Group Header */}
                                <div className="p-2.5 bg-slate-900/70 flex items-center justify-between gap-2 border-b border-slate-800/50">
                                    <div 
                                        onClick={() => toggleGroup(group.key)}
                                        className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                                    >
                                        <button className="text-slate-400 hover:text-white p-0.5">
                                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                        </button>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <div className="font-bold text-slate-100 text-xs truncate">
                                                    {group.perangkat}
                                                </div>
                                                {/* Badge Durasi Standar ITAM */}
                                                <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold flex-shrink-0 shadow-sm">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {groupStdMins} Mnt
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                                                <span className="text-cyan-400 font-semibold">{group.subKategori}</span>
                                                <span>•</span>
                                                <span>{group.tasks.length} Checklist</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => onAssignGroup(group)}
                                        title="Jadwalkan unit perangkat ini"
                                        className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors border border-blue-500/30"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Items checklist jika dibuka */}
                                {isExpanded && (
                                    <div className="p-2 bg-slate-950/90 flex flex-col gap-1.5 border-t border-slate-800/60">
                                        {group.tasks.map((task) => {
                                            const singleStdMins = getTaskMinutes(task);

                                            return (
                                                <div
                                                    key={task.uniqueId}
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.stopPropagation();
                                                        e.dataTransfer.setData('application/json', JSON.stringify({
                                                            kind: 'TASK',
                                                            task,
                                                            standardMinutes: singleStdMins
                                                        }));
                                                    }}
                                                    className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:border-cyan-500/40 flex items-center justify-between gap-2 text-[11px] cursor-grab active:cursor-grabbing hover:bg-slate-850"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-slate-300 font-medium truncate flex items-center gap-1.5">
                                                            <span className="truncate">{task.checkItem}</span>
                                                            {task.assignedCount > 0 && (
                                                                <span className="text-[9px] px-1 rounded bg-blue-950 border border-blue-500/40 text-blue-300 font-mono flex-shrink-0" title={`Telah dialokasikan ke ${task.assignedCount} teknisi`}>
                                                                    {task.assignedCount}x Assigned
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1.5">
                                                            <span>{task.periodik} • {task.bagian}</span>
                                                            <span>•</span>
                                                            <span className="text-cyan-400 font-bold">{singleStdMins} mnt</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => onAssignTask(task)}
                                                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold px-1.5 py-0.5 rounded hover:bg-slate-800"
                                                    >
                                                        + Jadwal
                                                    </button>
                                                </div>
                                            );
                                        })}
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
