import React from 'react';
import {
    Briefcase,
    Clock,
    CheckCircle2,
    Calendar,
    AlertTriangle
} from 'lucide-react';

export default function WorkOrderStatsCards({ summary, schedulesCount, incidentsCount }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-lg">
                <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Work Orders</div>
                    <div className="text-2xl font-bold text-white mt-0.5">{summary.total || 0}</div>
                </div>
                <div className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
                    <Briefcase className="w-5 h-5" />
                </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-lg">
                <div>
                    <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">In Progress</div>
                    <div className="text-2xl font-bold text-amber-300 mt-0.5">{summary.inProgress || 0}</div>
                </div>
                <div className="p-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                    <Clock className="w-5 h-5" />
                </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-lg">
                <div>
                    <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Resolved / Done</div>
                    <div className="text-2xl font-bold text-emerald-300 mt-0.5">{summary.resolved || 0}</div>
                </div>
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-lg">
                <div>
                    <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Preventive Tasks</div>
                    <div className="text-2xl font-bold text-cyan-300 mt-0.5">{schedulesCount}</div>
                </div>
                <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl">
                    <Calendar className="w-5 h-5" />
                </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-lg">
                <div>
                    <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Incident Reports</div>
                    <div className="text-2xl font-bold text-rose-300 mt-0.5">{incidentsCount}</div>
                </div>
                <div className="p-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}
