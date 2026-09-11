import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Network, MapPin, Activity } from 'lucide-react';

function CustomDeviceNode({ data, selected }) {
    const isWarning = data.status === 'warning';
    const isDown = data.status === 'down';

    let borderColor = 'border-emerald-500/30 group-hover:border-emerald-400/60';
    let bgGradient = 'from-slate-900/90 to-slate-950/90';
    let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    let iconBg = 'bg-emerald-500/10 border-emerald-500/20';
    let iconColor = 'text-emerald-400';
    let glowShadow = 'shadow-[0_0_20px_rgba(16,185,129,0.1)]';

    if (isDown) {
        borderColor = 'border-rose-500/50 group-hover:border-rose-400/80';
        bgGradient = 'from-rose-950/80 to-slate-950/90';
        badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold';
        iconBg = 'bg-rose-500/20 border-rose-500/30';
        iconColor = 'text-rose-400';
        glowShadow = 'shadow-[0_0_20px_rgba(244,63,94,0.2)]';
    } else if (isWarning) {
        borderColor = 'border-amber-500/50 group-hover:border-amber-400/80';
        bgGradient = 'from-amber-950/80 to-slate-950/90';
        badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        iconBg = 'bg-amber-500/20 border-amber-500/30';
        iconColor = 'text-amber-400';
        glowShadow = 'shadow-[0_0_20px_rgba(245,158,11,0.15)]';
    } else if (data.vlan?.includes('CCTV')) {
        borderColor = 'border-purple-500/40 group-hover:border-purple-400/70';
        bgGradient = 'from-purple-950/60 to-slate-950/90';
        badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        iconBg = 'bg-purple-500/10 border-purple-500/20';
        iconColor = 'text-purple-400';
        glowShadow = 'shadow-[0_0_20px_rgba(168,85,247,0.15)]';
    }

    return (
        <div className={`group relative w-72 bg-gradient-to-br ${bgGradient} rounded-2xl border ${borderColor} p-4 backdrop-blur-xl text-center font-sans transition-all duration-300 ${glowShadow} ${selected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#070c14] shadow-[0_0_30px_rgba(59,130,246,0.3)] z-30' : 'z-10'}`}>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>

            {/* Top Handles */}
            <Handle type="target" position={Position.Top} id="t-top" className="!bg-slate-400 !w-2 !h-2 !border-slate-800" style={{ left: '50%' }} />
            <Handle type="source" position={Position.Top} id="s-top" className="!bg-slate-400 !w-2 !h-2 !opacity-0" style={{ left: '50%' }} />

            {/* Left Handles */}
            <Handle type="target" position={Position.Left} id="t-left" className="!bg-slate-400 !w-2 !h-2 !border-slate-800" style={{ top: '48px' }} />
            <Handle type="source" position={Position.Left} id="s-left" className="!bg-slate-400 !w-2 !h-2 !opacity-0" style={{ top: '48px' }} />

            {/* Right Handles */}
            <Handle type="target" position={Position.Right} id="t-right" className="!bg-slate-400 !w-2 !h-2 !border-slate-800" style={{ top: '48px' }} />
            <Handle type="source" position={Position.Right} id="s-right" className="!bg-slate-400 !w-2 !h-2 !opacity-0" style={{ top: '48px' }} />

            {/* Header / Badges */}
            <div className="flex justify-between items-center mb-3">
                <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-md border ${badgeColor} shadow-inner`}>
                    {data.vlan || 'LAN • VLAN 10'}
                </span>
                {data.floor && (
                    <span className="text-[9px] text-slate-300 font-medium flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700/50">
                        <MapPin className="w-2.5 h-2.5 text-blue-400" /> {data.floor}
                    </span>
                )}
            </div>

            {/* Icon Center */}
            <div className="flex justify-center my-3 relative">
                {isDown && (
                    <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full"></div>
                )}
                <div className={`p-3 rounded-xl border ${iconBg} shadow-inner relative z-10 group-hover:scale-110 transition-transform duration-300`}>
                    <Network className={`w-6 h-6 ${iconColor}`} />
                </div>
            </div>

            {/* Title & Desc */}
            <div className="font-bold text-sm text-slate-100 tracking-wide break-words group-hover:text-blue-200 transition-colors">
                {data.label}
            </div>

            {/* IP Address, MAC & Vendor Badge */}
            <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                <span className="text-[10px] font-mono text-blue-400 font-semibold">{data.ip}</span>
                {data.mac && data.mac !== '-' && (
                    <span className="text-[8px] font-mono text-slate-400 bg-slate-900 px-1 py-0.2 rounded border border-slate-800">
                        {data.mac}
                    </span>
                )}
                {data.vendor && (
                    <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700/80">
                        {data.vendor}
                    </span>
                )}
            </div>

            {/* Location Box */}
            {data.location && (
                <div className="text-[10px] text-blue-300/90 font-medium bg-blue-950/30 border border-blue-900/40 rounded-lg px-2 py-1 mt-2 whitespace-normal shadow-inner">
                    {data.location}
                </div>
            )}

            {/* Quick System Info Badge (Firmware / Uptime) */}
            {(data.firmware || data.uptime) && (
                <div className="mt-2 px-2 py-1 bg-slate-950/70 border border-slate-800/80 rounded-lg text-left text-[9px] font-mono flex flex-col gap-0.5 shadow-inner">
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
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1.5 text-[9px] font-mono text-slate-300">
                <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800 text-center">
                    <span className="text-slate-500 block text-[8px] font-bold">CPU</span>
                    <span className={`font-bold ${data.cpu && data.cpu !== '-' && data.cpu !== 'N/A' && parseInt(data.cpu) > 80 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {data.cpu && data.cpu !== 'N/A' ? (data.cpu.toString().includes('%') ? data.cpu : `${data.cpu}%`) : '-'}
                    </span>
                </div>
                <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800 text-center">
                    <span className="text-slate-500 block text-[8px] font-bold">RAM</span>
                    <span className={`font-bold ${data.memory && data.memory !== '-' && data.memory !== 'N/A' && parseInt(data.memory) > 85 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {data.memory && data.memory !== 'N/A' ? (data.memory.toString().includes('%') ? data.memory : `${data.memory}%`) : '-'}
                    </span>
                </div>
                <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800 text-center">
                    <span className="text-slate-500 block text-[8px] font-bold">SUHU</span>
                    <span className={`font-bold ${data.temperature && parseInt(data.temperature) > 60 ? 'text-rose-400' : 'text-amber-400'}`}>
                        {data.temperature ? `${data.temperature}°C` : '-'}
                    </span>
                </div>
            </div>

            {/* Traffic Bandwidth Metrics Bar (IN / OUT) */}
            {(data.trafficIn || data.trafficOut || (data.networkTraffic && (data.networkTraffic.in || data.networkTraffic.out))) && (
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[8.5px] font-mono">
                    <div className="bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80 flex items-center justify-between">
                        <span className="text-emerald-500/80 font-bold">▼ IN:</span>
                        <span className="text-slate-300 font-semibold">{data.trafficIn || data.networkTraffic?.in || '0 MB'}</span>
                    </div>
                    <div className="bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80 flex items-center justify-between">
                        <span className="text-blue-400/80 font-bold">▲ OUT:</span>
                        <span className="text-slate-300 font-semibold">{data.trafficOut || data.networkTraffic?.out || '0 MB'}</span>
                    </div>
                </div>
            )}

            {/* Port Grid (48 Ports dengan Nomor Port Terbaca) */}
            <div className="mt-3 px-1">
                <div className="flex justify-between items-center text-[8px] text-slate-500 font-bold mb-1 uppercase tracking-widest">
                    <span>Network Ports (1-48)</span>
                    {data.ports && (
                        <span className="text-emerald-400 font-mono">
                            {data.ports.filter(p => p.status === 'up').length}/{data.ports.length} UP
                        </span>
                    )}
                </div>

                {/* 2-Row Switch Port Matrix (Row 1: Ganjil 1,3,5..47 | Row 2: Genap 2,4,6..48) */}
                <div 
                    className="grid gap-[2px] p-1.5 bg-slate-950/90 rounded-lg border border-slate-800/80 shadow-inner" 
                    style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
                >
                    {/* Baris Atas: Port Ganjil (1, 3, 5, ... 47) */}
                    {Array.from({ length: 24 }).map((_, col) => {
                        const portNum = col * 2 + 1;
                        let isUp = false;
                        let portAlias = '';
                        if (data.ports) {
                            const pData = data.ports.find(p => String(p.shortName) === String(portNum) || String(p.index) === String(portNum));
                            if (pData && pData.status === 'up') isUp = true;
                            if (pData?.alias) portAlias = ` [${pData.alias}]`;
                        }

                        return (
                            <div 
                                key={`port-${portNum}`} 
                                className={`relative w-full aspect-square rounded-[2px] border transition-colors group/port flex items-center justify-center ${
                                    isUp 
                                    ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] z-10' 
                                    : 'bg-slate-900 border-slate-700/60 hover:bg-slate-700'
                                }`} 
                                title={`Port ${portNum}${portAlias} ${isUp ? '(UP)' : '(DOWN)'}`}
                            >
                                <span className={`text-[6px] font-mono font-black select-none pointer-events-none leading-none ${isUp ? 'text-slate-950' : 'text-slate-500'}`}>
                                    {portNum}
                                </span>
                                {/* Hidden handles overlaid on the port */}
                                <Handle 
                                    type="target" 
                                    position={Position.Bottom} 
                                    id={`p-${portNum}`} 
                                    className="!opacity-0 !w-full !h-full !min-w-0 !min-h-0 !border-0 !m-0 !transform-none !left-0 !top-0 !rounded-none" 
                                    style={{ position: 'absolute' }} 
                                />
                                <Handle 
                                    type="source" 
                                    position={Position.Bottom} 
                                    id={`s-p-${portNum}`} 
                                    className="!opacity-0 !w-full !h-full !min-w-0 !min-h-0 !border-0 !m-0 !transform-none !left-0 !top-0 !rounded-none hidden" 
                                    style={{ position: 'absolute' }} 
                                />
                            </div>
                        );
                    })}

                    {/* Baris Bawah: Port Genap (2, 4, 6, ... 48) */}
                    {Array.from({ length: 24 }).map((_, col) => {
                        const portNum = (col + 1) * 2;
                        let isUp = false;
                        let portAlias = '';
                        if (data.ports) {
                            const pData = data.ports.find(p => String(p.shortName) === String(portNum) || String(p.index) === String(portNum));
                            if (pData && pData.status === 'up') isUp = true;
                            if (pData?.alias) portAlias = ` [${pData.alias}]`;
                        }

                        return (
                            <div 
                                key={`port-${portNum}`} 
                                className={`relative w-full aspect-square rounded-[2px] border transition-colors group/port flex items-center justify-center ${
                                    isUp 
                                    ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] z-10' 
                                    : 'bg-slate-900 border-slate-700/60 hover:bg-slate-700'
                                }`} 
                                title={`Port ${portNum}${portAlias} ${isUp ? '(UP)' : '(DOWN)'}`}
                            >
                                <span className={`text-[6px] font-mono font-black select-none pointer-events-none leading-none ${isUp ? 'text-slate-950' : 'text-slate-500'}`}>
                                    {portNum}
                                </span>
                                {/* Hidden handles overlaid on the port */}
                                <Handle 
                                    type="target" 
                                    position={Position.Bottom} 
                                    id={`p-${portNum}`} 
                                    className="!opacity-0 !w-full !h-full !min-w-0 !min-h-0 !border-0 !m-0 !transform-none !left-0 !top-0 !rounded-none" 
                                    style={{ position: 'absolute' }} 
                                />
                                <Handle 
                                    type="source" 
                                    position={Position.Bottom} 
                                    id={`s-p-${portNum}`} 
                                    className="!opacity-0 !w-full !h-full !min-w-0 !min-h-0 !border-0 !m-0 !transform-none !left-0 !top-0 !rounded-none hidden" 
                                    style={{ position: 'absolute' }} 
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer Status & Model */}
            <div className="mt-3 pt-2.5 border-t border-slate-700/50 text-[9px] font-bold text-slate-400 flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 font-mono text-[9px] truncate max-w-[160px]">
                    {data.model && data.model !== 'N/A' ? (
                        <span className="text-slate-200 font-semibold truncate" title={data.model}>{data.model}</span>
                    ) : (
                        <span className="text-slate-500">{data.category?.toUpperCase() || 'SWITCH'}</span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="tracking-wider">{isDown ? 'OFFLINE' : isWarning ? 'WARNING' : 'ONLINE'}</span>
                    <span className={`relative flex w-2 h-2`}>
                        {isDown && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full w-2 h-2 ${isDown ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`}></span>
                    </span>
                </div>
            </div>

            {/* Bottom Handles */}
            <Handle type="target" position={Position.Bottom} id="t-bottom" className="!bg-slate-400 !w-2 !h-2 !border-slate-800" style={{ left: '50%' }} />
            <Handle type="source" position={Position.Bottom} id="s-bottom" className="!bg-slate-400 !w-2 !h-2 !opacity-0" style={{ left: '50%' }} />
            <Handle type="target" position={Position.Bottom} id="t-bot" className="!bg-slate-400 !w-2 !h-2 !border-slate-800 hidden" style={{ left: '50%' }} />
            <Handle type="source" position={Position.Bottom} id="s-bot" className="!bg-slate-400 !w-2 !h-2 !opacity-0 hidden" style={{ left: '50%' }} />
        </div>
    );
}

export default memo(CustomDeviceNode);