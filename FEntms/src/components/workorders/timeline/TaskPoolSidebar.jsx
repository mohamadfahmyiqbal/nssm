import React, { useState, useMemo } from 'react';
import {
    Layers,
    Clock,
    Search,
    GripVertical,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Plus,
    MapPin,
    CalendarPlus,
    UserCheck,
    Tag
} from 'lucide-react';

export default function TaskPoolSidebar({
    tasks,
    onAssignTask,
    onAssignGroup,
    onDragStart
}) {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('PREVENTIVE_MAINTENANCE'); // 'PREVENTIVE_MAINTENANCE' | 'INCIDENT_ANOMALY'
    const [expandedGroups, setExpandedGroups] = useState({});

    const toggleGroup = React.useCallback((key) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    // Calculate count per category
    const pmCount = useMemo(() => tasks.filter(t => t.type === 'PREVENTIVE_MAINTENANCE').length, [tasks]);
    const incidentCount = useMemo(() => tasks.filter(t => t.type === 'INCIDENT_ANOMALY').length, [tasks]);

    // Helper kalkulasi durasi standar dari cycle_time_minutes ITAM
    const getTaskMinutes = React.useCallback((task) => {
        if (!task) return 5;
        if (task.type === 'INCIDENT_ANOMALY') return 120;
        return task.cycleTimeMinutes != null ? Number(task.cycleTimeMinutes) : 5;
    }, []);

    const getGroupMinutes = React.useCallback((group) => {
        if (!group || !group.tasks || group.tasks.length === 0) return 5;
        if (group.type === 'INCIDENT_ANOMALY') return 120;
        return group.tasks.reduce((sum, t) => sum + (t.cycleTimeMinutes != null ? Number(t.cycleTimeMinutes) : 5), 0);
    }, []);

    // Grouping by Sub Kategori & Perangkat for current category
    const grouped = useMemo(() => {
        const map = new Map();
        tasks.filter(t => t.type === activeCategory).forEach(task => {
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
                    assetId: task.assetId || `AST-${device.replace(/\s+/g, '-').slice(0, 10).toUpperCase()}`,
                    location: task.location || 'Server Room 2B, Lt. 2',
                    priority: task.priority || (task.type === 'INCIDENT_ANOMALY' ? 'P1 Critical' : 'P2 Medium'),
                    priorityLevel: task.priorityLevel || (task.type === 'INCIDENT_ANOMALY' ? 'P1' : 'P2'),
                    slaRemaining: task.slaRemaining || (task.type === 'INCIDENT_ANOMALY' ? '1h 30m remaining' : '4h remaining'),
                    tasks: []
                });
            }
            map.get(key).tasks.push(task);
        });

        const q = search.trim().toLowerCase();
        if (!q) return Array.from(map.values());

        return Array.from(map.values()).filter(g => {
            return (
                g.perangkat.toLowerCase().includes(q) ||
                g.subKategori.toLowerCase().includes(q) ||
                g.assetId.toLowerCase().includes(q) ||
                g.location.toLowerCase().includes(q) ||
                g.tasks.some(t => (t.checkItem || t.title || '').toLowerCase().includes(q))
            );
        });
    }, [tasks, search, activeCategory]);

    const getPriorityBadgeClass = (level) => {
        switch (level) {
            case 'P1':
            case 'CRITICAL':
                return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
            case 'P2':
            case 'HIGH':
                return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
            case 'P3':
            case 'MEDIUM':
                return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
            default:
                return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
        }
    };

    return (
        <div className="w-84 lg:w-96 flex-shrink-0 bg-slate-900/95 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl h-full max-h-full min-h-0">
            {/* Sidebar Header */}
            <div className="p-2.5 bg-slate-950/90 border-b border-slate-800 flex flex-col gap-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-white text-xs">Unassigned Backlog</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">
                        {tasks.length} Total
                    </span>
                </div>

                {/* 2 Tabs: Preventive Maintenance vs Insiden */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800/80 text-xs font-semibold">
                    <button
                        onClick={() => setActiveCategory('PREVENTIVE_MAINTENANCE')}
                        className={`py-1 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                            activeCategory === 'PREVENTIVE_MAINTENANCE'
                                ? 'bg-blue-600 text-white shadow-sm font-bold'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                    >
                        <span>Preventive (PM)</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            activeCategory === 'PREVENTIVE_MAINTENANCE' ? 'bg-blue-950 text-blue-200' : 'bg-slate-800 text-slate-400'
                        }`}>
                            {pmCount}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveCategory('INCIDENT_ANOMALY')}
                        className={`py-1 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                            activeCategory === 'INCIDENT_ANOMALY'
                                ? 'bg-rose-600 text-white shadow-sm font-bold'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                    >
                        <span>Insiden</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            activeCategory === 'INCIDENT_ANOMALY' ? 'bg-rose-950 text-rose-200' : 'bg-slate-800 text-slate-400'
                        }`}>
                            {incidentCount}
                        </span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Cari Asset ID, lokasi, perangkat..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Hint Drag & Drop */}
            <div className="px-3 py-1.5 bg-blue-950/40 border-b border-blue-900/40 text-[10px] text-cyan-300 flex items-center gap-1.5 flex-shrink-0">
                <GripVertical className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 animate-pulse" />
                <span>Drag kartu aset / tugas ke timeline</span>
            </div>

            {/* List Tugas / Perangkat Backlog (Scrollable with dedicated styling) */}
            <div className="overflow-y-auto flex-1 p-2.5 flex flex-col gap-3 min-h-0 overscroll-contain pb-6">
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
                                className="w-full flex-shrink-0 bg-slate-950/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing shadow-md transition-all group flex flex-col"
                            >
                                {/* Card Body & Header */}
                                <div className="p-3 flex flex-col gap-2.5 bg-gradient-to-br from-slate-900/95 via-slate-900/70 to-slate-950/80">
                                    {/* Top Row: Category Tag, Asset ID & Priority / SLA */}
                                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30 truncate flex items-center gap-1">
                                                <Tag className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                                {group.assetId}
                                            </span>
                                            {group.subKategori && (
                                                <span className="text-[9px] font-semibold text-slate-300 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60 truncate">
                                                    {group.subKategori}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {/* Priority Badge */}
                                            <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border ${getPriorityBadgeClass(group.priorityLevel)}`}>
                                                {group.priority}
                                            </span>

                                            {/* SLA Timer */}
                                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5 text-amber-400" />
                                                <span>{group.slaRemaining}</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Middle Row: Device Name & Details */}
                                    <div className="space-y-1">
                                        <div className="font-extrabold text-slate-100 text-xs truncate group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                                            <span className="truncate">{group.perangkat}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1 font-sans">
                                            <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                                            <span className="text-slate-300 font-medium truncate">{group.location}</span>
                                        </div>
                                    </div>

                                    {/* Info Badges Row: Total Tasks, Est Duration, Assigned status */}
                                    <div className="grid grid-cols-2 gap-1.5 py-1 px-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-[10px] font-mono">
                                        <div className="flex items-center gap-1 text-slate-300">
                                            <Layers className="w-3 h-3 text-cyan-400" />
                                            <span><strong>{group.tasks.length}</strong> Item Checklist</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-amber-300 justify-end">
                                            <Clock className="w-3 h-3 text-amber-400" />
                                            <span>Est: <strong>{groupStdMins}</strong> mnt</span>
                                        </div>
                                    </div>

                                    {/* Bottom Meta & Quick Action Buttons */}
                                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => toggleGroup(group.key)}
                                            className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/80 px-2 py-1 rounded border border-cyan-500/20 transition-all cursor-pointer"
                                        >
                                            {isExpanded ? <ChevronDown className="w-3 h-3 text-cyan-400" /> : <ChevronRight className="w-3 h-3 text-cyan-400" />}
                                            <span>{isExpanded ? 'Tutup Checklist' : 'Lihat Checklist'}</span>
                                        </button>

                                        <div className="flex items-center gap-1.5">
                                            {/* Quick Action: Assign Instant */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAssignGroup(group);
                                                }}
                                                title="Assign seluruh item checklist perangkat ini ke Teknisi"
                                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-md shadow-blue-600/20 active:scale-95"
                                            >
                                                <UserCheck className="w-3 h-3" />
                                                <span>Assign Semua</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Items checklist jika dibuka (Accordion scrollable jika banyak) */}
                                {isExpanded && (
                                    <div className="p-2 bg-slate-950 flex flex-col gap-1.5 border-t border-slate-800/60 max-h-60 overflow-y-auto overscroll-contain pr-1">
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
                                                    className="p-2 bg-slate-900/90 border border-slate-800 rounded-lg hover:border-cyan-500/40 flex items-center justify-between gap-2 text-[11px] cursor-grab active:cursor-grabbing hover:bg-slate-850 transition-all flex-shrink-0"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-slate-200 font-medium truncate flex items-center gap-1.5">
                                                            <span className="truncate">{task.checkItem}</span>
                                                            {task.assignedCount > 0 && (
                                                                <span className="text-[9px] px-1 rounded bg-blue-950 border border-blue-500/40 text-blue-300 font-mono flex-shrink-0" title={`Telah dialokasikan ke ${task.assignedCount} teknisi`}>
                                                                    {task.assignedCount}x Assigned
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                                                            <span>{task.periodik}</span>
                                                            <span>•</span>
                                                            <span className="text-cyan-400 font-bold">{singleStdMins} mnt</span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAssignTask(task);
                                                        }}
                                                        className="text-[10px] text-cyan-400 hover:text-white bg-cyan-950/60 hover:bg-cyan-600 border border-cyan-500/30 px-2 py-1 rounded font-bold transition-all flex items-center gap-1 flex-shrink-0"
                                                    >
                                                        <Plus className="w-2.5 h-2.5" />
                                                        <span>Assign</span>
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
