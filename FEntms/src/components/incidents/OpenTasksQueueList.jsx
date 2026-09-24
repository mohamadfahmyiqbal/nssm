import React from 'react';
import { ShieldAlert, Search, RefreshCw, AlertTriangle, Clock, ArrowRight } from 'lucide-react';

export default function OpenTasksQueueList({
    openIncidents,
    searchQuery,
    setSearchQuery,
    onSelectOpenTask,
    selectedTask,
    isLoading,
    onRefresh
}) {
    const filtered = openIncidents.filter(task => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (task.reportNumber && task.reportNumber.toLowerCase().includes(q)) ||
            (task.primaryHostname && task.primaryHostname.toLowerCase().includes(q)) ||
            (task.primaryIp && task.primaryIp.toLowerCase().includes(q)) ||
            (task.title && task.title.toLowerCase().includes(q)) ||
            (task.symptom && task.symptom.toLowerCase().includes(q))
        );
    });

    return (
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <div>
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                            Riwayat Task Yang Sedang Open
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono">
                            Antrean Insiden & Anomali Belum Selesai
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                        {openIncidents.length} Task Open
                    </span>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Refresh Task"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Action: Buat Task Baru Manual (Diluar Pemantauan) */}
            <button
                type="button"
                onClick={() => onSelectOpenTask(null)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 hover:from-blue-900/80 hover:to-indigo-900/80 text-blue-300 border border-blue-800/60 hover:border-blue-500 rounded-xl text-xs font-bold font-mono transition-all shadow-sm group"
            >
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold group-hover:scale-110 transition-transform">+</span>
                <span>+ Buat Laporan / Task Manual (Non-Monitoring)</span>
            </button>

            {/* Find Search Filter */}
            <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    placeholder="Cari task open: No. Laporan, Hostname, IP..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-700/80 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-2 outline-none focus:border-blue-500 font-mono transition-all placeholder:text-slate-500"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-300 font-mono"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* List Open Tasks */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[520px] custom-scrollbar">
                {isLoading ? (
                    <div className="text-center py-12 text-xs text-slate-500 font-mono animate-pulse">
                        Memuat daftar task yang sedang open...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-500 font-mono space-y-1">
                        <p className="text-slate-400 font-bold">Tidak ada task insiden yang sedang open.</p>
                        <p className="text-[11px] text-slate-500">Semua anomali telah terselesaikan (Resolved/Closed).</p>
                    </div>
                ) : (
                    filtered.map((task, idx) => {
                        const isSelected = selectedTask && (selectedTask.id === task.id || selectedTask.reportNumber === task.reportNumber);
                        const isLiveAnomaly = task.sourceType === 'LIVE_ANOMALY';

                        return (
                            <div
                                key={`${task.id || task.reportNumber}-${idx}`}
                                onClick={() => onSelectOpenTask(task)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                                    isSelected
                                        ? 'bg-blue-950/50 border-blue-500/80 shadow-md ring-1 ring-blue-500/40'
                                        : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/60'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-extrabold ${
                                            task.priority === 'P1' || isLiveAnomaly
                                                ? 'bg-rose-950 text-rose-300 border border-rose-500'
                                                : 'bg-amber-950 text-amber-300 border border-amber-500'
                                        }`}>
                                            {task.reportNumber || 'LIVE ALERT'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-100 truncate max-w-[170px]">
                                            {task.primaryHostname || task.hostname}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-cyan-400">
                                        {task.primaryIp || task.ip || '-'}
                                    </span>
                                </div>

                                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                                    {task.symptom || task.title || task.summary || 'Anomali jaringan / gangguan node terdeteksi.'}
                                </p>

                                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 border-t border-slate-800/60 pt-1.5">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        {task.reportDate || task.timestamp || 'Hari ini'} ({task.discoveredTime || '-'})
                                    </span>
                                    <span className="text-blue-400 font-bold flex items-center gap-1">
                                        Lanjutkan Pipeline <ArrowRight className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
