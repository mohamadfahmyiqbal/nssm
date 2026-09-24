import React from 'react';
import EndpointFirewallPortMatrix from './EndpointFirewallPortMatrix';

export default function EndpointTelemetryFooter({ data }) {
    const { subType } = data;

    // 1. UPS Telemetry Footer
    if (subType === 'ups') {
        return (
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1.5 text-[9px] font-sans text-slate-400 w-full relative z-10">
                <div className="flex flex-col text-left bg-slate-900/60 rounded p-1.5 border border-slate-800/60 shadow-inner">
                    <span className="text-[7.5px] font-bold tracking-wider text-emerald-400 mb-0.5">BATERAI</span>
                    <span className="text-emerald-300 font-bold font-mono whitespace-nowrap">
                        {data.batteryCapacity || data.battery || '100%'}
                    </span>
                </div>
                <div className="flex flex-col text-left bg-slate-900/60 rounded p-1.5 border border-slate-800/60 shadow-inner">
                    <span className="text-[7.5px] font-bold tracking-wider text-amber-400 mb-0.5">BEBAN LOAD</span>
                    <span className="text-amber-300 font-bold font-mono whitespace-nowrap">
                        {data.load || data.outputLoad || data.cpu || 'Normal'}
                    </span>
                </div>
                <div className="flex flex-col text-left bg-slate-900/60 rounded p-1.5 border border-slate-800/60 shadow-inner">
                    <span className="text-[7.5px] font-bold tracking-wider text-blue-400 mb-0.5">RUNTIME</span>
                    <span className="text-slate-200 font-bold font-mono whitespace-nowrap truncate" title={data.runtimeRemaining || 'N/A'}>
                        {data.runtimeRemaining || 'On-Line'}
                    </span>
                </div>
                {data.model && (
                    <div className="col-span-3 flex items-center justify-between bg-slate-950/60 rounded px-2 py-1 border border-slate-800/60 text-[8px] font-mono text-slate-400">
                        <span className="text-slate-400 font-semibold">{data.model || 'srvpm10kri'}</span>
                        <span className="text-emerald-400 font-bold">{data.outputStatus || 'On-Line'}</span>
                    </div>
                )}
            </div>
        );
    }

    // 2. ATS Telemetry Footer
    if (subType === 'ats') {
        return (
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-1.5 text-[9px] font-sans text-slate-400 w-full relative z-10">
                <div className="flex flex-col text-left bg-slate-900/60 rounded p-1.5 border border-slate-800/60 shadow-inner">
                    <span className="text-[7.5px] font-bold tracking-wider text-teal-400 mb-0.5">SUMBER AKTIF</span>
                    <span className="text-teal-300 font-bold font-mono whitespace-nowrap">
                        {data.selectedSource || 'Source A (Primary)'}
                    </span>
                </div>
                <div className="flex flex-col text-left bg-slate-900/60 rounded p-1.5 border border-slate-800/60 shadow-inner">
                    <span className="text-[7.5px] font-bold tracking-wider text-amber-400 mb-0.5">ARUS OUTPUT</span>
                    <span className="text-amber-300 font-bold font-mono whitespace-nowrap">
                        {data.current || data.outputCurrent || data.cpu || '0.0 A'}
                    </span>
                </div>
                <div className="col-span-2 flex items-center justify-between bg-slate-950/60 rounded px-2 py-1 border border-slate-800/60 text-[8px] font-mono text-slate-400">
                    <span className="text-slate-400 font-semibold">{data.model || 'AP4423A'}</span>
                    <span className="text-emerald-400 font-bold">{data.redundancyStatus || 'Redundant'}</span>
                </div>
            </div>
        );
    }

    // 3. AP (Access Point) Telemetry Footer
    if (subType === 'ap') {
        return (
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1.5 text-[9px] font-sans text-slate-400 w-full relative z-10">
                <div className="flex flex-col text-left bg-slate-900/60 rounded p-1.5 border border-slate-800/60 shadow-inner">
                    <span className="text-[7.5px] font-bold tracking-wider text-emerald-400 mb-0.5">MODEL</span>
                    <span className="text-slate-200 font-bold whitespace-nowrap truncate" title={data.model || data.vendor || 'UniFi AP'}>
                        {data.model || data.vendor || 'UniFi AP'}
                    </span>
                </div>
                <div className="flex flex-col text-left bg-slate-900/60 rounded p-1.5 border border-slate-800/60 shadow-inner">
                    <span className="text-[7.5px] font-bold tracking-wider text-cyan-400 mb-0.5">CLIENTS</span>
                    <span className="text-cyan-300 font-bold font-mono whitespace-nowrap">
                        {data.connectedClients !== undefined && data.connectedClients !== null && data.connectedClients !== 'N/A'
                            ? `${data.connectedClients} Users`
                            : (data.clients ? `${data.clients} Users` : 'Active')}
                    </span>
                </div>
                <div className="flex flex-col text-left bg-slate-900/60 rounded p-1.5 border border-slate-800/60 shadow-inner">
                    <span className="text-[7.5px] font-bold tracking-wider text-blue-400 mb-0.5">CPU / MEM</span>
                    <span className="text-slate-200 font-bold font-mono whitespace-nowrap">
                        {data.cpu || data.cpuUsage || 'OK'} {data.memory || data.memoryUsage ? `• ${data.memory || data.memoryUsage}` : ''}
                    </span>
                </div>
                {data.firmware && data.firmware !== 'N/A' && (
                    <div className="col-span-3 flex items-center justify-between bg-slate-950/60 rounded px-2 py-1 border border-slate-800/60 text-[8px] font-mono text-slate-400">
                        <span className="text-slate-500 font-semibold">FW: {data.firmware}</span>
                        {data.uptime && <span className="text-emerald-400 font-bold">{data.uptime}</span>}
                    </div>
                )}
            </div>
        );
    }

    // 4. Server Telemetry Footer
    if (subType === 'server') {
        return (
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[9px] font-sans text-slate-400 w-full relative z-10">
                <div className="flex flex-col text-left bg-slate-900/50 rounded p-1.5 border border-slate-800/50 shadow-inner group-hover:bg-slate-800/40 transition-colors">
                    <span className="text-[8px] font-bold tracking-wider mb-0.5">CPU</span>
                    <span className="text-slate-200 font-bold font-mono">{data.cpu || 'N/A'}</span>
                </div>
                <div className="flex flex-col text-left bg-slate-900/50 rounded p-1.5 border border-slate-800/50 shadow-inner group-hover:bg-slate-800/40 transition-colors">
                    <span className="text-[8px] font-bold tracking-wider mb-0.5">MEM</span>
                    <span className="text-slate-200 font-bold font-mono">{data.memory || 'N/A'}</span>
                </div>

                {data.storageUsed && (
                    <div className="col-span-2 mt-1">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[8px] font-bold tracking-wider">DISK USAGE</span>
                            <span className="text-emerald-400 text-[8px] font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">{data.storageUsed || '0%'}</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" style={{ width: data.storageUsed || '0%' }}></div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // 5. Firewall Telemetry Footer
    if (subType === 'firewall') {
        return (
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2.5 text-[9px] font-sans text-slate-400 w-full relative z-10">
                <div className="grid grid-cols-4 gap-2">
                    <div className="flex flex-col text-left bg-slate-900/50 rounded p-1.5 border border-slate-800/50 shadow-inner">
                        <span className="text-[8px] font-bold tracking-wider mb-0.5">MFR</span>
                        <span className="text-orange-400 font-bold whitespace-nowrap truncate">{data.manufacturer || 'Fortinet'}</span>
                    </div>
                    <div className="flex flex-col text-left bg-slate-900/50 rounded p-1.5 border border-slate-800/50 shadow-inner">
                        <span className="text-[8px] font-bold tracking-wider mb-0.5">MODEL</span>
                        <span className="text-slate-200 font-bold whitespace-nowrap truncate">{data.model || 'FortiGate 201E'}</span>
                    </div>
                    <div className="flex flex-col text-left bg-slate-900/50 rounded p-1.5 border border-slate-800/50 shadow-inner">
                        <span className="text-[8px] font-bold tracking-wider mb-0.5">CPU</span>
                        <span className="text-emerald-400 font-bold font-mono">{data.cpu || '12%'}</span>
                    </div>
                    <div className="flex flex-col text-left bg-slate-900/50 rounded p-1.5 border border-slate-800/50 shadow-inner">
                        <span className="text-[8px] font-bold tracking-wider mb-0.5">MEM</span>
                        <span className="text-blue-400 font-bold font-mono">{data.memory || '48%'}</span>
                    </div>
                </div>

                <EndpointFirewallPortMatrix 
                    ports={data.ports} 
                    totalPortCount={data.port || data.PORT} 
                    vendor={data.vendor || data.VENDOR || data.manufacturer}
                />
            </div>
        );
    }

    // 6. NVR Telemetry Footer
    if (subType === 'nvr') {
        return (
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-4 gap-2 text-[9px] font-sans text-slate-400 w-full relative z-10">
                <div className="flex flex-col text-left bg-slate-900/50 rounded p-1.5 border border-slate-800/50 shadow-inner group-hover:bg-slate-800/40 transition-colors">
                    <span className="text-[8px] font-bold tracking-wider mb-0.5">MFR</span>
                    <span className="text-slate-200 font-bold whitespace-nowrap truncate" title={data.manufacturer || 'i-PRO'}>{data.manufacturer || 'i-PRO'}</span>
                </div>
                <div className="flex flex-col text-left bg-slate-900/50 rounded p-1.5 border border-slate-800/50 shadow-inner group-hover:bg-slate-800/40 transition-colors">
                    <span className="text-[8px] font-bold tracking-wider mb-0.5">MODEL</span>
                    <span className="text-slate-200 font-bold whitespace-nowrap truncate" title={data.model || 'N/A'}>{data.model || 'N/A'}</span>
                </div>
                <div className="flex flex-col text-left bg-slate-900/50 rounded p-1.5 border border-slate-800/50 shadow-inner group-hover:bg-slate-800/40 transition-colors">
                    <span className="text-[8px] font-bold tracking-wider mb-0.5">TEMP</span>
                    <span className="text-amber-400 font-bold whitespace-nowrap">{data.temperature ? `${data.temperature}°C` : 'N/A'}</span>
                </div>
                <div className="flex flex-col text-left bg-slate-900/50 rounded p-1.5 border border-slate-800/50 shadow-inner group-hover:bg-slate-800/40 transition-colors">
                    <span className="text-[8px] font-bold tracking-wider mb-0.5">STATUS</span>
                    <span className={`font-bold whitespace-nowrap truncate ${(data.recordingState === 'Recording' || data.recordingState === 'Normal') ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {data.recordingState && data.recordingState !== 'N/A'
                            ? data.recordingState
                            : (data.alarmSummary && data.alarmSummary !== 'N/A' ? `ALM: ${data.alarmSummary}` : 'Normal')}
                    </span>
                </div>

                {(data.fanStatus || data.raidStatus) && (
                    <div className="col-span-4 flex items-center justify-between bg-slate-950/60 rounded px-2.5 py-1.5 border border-slate-800/60 text-[8.5px]">
                        {data.fanStatus && (
                            <span className="flex items-center gap-1.5">
                                <span className="text-slate-500 font-semibold">FAN:</span>
                                <span className={data.fanStatus.includes('Normal') ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{data.fanStatus}</span>
                            </span>
                        )}
                        {data.raidStatus && (
                            <span className="flex items-center gap-1.5">
                                <span className="text-slate-500 font-semibold">RAID:</span>
                                <span className={data.raidStatus.includes('Normal') ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{data.raidStatus}</span>
                            </span>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return null;
}
