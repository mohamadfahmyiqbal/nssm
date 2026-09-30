import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, Calendar } from 'lucide-react';
import { 
    getMaintenanceSchedulesFromDB, 
    getMaintenanceSummaryFromDB,
    getSettingFromDB,
    saveSettingToDB 
} from '../../services/api';
import ScheduleSummaryCards from './components/ScheduleSummaryCards';
import ScheduleToolbar from './components/ScheduleToolbar';
import GanttTimelineHeader from './components/GanttTimelineHeader';
import GanttRowItem from './components/GanttRowItem';
import GanttFooterLegend from './components/GanttFooterLegend';

export default function ScheduleGanttView() {
    const [schedules, setSchedules] = useState([]);
    const [summary, setSummary] = useState({ total: 0, pending: 0, completed: 0, cancelled: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [subCategoryFilter, setSubCategoryFilter] = useState('ALL');
    const [periodicFilter, setPeriodicFilter] = useState('ALL');
    
    // Gantt Time Window
    const [viewDate, setViewDate] = useState(new Date());
    const [daysRange, setDaysRange] = useState(7); // 7, 14, 30, 90 days
    const [groupBy, setGroupBy] = useState('SUBKATEGORI'); // 'SUBKATEGORI' | 'DETAIL'

    // Multiplier Unit untuk menghitung estimasi jam aktual (DB + LocalStorage)
    const [defaultUnitCount, setDefaultUnitCount] = useState(1);
    const [unitOverrides, setUnitOverrides] = useState({});
    const isInitialMount = useRef(true);

    // Ambil konfigurasi Unit dari Database saat pertama kali load
    const fetchUnitSettings = async () => {
        try {
            const res = await getSettingFromDB('itam_gantt_unit_config');
            if (res.success && res.data?.value) {
                const config = typeof res.data.value === 'string' ? JSON.parse(res.data.value) : res.data.value;
                if (config.defaultUnitCount) {
                    setDefaultUnitCount(Number(config.defaultUnitCount) || 1);
                }
                if (config.unitOverrides) {
                    setUnitOverrides(config.unitOverrides || {});
                }
            } else {
                // Fallback localStorage jika belum ada di DB
                const savedDef = localStorage.getItem('itam_gantt_default_units');
                const savedOver = localStorage.getItem('itam_gantt_unit_overrides');
                if (savedDef) setDefaultUnitCount(Math.max(1, parseInt(savedDef, 10) || 1));
                if (savedOver) setUnitOverrides(JSON.parse(savedOver));
            }
        } catch (e) {
            console.warn('Gagal memuat unit config dari DB, fallback ke local storage:', e);
            const savedDef = localStorage.getItem('itam_gantt_default_units');
            const savedOver = localStorage.getItem('itam_gantt_unit_overrides');
            if (savedDef) setDefaultUnitCount(Math.max(1, parseInt(savedDef, 10) || 1));
            if (savedOver) setUnitOverrides(JSON.parse(savedOver));
        }
    };

    // Auto-save ke Database NTMS (Debounced)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Simpan juga ke localStorage
        try {
            localStorage.setItem('itam_gantt_default_units', String(defaultUnitCount));
            localStorage.setItem('itam_gantt_unit_overrides', JSON.stringify(unitOverrides));
        } catch (_) {}

        // Simpan ke Database
        const timer = setTimeout(async () => {
            try {
                await saveSettingToDB('itam_gantt_unit_config', {
                    defaultUnitCount,
                    unitOverrides,
                    updatedAt: new Date().toISOString()
                });
            } catch (err) {
                console.error('Gagal menyimpan unit config ke Database:', err);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [defaultUnitCount, unitOverrides]);

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
        fetchUnitSettings();
    }, []);

    // Timeline columns generator
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

    // Helper format YYYY-MM-DD
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

            // Helper cek apakah item ini bertipe daily
            const pType = (item.periodik_type || '').toUpperCase();
            const pStr = (item.periodik || '').toUpperCase();
            const isItemDaily = pType.includes('DAILY') || pType.includes('HARIAN') || pStr.includes('DAILY') || pStr.includes('HARIAN') || pStr.includes('1 HARI') || pStr.includes('SETIAP HARI');

            let matchesPeriodic = true;
            if (periodicFilter === 'DAILY') {
                matchesPeriodic = isItemDaily;
            } else if (periodicFilter === 'NON_DAILY') {
                matchesPeriodic = !isItemDaily;
            } else if (periodicFilter !== 'ALL') {
                matchesPeriodic = pType === periodicFilter.toUpperCase() || pStr.includes(periodicFilter.toUpperCase());
            }

            return matchesSearch && matchesStatus && matchesSubCategory && matchesPeriodic;
        });
    }, [schedules, searchQuery, statusFilter, subCategoryFilter, periodicFilter]);

    // Daily stats (total jam aktual & total item)
    const dailyStats = useMemo(() => {
        const stats = {};
        filteredSchedules.forEach(item => {
            const dateKey = toDateKey(item.tanggal);
            if (!dateKey) return;
            if (!stats[dateKey]) {
                stats[dateKey] = { totalMinutes: 0, count: 0, totalUnits: 0 };
            }
            stats[dateKey].count += 1;
            
            const subCat = (item.standardMaintenance?.subKategori || 'Lainnya').trim();

            // Prioritas unit: Override per check_id -> Override per SubKategori -> defaultUnitCount
            let unit = defaultUnitCount;
            if (unitOverrides[item.check_id] != null) {
                unit = unitOverrides[item.check_id];
            } else if (unitOverrides[subCat] != null) {
                unit = unitOverrides[subCat];
            }
            unit = Math.max(1, Number(unit) || 1);
            
            stats[dateKey].totalUnits += unit;

            const baseMins = item.cycle_time_minutes != null ? Number(item.cycle_time_minutes) : 60;
            stats[dateKey].totalMinutes += baseMins * unit;
        });
        return stats;
    }, [filteredSchedules, defaultUnitCount, unitOverrides]);

    const formatDuration = (totalMinutes) => {
        if (!totalMinutes || totalMinutes <= 0) return '0j';
        const hours = totalMinutes / 60;
        return Number.isInteger(hours) ? `${hours}j` : `${hours.toFixed(1)}j`;
    };

    // Aggregate rows
    const rowsData = useMemo(() => {
        const map = new Map();

        filteredSchedules.forEach(item => {
            const std = item.standardMaintenance || {};
            const subCat = (std.subKategori || 'Lainnya').trim();
            const perangkat = (std.namaPerangkat || std.tipePerangkat || 'Perangkat').trim();
            const checkName = (item.pengecekan || 'Pengecekan').trim();

            const pType = (item.periodik_type || '').toUpperCase();
            const pStr = (item.periodik || '').toUpperCase();
            const isItemDaily = pType.includes('DAILY') || pType.includes('HARIAN') || pStr.includes('DAILY') || pStr.includes('HARIAN') || pStr.includes('1 HARI') || pStr.includes('SETIAP HARI');

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
                    periodik: item.periodik,
                    isDaily: isItemDaily,
                    check_id: item.check_id,
                    cycle_time_minutes: item.cycle_time_minutes,
                    schedules: []
                });
            }
            map.get(rowKey).schedules.push(item);
        });

        return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
    }, [filteredSchedules, groupBy]);

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
                bar: 'bg-emerald-500 border-emerald-400 text-white'
            };
        }
        if (s.includes('CANCEL')) {
            return {
                bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                bar: 'bg-rose-500 border-rose-400 text-white'
            };
        }
        return {
            bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
            bar: 'bg-gradient-to-r from-blue-600 to-cyan-600 border-cyan-400 text-white'
        };
    };

    const DAY_COLUMN_WIDTH = 110; // Lebar fixed 110px per kolom hari agar selalu lapang & informatif

    const calculateBarPosition = (startDateStr) => {
        if (!startDateStr || !timelineStart || !timelineEnd) return null;
        const eventKey = toDateKey(startDateStr);
        const dayIndex = timelineDays.findIndex(d => toDateKey(d) === eventKey);

        if (dayIndex === -1) {
            return { isOutOfView: true };
        }

        const leftPx = dayIndex * DAY_COLUMN_WIDTH;

        return {
            left: `${leftPx + 2}px`,
            width: `${DAY_COLUMN_WIDTH - 4}px`,
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
            {/* 1. Header & Summary Stats */}
            <ScheduleSummaryCards summary={summary} totalSchedules={schedules.length} />

            {/* 2. Controls & Filter Bar */}
            <ScheduleToolbar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                subCategoryFilter={subCategoryFilter}
                setSubCategoryFilter={setSubCategoryFilter}
                availableSubCategories={availableSubCategories}
                periodicFilter={periodicFilter}
                setPeriodicFilter={setPeriodicFilter}
                groupBy={groupBy}
                setGroupBy={setGroupBy}
                defaultUnitCount={defaultUnitCount}
                setDefaultUnitCount={setDefaultUnitCount}
                viewDate={viewDate}
                setViewDate={setViewDate}
                toDateKey={toDateKey}
                shiftTimeline={shiftTimeline}
                resetToToday={resetToToday}
                jumpToFirstSchedule={jumpToFirstSchedule}
                daysRange={daysRange}
                setDaysRange={setDaysRange}
                fetchData={fetchData}
                isLoading={isLoading}
            />

            {/* 3. Gantt Chart Table Container (Scrollable Horizontal & Vertical) */}
            <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
                {/* Outer Scroll Container for Horizontal & Vertical */}
                <div className="flex-1 overflow-auto max-h-[620px] divide-y divide-slate-800/60">
                    <GanttTimelineHeader
                        groupBy={groupBy}
                        timelineDays={timelineDays}
                        daysRange={daysRange}
                        dailyStats={dailyStats}
                        toDateKey={toDateKey}
                        formatDuration={formatDuration}
                        dayColumnWidth={DAY_COLUMN_WIDTH}
                    />

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
                        rowsData.map((row) => (
                            <GanttRowItem
                                key={row.key}
                                row={row}
                                groupBy={groupBy}
                                timelineDays={timelineDays}
                                daysRange={daysRange}
                                unitOverrides={unitOverrides}
                                setUnitOverrides={setUnitOverrides}
                                defaultUnitCount={defaultUnitCount}
                                calculateBarPosition={calculateBarPosition}
                                getStatusBadge={getStatusBadge}
                                formatDate={formatDate}
                                formatDuration={formatDuration}
                                dayColumnWidth={DAY_COLUMN_WIDTH}
                            />
                        ))
                    )}
                </div>

                <GanttFooterLegend />
            </div>
        </div>
    );
}
