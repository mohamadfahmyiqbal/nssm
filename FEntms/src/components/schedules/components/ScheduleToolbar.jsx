import React from 'react';
import { Search, Calendar, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

export default function ScheduleToolbar({
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    subCategoryFilter,
    setSubCategoryFilter,
    availableSubCategories,
    periodicFilter,
    setPeriodicFilter,
    groupBy,
    setGroupBy,
    defaultUnitCount,
    setDefaultUnitCount,
    viewDate,
    setViewDate,
    toDateKey,
    shiftTimeline,
    resetToToday,
    jumpToFirstSchedule,
    daysRange,
    setDaysRange,
    fetchData,
    isLoading
}) {
    return (
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
                    <option value="DAILY">Harian (Daily)</option>
                    <option value="NON_DAILY">Non-Daily (Periodik Berkala)</option>
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

                {/* Default Jumlah Unit Input */}
                <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs" title="Jumlah unit default untuk menghitung durasi aktual (Unit × Waktu Siklus)">
                    <span className="text-slate-400 font-medium">Unit:</span>
                    <input
                        type="number"
                        min="1"
                        max="999"
                        value={defaultUnitCount}
                        onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setDefaultUnitCount(isNaN(val) || val < 1 ? 1 : val);
                        }}
                        className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs font-bold text-cyan-400 focus:outline-none focus:border-cyan-500"
                    />
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
    );
}
