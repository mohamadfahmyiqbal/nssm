import React from 'react';

export default function NodeTelemetryMetrics({ data }) {
    return (
        <>
            {/* Quick System Info Badge (Firmware / Uptime) */}
            {(data.firmware || data.uptime) && (
                <div className="mt-2.5 px-2.5 py-1.5 bg-slate-950/70 border border-slate-800/80 rounded-lg text-left text-[9.5px] font-mono flex flex-col gap-0.5 shadow-inner">
                    {data.firmware && (
                        <div className="text-slate-400 truncate" title={data.firmware}>
                            <span className="text-slate-500 font-bold">FW: </span>
                            <span className="text-slate-300">{data.firmware}</span>
                        </div>
                    )}
                    {data.uptime && (
                        <div className="text-slate-400">
                            <span className="text-slate-500 font-bold">UPTIME: </span>
                            <span className="text-emerald-400 font-semibold">{data.uptime}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Metrics Bar (CPU / RAM / SUHU) */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-[9.5px] font-mono text-slate-300">
                <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-slate-500 block text-[8px] font-bold">CPU</span>
                    <span className={`font-bold ${data.cpu && data.cpu !== '-' && data.cpu !== 'N/A' && parseInt(data.cpu) > 80 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {data.cpu && data.cpu !== 'N/A' ? (data.cpu.toString().includes('%') ? data.cpu : `${data.cpu}%`) : '-'}
                    </span>
                </div>
                <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-slate-500 block text-[8px] font-bold">RAM</span>
                    <span className={`font-bold ${data.memory && data.memory !== '-' && data.memory !== 'N/A' && parseInt(data.memory) > 85 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {data.memory && data.memory !== 'N/A' ? (data.memory.toString().includes('%') ? data.memory : `${data.memory}%`) : '-'}
                    </span>
                </div>
                <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-slate-500 block text-[8px] font-bold">SUHU</span>
                    <span className={`font-bold ${data.temperature && parseInt(data.temperature) > 60 ? 'text-rose-400' : 'text-amber-400'}`}>
                        {data.temperature ? `${data.temperature}°C` : '-'}
                    </span>
                </div>
            </div>

            {/* Traffic Bandwidth Metrics Bar (IN / OUT) */}
            {(data.trafficIn || data.trafficOut || (data.networkTraffic && (data.networkTraffic.in || data.networkTraffic.out))) && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-[9px] font-mono">
                    <div className="bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                        <span className="text-emerald-500/80 font-bold">▼ IN:</span>
                        <span className="text-slate-300 font-semibold">{data.trafficIn || data.networkTraffic?.in || '0 MB'}</span>
                    </div>
                    <div className="bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                        <span className="text-blue-400/80 font-bold">▲ OUT:</span>
                        <span className="text-slate-300 font-semibold">{data.trafficOut || data.networkTraffic?.out || '0 MB'}</span>
                    </div>
                </div>
            )}
        </>
    );
}
