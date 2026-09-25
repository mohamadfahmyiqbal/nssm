import React from 'react';
import { Briefcase, RefreshCw } from 'lucide-react';

export default function WorkOrderHeaderTabs({
    viewTab,
    setViewTab,
    workOrdersCount = 0,
    isLoading = false,
    onSync
}) {
    return (
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setViewTab('PIPELINE_EDITOR')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                        viewTab === 'PIPELINE_EDITOR'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                >
                    <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Work Orders</span>
                </button>

                <button
                    onClick={() => setViewTab('SCHEDULER_WORKSPACE')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                        viewTab === 'SCHEDULER_WORKSPACE'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                >
                    <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Daily Scheduler</span>
                </button>

                <button
                    onClick={() => setViewTab('WORK_ORDERS')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                        viewTab === 'WORK_ORDERS'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Archive</span>
                    <span className="px-1.5 py-0.2 text-[10px] bg-slate-950/60 rounded-full font-mono">
                        {workOrdersCount}
                    </span>
                </button>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onSync}
                    disabled={isLoading}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border border-slate-700 disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Sync Data</span>
                </button>
            </div>
        </div>
    );
}
