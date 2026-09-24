import React from 'react';
import { Clock, UserCheck } from 'lucide-react';

export default function IncidentFormHeader({ currentUser, reportNumber }) {
    const operatorName = currentUser?.nama?.split(' ')[0] || 'Operator';
    const roleName = currentUser?.role || 'TECHNICIAN';

    return (
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                        Pipeline Penanganan Insiden & Berita Acara IT
                    </h3>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-cyan-400" />
                    <span>PIC: {operatorName} ({roleName})</span>
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                    {reportNumber}
                </span>
            </div>
        </div>
    );
}
