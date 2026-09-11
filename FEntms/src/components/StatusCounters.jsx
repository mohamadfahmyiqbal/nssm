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
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 shadow-glow-green/20">
                UP: <span>{stats.up}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-amber-950/50 border border-amber-500/40 text-amber-400 shadow-glow-amber/20">
                WARNING: <span>{stats.warning}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-400 shadow-glow-red/20 animate-pulse">
                DOWN: <span>{stats.down}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-400">
                UNKNOWN: <span>{stats.unknown}</span>
            </div>
        </div>
    );
}