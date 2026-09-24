import React, { useState, useEffect, useMemo } from 'react';
import { 
    Calendar, 
    RefreshCw, 
    Search, 
    Filter, 
    ChevronLeft, 
    ChevronRight, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    BarChart3, 
    Layers,
    SlidersHorizontal,
    Maximize2
} from 'lucide-react';
import { getMaintenanceSchedulesFromDB, getMaintenanceSummaryFromDB } from '../../services/api';

export default function ScheduleGanttView() {
    const [schedules, setSchedules] = useState([]);
    const [summary, setSummary] = useState({ total: 0, pending: 0, completed: 0, cancelled: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [subCategoryFilter, setSubCategoryFilter] = useState('ALL');
    const [periodicFilter, setPeriodicFilter] = useState('ALL');
    
    // Gantt Time Window: Default 1 Minggu (7 hari)
    const [viewDate, setViewDate] = useState(new Date());
    const [daysRange, setDaysRange] = useState(7); // 7, 14, 30, 90 days
    const [groupBy, setGroupBy] = useState('SUBKATEGORI'); // Default 'SUBKATEGORI'

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [schedRes, sumRes] = await Promise.all([
                getMaintenanceSchedulesFromDB(),
                getMaintenanceSummaryFromDB()
            ]);

            if (schedRes.success) {
                setSchedules(schedRes.data || []);
            }
            if (sumRes.success) {
                setSummary(sumRes.summary || { total: 0, pending: 0, completed: 0, cancelled: 0 });
            }
        } catch (error) {
            console.error('Failed to load schedules:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Helper to calculate timeline columns
    const timelineDays = useMemo(() => {
        const days = [];
        const start = new Date(viewDate);
        start.setHours(0, 0, 0, 0);

        for (let i = 0; i < daysRange; i++) {
            const current = new Date(start);
            current.setDate(start.getDate() + i);
            days.push(current);
        }
        return days;
    }, [viewDate, daysRange]);

    const timelineStart = timelineDays[0];
    const timelineEnd = timelineDays[timelineDays.length - 1];

    // Helper format YYYY-MM-DD lokal
    const toDateKey = (date) => {
        if (!date) return '';
        if (typeof date === 'string') {
            return date.split('T')[0];
        }
        const d = new Date(date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    // Sub Categories list for dropdown filter
    const availableSubCategories = useMemo(() => {
        const set = new Set();
        schedules.forEach(item => {
            const sub = item.standardMaintenance?.subKategori;
            if (sub) set.add(sub.trim());
        });
        return Array.from(set).sort();
    }, [schedules]);

    // Filtered schedules
    const filteredSchedules = useMemo(() => {
        return schedules.filter(item => {
            const std = item.standardMaintenance || {};
            const matchesSearch = 
                (item.asset_id && item.asset_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.periodik && item.periodik.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (std.namaPerangkat && std.namaPerangkat.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (std.tipePerangkat && std.tipePerangkat.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (std.kategori && std.kategori.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (std.subKategori && std.subKategori.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.cancel_reason && item.cancel_reason.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStatus = statusFilter === 'ALL' || 
                (item.status && item.status.toUpperCase() === statusFilter.toUpperCase());

            const matchesSubCategory = subCategoryFilter === 'ALL' || 
                (std.subKategori && std.subKategori.trim().toUpperCase() === subCategoryFilter.toUpperCase());

            const matchesPeriodic = periodicFilter === 'ALL' || 
                (item.periodik_type && item.periodik_type.toUpperCase() === periodicFilter.toUpperCase());

            return matchesSearch && matchesStatus && matchesSubCategory && matchesPeriodic;
        });
    }, [schedules, searchQuery, statusFilter, subCategoryFilter, periodicFilter]);

    // Aggregate rows based on groupBy setting
    const rowsData = useMemo(() => {
        const map = new Map();

        filteredSchedules.forEach(item => {
            const std = item.standardMaintenance || {};
            const subCat = (std.subKategori || 'Lainnya').trim();
            const perangkat = (std.namaPerangkat || std.tipePerangkat || 'Perangkat').trim();
            const checkName = (item.pengecekan || 'Pengecekan').trim();

            let rowKey = subCat;
            let title = subCat;
            let subtitle = `${std.kategori || 'Hardware'} • ${perangkat}`;

            if (groupBy === 'DETAIL') {
                rowKey = `${subCat}__${perangkat}__${checkName}`;
                title = checkName;
                subtitle = `${subCat} / ${perangkat} (${item.periodik || 'Periodic'})`;
            }

            if (!map.has(rowKey)) {
                map.set(rowKey, {
                    key: rowKey,
                    title,
                    subtitle,
                    kategori: std.kategori || 'Hardware',
                    subKategori: subCat,
                    namaPerangkat: perangkat,
                    pengecekan: item.pengecekan,
                    schedules: []
                });
            }
            map.get(rowKey).schedules.push(item);
        });

        return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
    }, [filteredSchedules, groupBy]);

    // Format helper
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getStatusBadge = (status, legend) => {
        const s = (status || '').toUpperCase();
        if (s.includes('ACTUAL') || s.includes('COMPLET') || s === 'DONE' || legend === '✓') {
            return {
                bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                bar: 'bg-emerald-500 border-emerald-400 text-white',
                icon: CheckCircle2
            };
        }
        if (s.includes('CANCEL')) {
            return {
                bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                bar: 'bg-rose-500 border-rose-400 text-white',
                icon: XCircle
            };
        }
        // Default PLAN / Scheduled
        return {
            bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
            bar: 'bg-gradient-to-r from-blue-600 to-cyan-600 border-cyan-400 text-white',
            icon: Clock
        };
    };

    // Calculate Gantt bar position (% from timeline)
    const calculateBarPosition = (startDateStr) => {
        if (!startDateStr || !timelineStart || !timelineEnd) return null;

        const eventKey = toDateKey(startDateStr);

        // Cari index kolom hari pada timelineDays
        const dayIndex = timelineDays.findIndex(d => toDateKey(d) === eventKey);

        if (dayIndex === -1) {
            return { isOutOfView: true };
        }

        const colWidthPct = 100 / daysRange;
        const leftPct = dayIndex * colWidthPct;

        return {
            left: `calc(${leftPct}% + 1px)`,
            width: `calc(${colWidthPct}% - 2px)`,
            isOutOfView: false
        };
    };

    const shiftTimeline = (days) => {
        const nextDate = new Date(viewDate);
        nextDate.setDate(nextDate.getDate() + days);
        setViewDate(nextDate);
    };

    const resetToToday = () => {
        const today = new Date();
        today.setDate(today.getDate() - 1);
        setViewDate(today);
    };

    const jumpToFirstSchedule = () => {
        if (filteredSchedules.length > 0) {
            const firstDateStr = filteredSchedules[0].tanggal;
            if (firstDateStr) {
                const target = new Date(firstDateStr);
                target.setDate(target.getDate() - 1);
                setViewDate(target);
            }
        }
    };

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Header & Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-lg">
                    <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Schedules</div>
                        <div className="text-2xl font-bold text-white mt-0.5">{summary.total || schedules.length}</div>
                    </div>
                    <div className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
                        <Layers className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-lg">
                    <div>
                        <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Pending / Scheduled</div>
                        <div className="text-2xl font-bold text-amber-300 mt-0.5">{summary.pending}</div>
                    </div>
                    <div className="p-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-lg">
                    <div>
                        <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Completed</div>
                        <div className="text-2xl font-bold text-emerald-300 mt-0.5">{summary.completed}</div>
                    </div>
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-lg">
                    <div>
                        <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Cancelled</div>
                        <div className="text-2xl font-bold text-rose-300 mt-0.5">{summary.cancelled}</div>
                    </div>
                    <div className="p-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl">
                        <XCircle className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Controls & Filter Bar */}
            <div className="bg-slate-900/90 border border-slate-800/90 backdrop-blur-md rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                    {/* Search Box */}
                    <div className="relative flex-1 min-w-[180px] max-w-xs">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari Asset ID / Periodik..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950/70 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-950/70 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="PENDING">Pending / Scheduled</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>

                    {/* Sub Kategori Filter */}
                    <select
                        value={subCategoryFilter}
                        onChange={(e) => setSubCategoryFilter(e.target.value)}
                        className="bg-slate-950/70 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                        <option value="ALL">Semua Sub Kategori</option>
                        {availableSubCategories.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>

                    {/* Periodik Type Filter */}
                    <select
                        value={periodicFilter}
                        onChange={(e) => setPeriodicFilter(e.target.value)}
                        className="bg-slate-950/70 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                        <option value="ALL">Semua Tipe Periodik</option>
                        <option value="BULANAN">Bulanan</option>
                        <option value="TRIWULAN">Triwulan</option>
                        <option value="SEMESTER">Semester</option>
                        <option value="TAHUNAN">Tahunan</option>
                    </select>

                    {/* Grouping Mode */}
                    <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 text-xs">
                        <button
                            onClick={() => setGroupBy('DETAIL')}
                            className={`px-2 py-1 rounded-md transition-all font-medium ${
                                groupBy === 'DETAIL' 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Tampilkan per baris pengecekan & perangkat detail"
                        >
                            Detail Checklist
                        </button>
                        <button
                            onClick={() => setGroupBy('SUBKATEGORI')}
                            className={`px-2 py-1 rounded-md transition-all font-medium ${
                                groupBy === 'SUBKATEGORI' 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Kelompokkan per Sub Kategori"
                        >
                            Per Sub Kategori
                        </button>
                    </div>
                </div>

                {/* Timeline Window Controls */}
                <div className="flex items-center gap-2">
                    {/* Date Picker Langsung */}
                    <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="date"
                            value={toDateKey(viewDate)}
                            onChange={(e) => {
                                if (e.target.value) {
                                    setViewDate(new Date(e.target.value));
                                }
                            }}
                            className="bg-transparent text-xs text-slate-200 focus:outline-none [color-scheme:dark]"
                        />
                    </div>

                    <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5">
                        <button
                            onClick={() => shiftTimeline(-7)}
                            title="Mundur 7 Hari"
                            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={resetToToday}
                            title="Kembali ke Hari Ini"
                            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                        >
                            Today
                        </button>
                        <button
                            onClick={jumpToFirstSchedule}
                            title="Loncat ke tanggal jadwal pertama yang tersedia"
                            className="px-2 py-1 text-xs font-medium text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-md transition-colors border-l border-slate-800"
                        >
                            Jadwal Terdekat
                        </button>
                        <button
                            onClick={() => shiftTimeline(7)}
                            title="Maju 7 Hari"
                            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <select
                        value={daysRange}
                        onChange={(e) => setDaysRange(parseInt(e.target.value, 10))}
                        className="bg-slate-950/70 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                        <option value={7}>Rentang 1 Minggu (7 Hari)</option>
                        <option value={14}>Rentang 2 Minggu (14 Hari)</option>
                        <option value={30}>Rentang 1 Bulan (30 Hari)</option>
                        <option value={60}>Rentang 2 Bulan (60 Hari)</option>
                    </select>

                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        className="p-2 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Gantt Chart Table Container */}
            <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
                {/* Gantt Header Timeline */}
                <div className="flex border-b border-slate-800 bg-slate-950/80 sticky top-0 z-20">
                    {/* Left Fixed Info Columns Header */}
                    <div className="w-80 flex-shrink-0 grid grid-cols-12 border-r border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider py-2.5 px-3">
                        <div className="col-span-8">
                            {groupBy === 'DETAIL' ? 'Item Pengecekan & Perangkat' : 'Sub Kategori'}
                        </div>
                        <div className="col-span-4 text-right">Total Event</div>
                    </div>

                    {/* Timeline Days Header */}
                    <div className="flex-1 flex overflow-x-hidden">
                        {timelineDays.map((day, idx) => {
                            const isToday = new Date().toDateString() === day.toDateString();
                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                            return (
                                <div
                                    key={idx}
                                    style={{ width: `${100 / daysRange}%` }}
                                    className={`flex-shrink-0 border-r border-slate-800/60 py-1.5 px-0.5 text-center flex flex-col items-center justify-center ${
                                        isToday 
                                            ? 'bg-blue-600/20 text-blue-300 font-bold border-b-2 border-blue-500' 
                                            : isWeekend 
                                                ? 'bg-slate-950/40 text-slate-500' 
                                                : 'text-slate-400'
                                    }`}
                                >
                                    <span className="text-[9px] uppercase font-mono">
                                        {day.toLocaleDateString('en-US', { weekday: 'narrow' })}
                                    </span>
                                    <span className={`text-[11px] leading-tight ${isToday ? 'text-blue-400 font-bold' : ''}`}>
                                        {day.getDate()}
                                    </span>
                                    <span className="text-[8px] text-slate-500">
                                        {day.toLocaleDateString('id-ID', { month: 'narrow' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Gantt Rows Content */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 max-h-[600px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                            <RefreshCw className="w-7 h-7 animate-spin text-blue-500" />
                            <span className="text-xs font-mono">Memuat Jadwal Maintenance ITAM...</span>
                        </div>
                    ) : rowsData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-500">
                            <Calendar className="w-10 h-10 stroke-[1.5] text-slate-600" />
                            <span className="text-sm font-semibold">Tidak ada jadwal maintenance ditemukan</span>
                            <span className="text-xs text-slate-600">Coba ubah filter atau rentang tanggal</span>
                        </div>
                    ) : (
                        rowsData.map((row) => {
                            return (
                                <div 
                                    key={row.key}
                                    className="flex hover:bg-slate-800/30 transition-colors group relative items-center min-h-[48px]"
                                >
                                    {/* Left Fixed Column */}
                                    <div className="w-80 flex-shrink-0 grid grid-cols-12 border-r border-slate-800/80 px-3 py-2 items-center text-xs">
                                        <div className="col-span-8 flex flex-col pr-2 overflow-hidden">
                                            <span className="font-bold text-slate-100 truncate text-xs" title={row.title}>
                                                {row.title}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-mono truncate" title={row.subtitle}>
                                                {row.subtitle}
                                            </span>
                                        </div>
                                        <div className="col-span-4 flex justify-end">
                                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                                {row.schedules.length} Event
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right Timeline Bar Track */}
                                    <div className="flex-1 relative h-12 flex items-center bg-slate-950/20">
                                        {/* Grid vertical lines for days */}
                                        <div className="absolute inset-0 flex pointer-events-none">
                                            {timelineDays.map((day, idx) => {
                                                const isToday = new Date().toDateString() === day.toDateString();
                                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                                return (
                                                    <div 
                                                        key={idx} 
                                                        style={{ width: `${100 / daysRange}%` }}
                                                        className={`border-r border-slate-800/30 h-full ${
                                                            isToday ? 'bg-blue-500/5' : isWeekend ? 'bg-slate-950/20' : ''
                                                        }`}
                                                    />
                                                );
                                            })}
                                        </div>

                                        {/* Render Semua Gantt Bar Milik Row Ini */}
                                        {row.schedules.map((schedule) => {
                                             const badge = getStatusBadge(schedule.status, schedule.legend);
                                             const eventDate = schedule.tanggal;
                                             const barPos = calculateBarPosition(eventDate);
                                             if (!barPos || barPos.isOutOfView) return null;

                                             return (
                                                 <div
                                                     key={schedule.id}
                                                     style={{
                                                         left: barPos.left,
                                                         width: barPos.width,
                                                     }}
                                                     className={`absolute h-7 rounded-md border shadow-md flex items-center px-2 z-10 cursor-pointer transition-all hover:scale-105 hover:z-30 hover:shadow-xl ${badge.bar}`}
                                                     title={`Sub Kategori: ${schedule.standardMaintenance?.subKategori || '-'}\nPerangkat: ${schedule.standardMaintenance?.namaPerangkat || '-'}\nPengecekan: ${schedule.pengecekan || '-'}\nBagian: ${schedule.bagian || '-'}\nPeriodik: ${schedule.periodik || '-'}\nTanggal: ${formatDate(eventDate)}\nLegend: ${schedule.legend || '-'}\nStatus: ${schedule.status || 'PLAN'}`}
                                                 >
                                                     <span className="text-[10px] font-bold text-white truncate drop-shadow-sm select-none">
                                                         {schedule.legend ? `${schedule.legend} ` : ''}{schedule.standardMaintenance?.namaPerangkat || schedule.pengecekan || formatDate(eventDate)}
                                                     </span>
                                                 </div>
                                             );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Legend */}
                <div className="border-t border-slate-800 bg-slate-950/90 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-4">
                        <span className="font-semibold text-slate-300">Keterangan:</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-cyan-500 border border-cyan-400" />
                            <span>Pending / Scheduled</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-emerald-500 border border-emerald-400" />
                            <span>Completed</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-rose-500 border border-rose-400" />
                            <span>Cancelled</span>
                        </div>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                        Data Source: ITAM (Read-Only)
                    </div>
                </div>
            </div>
        </div>
    );
}
