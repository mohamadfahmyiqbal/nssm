import React from 'react';

export default function GanttFooterLegend() {
    return (
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
                <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
                    <div className="w-3 h-3 rounded bg-gradient-to-r from-purple-700 to-indigo-700 border border-purple-400" />
                    <span className="text-purple-300">Card Daily</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40" />
                    <span className="text-amber-400">Sabtu</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/40" />
                    <span className="text-rose-400">Minggu</span>
                </div>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
                Data Source: ITAM (Read-Only)
            </div>
        </div>
    );
}
