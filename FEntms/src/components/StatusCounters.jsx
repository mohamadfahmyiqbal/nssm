import React, { useMemo } from 'react';
import { useDevices } from '../context/DeviceContext';

export default function StatusCounters() {
    const { devices } = useDevices();

    const stats = useMemo(() => {
        return devices.reduce(
            (acc, device) => {
                const st = String(device.status).toUpperCase();
                if (st === 'UP') acc.up++;
                else if (st === 'WARNING') acc.warning++;
                else if (st === 'DOWN') acc.down++;
                else acc.unknown++;
                return acc;
            },
            { up: 0, warning: 0, down: 0, unknown: 0 }
        );
    }, [devices]);

    return (
        <div className="flex items-center gap-2 font-mono text-xs font-bold">
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.25)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                <span>UP:</span>
                <span className="text-slate-100 font-extrabold">{stats.up}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/50 text-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse"></span>
                <span>WARNING:</span>
                <span className="text-slate-100 font-extrabold">{stats.warning}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-[#EF4444] shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
                <span>DOWN:</span>
                <span className="text-slate-100 font-extrabold">{stats.down}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-[#6B7280] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#6B7280]"></span>
                <span>OFFLINE:</span>
                <span className="text-slate-300 font-extrabold">{stats.unknown}</span>
            </div>
        </div>
    );
}