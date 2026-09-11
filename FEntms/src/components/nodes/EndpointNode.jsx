import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Monitor, Printer, Wifi, Lock, Camera, Fingerprint, HardDrive, Server, Tablet, Cpu } from 'lucide-react';

const getEndpointStyle = (subType) => {
    switch (subType) {
        case 'gathering':
            return {
                icon: (
                    <div className="relative flex items-center justify-center">
                        <Tablet className="w-4 h-4 text-teal-400" />
                        <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping opacity-75"></span>
                    </div>
                ),
                border: 'border-teal-500/40 group-hover:border-teal-400/80',
                bg: 'from-teal-950/40 to-slate-950/80',
                iconBg: 'bg-teal-500/10 border-teal-500/20 shadow-[0_0_10px_rgba(20,184,166,0.25)]'
            };
        case 'camera':
            return { icon: <Camera className="w-4 h-4 text-purple-400" />, border: 'border-purple-500/40 group-hover:border-purple-400/80', bg: 'from-purple-950/40 to-slate-950/80', iconBg: 'bg-purple-500/10 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]' };
        case 'nvr':
            return { icon: <HardDrive className="w-4 h-4 text-indigo-400" />, border: 'border-indigo-500/40 group-hover:border-indigo-400/80', bg: 'from-indigo-950/40 to-slate-950/80', iconBg: 'bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]' };
        case 'server':
            return { icon: <Server className="w-4 h-4 text-indigo-400" />, border: 'border-indigo-500/40 group-hover:border-indigo-400/80', bg: 'from-indigo-950/40 to-slate-950/80', iconBg: 'bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]' };
        case 'door':
            return { icon: <Lock className="w-4 h-4 text-amber-400" />, border: 'border-amber-500/40 group-hover:border-amber-400/80', bg: 'from-amber-950/40 to-slate-950/80', iconBg: 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]' };
        case 'biometric':
            return { icon: <Fingerprint className="w-4 h-4 text-orange-400" />, border: 'border-orange-500/40 group-hover:border-orange-400/80', bg: 'from-orange-950/40 to-slate-950/80', iconBg: 'bg-orange-500/10 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.2)]' };
        case 'ap':
            return { icon: <Wifi className="w-4 h-4 text-emerald-400" />, border: 'border-emerald-500/40 group-hover:border-emerald-400/80', bg: 'from-emerald-950/40 to-slate-950/80', iconBg: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' };
        case 'printer':
            return { icon: <Printer className="w-4 h-4 text-cyan-400" />, border: 'border-cyan-500/40 group-hover:border-cyan-400/80', bg: 'from-cyan-950/40 to-slate-950/80', iconBg: 'bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.2)]' };
        case 'pc':
        default:
            return { icon: <Monitor className="w-4 h-4 text-blue-400" />, border: 'border-blue-500/40 group-hover:border-blue-400/80', bg: 'from-blue-950/40 to-slate-950/80', iconBg: 'bg-blue-500/10 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]' };
    }
};

function EndpointNode({ data, selected }) {
    const style = getEndpointStyle(data.subType);
    const isDown = data.status === 'down';
    
    // Override colors if DOWN
    const finalIcon = isDown ? React.cloneElement(style.icon, { className: 'w-4 h-4 text-rose-400' }) : style.icon;
    const finalBorder = isDown ? 'border-rose-500/50 group-hover:border-rose-400/80 shadow-[0_0_15px_rgba(244,63,94,0.15)]' : style.border;
    const finalBg = isDown ? 'from-rose-950/60 to-slate-950/90' : style.bg;
    const finalIconBg = isDown ? 'bg-rose-500/10 border-rose-500/20' : style.iconBg;

    const cardWidth = 'w-72';

    return (
        <div className={`group ${cardWidth} p-3 rounded-xl border bg-gradient-to-br ${finalBg} backdrop-blur-xl shadow-lg flex flex-col transition-all duration-300 ${finalBorder} ${selected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#070c14] shadow-[0_0_20px_rgba(59,130,246,0.3)] z-50' : 'z-10'}`}>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none"></div>

            {/* Top Handles */}
            <Handle type="target" position={Position.Top} id="t-top" className="!bg-slate-400 !w-2 !h-2 !border-slate-800" style={{ left: '50%' }} />
            <Handle type="source" position={Position.Top} id="s-top" className="!bg-slate-400 !w-2 !h-2 !opacity-0" style={{ left: '50%' }} />

            {/* Left Handles */}
            <Handle type="target" position={Position.Left} id="t-left" className="!bg-slate-400 !w-2 !h-2 !border-slate-800" style={{ top: '48px' }} />
            <Handle type="source" position={Position.Left} id="s-left" className="!bg-slate-400 !w-2 !h-2 !opacity-0" style={{ top: '48px' }} />

            {/* Right Handles */}
            <Handle type="target" position={Position.Right} id="t-right" className="!bg-slate-400 !w-2 !h-2 !border-slate-800" style={{ top: '48px' }} />
            <Handle type="source" position={Position.Right} id="s-right" className="!bg-slate-400 !w-2 !h-2 !opacity-0" style={{ top: '48px' }} />

            <div className="flex items-center gap-3 relative z-10">
                <div className={`p-2 rounded-lg border shrink-0 ${finalIconBg} group-hover:scale-110 transition-transform duration-300 relative`}>
                    {isDown && <div className="absolute inset-0 bg-rose-500/20 blur-md rounded-full"></div>}
                    <div className="relative z-10">{finalIcon}</div>
                </div>

                <div className="flex flex-col text-left font-sans overflow-hidden flex-1">
                    <div className="flex items-center justify-between gap-1">
                        <span className="text-[12px] font-bold text-slate-100 leading-tight whitespace-nowrap tracking-wide group-hover:text-blue-200 transition-colors truncate">{data.label}</span>
                        {data.port && data.port !== '-' && (
                            <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                                Port {data.port}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`text-[9px] font-mono tracking-wider ${isDown ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                            {isDown ? 'OFFLINE' : data.ip}
                        </span>
                        {data.mac && data.mac !== '-' && (
                            <span className="text-[8px] font-mono text-slate-500 bg-slate-900/80 px-1 py-0.2 rounded border border-slate-800" title={`MAC: ${data.mac}`}>
                                {data.mac}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {(data.subType === 'server') && (
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
            )}

            {(data.subType === 'nvr') && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[9px] font-sans text-slate-400 w-full relative z-10">
                    <div className="flex flex-col text-left bg-slate-900/50 rounded p-1.5 border border-slate-800/50 shadow-inner group-hover:bg-slate-800/40 transition-colors">
                        <span className="text-[8px] font-bold tracking-wider mb-0.5">MFR</span>
                        <span className="text-slate-200 font-bold whitespace-nowrap">{data.manufacturer || 'i-PRO'}</span>
                    </div>
                    <div className="flex flex-col text-left bg-slate-900/50 rounded p-1.5 border border-slate-800/50 shadow-inner group-hover:bg-slate-800/40 transition-colors">
                        <span className="text-[8px] font-bold tracking-wider mb-0.5">MODEL</span>
                        <span className="text-slate-200 font-bold whitespace-nowrap">{data.model || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col text-left bg-slate-900/50 rounded p-1.5 border border-slate-800/50 shadow-inner group-hover:bg-slate-800/40 transition-colors">
                        <span className="text-[8px] font-bold tracking-wider mb-0.5">TEMP</span>
                        <span className="text-amber-400 font-bold whitespace-nowrap">{data.temperature ? `${data.temperature}°C` : 'N/A'}</span>
                    </div>
                    <div className="flex flex-col text-left bg-slate-900/50 rounded p-1.5 border border-slate-800/50 shadow-inner group-hover:bg-slate-800/40 transition-colors">
                        <span className="text-[8px] font-bold tracking-wider mb-0.5">RECORDING</span>
                        <span className={`font-bold whitespace-nowrap ${(data.recordingState === 'Recording' || data.recordingState === 'Normal') ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {data.recordingState && data.recordingState !== 'N/A' 
                                ? data.recordingState 
                                : (data.alarmSummary && data.alarmSummary !== 'N/A' ? `ALM: ${data.alarmSummary}` : 'Normal')}
                        </span>
                    </div>

                    {(data.fanStatus || data.raidStatus) && (
                        <div className="col-span-2 flex items-center justify-between bg-slate-950/60 rounded px-2 py-1 border border-slate-800/60 text-[8px]">
                            {data.fanStatus && (
                                <span className="flex items-center gap-1">
                                    <span className="text-slate-500">FAN:</span>
                                    <span className={data.fanStatus.includes('Normal') ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{data.fanStatus}</span>
                                </span>
                            )}
                            {data.raidStatus && (
                                <span className="flex items-center gap-1">
                                    <span className="text-slate-500">RAID:</span>
                                    <span className={data.raidStatus.includes('Normal') ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{data.raidStatus}</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Handles */}
            <Handle type="target" position={Position.Bottom} id="t-bottom" className="!bg-slate-400 !w-2 !h-2 !border-slate-800" style={{ left: '50%' }} />
            <Handle type="source" position={Position.Bottom} id="s-bottom" className="!bg-slate-400 !w-2 !h-2 !opacity-0" style={{ left: '50%' }} />
            <Handle type="target" position={Position.Bottom} id="t-bot" className="!bg-slate-400 !w-2 !h-2 !border-slate-800 hidden" style={{ left: '50%' }} />
            <Handle type="source" position={Position.Bottom} id="s-bot" className="!bg-slate-400 !w-2 !h-2 !opacity-0 hidden" style={{ left: '50%' }} />
        </div>
    );
}

export default memo(EndpointNode);