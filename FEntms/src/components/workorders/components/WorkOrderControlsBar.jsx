import React from 'react';
import {
    Search,
    ChevronRight,
    Plus
} from 'lucide-react';

export default function WorkOrderControlsBar({
    viewTab,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    technicianFilter,
    setTechnicianFilter,
    technicians,
    dateMode,
    setDateMode,
    selectedDate,
    setSelectedDate,
    shiftSelectedDate,
    resetDateToToday,
    onOpenCreateCustom
}) {
    return (
        <div className="bg-slate-900/90 border border-slate-800/90 backdrop-blur-md rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
                {/* Search Box */}
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Cari Task / Perangkat / No. WO..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950/70 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                {/* Type Filter */}
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-slate-950/70 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                    <option value="ALL">Semua Tipe Task</option>
                    <option value="PREVENTIVE_MAINTENANCE">Preventive Maintenance (PM)</option>
                    <option value="INCIDENT_ANOMALY">Incident & Anomaly</option>
                </select>

                {viewTab === 'WORK_ORDERS' && (
                    <>
                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-950/70 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                            <option value="ALL">Semua Status</option>
                            <option value="OPEN">Open</option>
                            <option value="ASSIGNED">Assigned</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                        </select>

                        {/* Technician Filter */}
                        <select
                            value={technicianFilter}
                            onChange={(e) => setTechnicianFilter(e.target.value)}
                            className="bg-slate-950/70 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                            <option value="ALL">Semua Teknisi</option>
                            {technicians.map(t => {
                                const techNik = t.nik || t.NIK;
                                const techNama = t.nama || t.NAMA;
                                return (
                                    <option key={techNik} value={techNik}>
                                        {techNama} ({techNik})
                                    </option>
                                );
                            })}
                        </select>
                    </>
                )}
            </div>

            {/* Daily Date Picker & Window Controls */}
            <div className="flex items-center gap-2">
                {/* Toggle Harian vs Semua */}
                <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 text-xs">
                    <button
                        onClick={() => setDateMode('DAILY')}
                        className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
                            dateMode === 'DAILY'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Harian
                    </button>
                    <button
                        onClick={() => setDateMode('ALL_DATES')}
                        className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
                            dateMode === 'ALL_DATES'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Semua Tanggal
                    </button>
                </div>

                {dateMode === 'DAILY' && (
                    <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg p-0.5">
                        <button
                            onClick={() => shiftSelectedDate(-1)}
                            title="Mundur 1 Hari"
                            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                        </button>

                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                if (e.target.value) setSelectedDate(e.target.value);
                            }}
                            className="bg-transparent text-xs text-blue-300 font-bold font-mono focus:outline-none [color-scheme:dark] px-1.5 py-0.5"
                        />

                        <button
                            onClick={resetDateToToday}
                            title="Hari Ini"
                            className="px-2 py-0.5 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                        >
                            Today
                        </button>

                        <button
                            onClick={() => shiftSelectedDate(1)}
                            title="Maju 1 Hari"
                            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <button
                    onClick={onOpenCreateCustom}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Work Order Kustom</span>
                </button>
            </div>
        </div>
    );
}
