import React from 'react';
import { Layers, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function ScheduleSummaryCards({ summary, totalSchedules }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-lg">
                <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Schedules</div>
                    <div className="text-2xl font-bold text-white mt-0.5">{summary.total || totalSchedules}</div>
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
    );
}
