import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { getStatusTheme } from '../../constants/statusStyles';
import { getEndpointStyle } from './endpoint/endpointStyles';
import EndpointTelemetryFooter from './endpoint/EndpointTelemetryFooter';

function EndpointNode({ data, selected }) {
    const style = getEndpointStyle(data.subType);
    const theme = getStatusTheme(data.status);
    const isDown = theme.key === 'down';
    const isWarning = theme.key === 'warning';
    const isOffline = theme.key === 'offline';

    // Override icon color jika status abnormal
    const finalIcon = isDown
        ? React.cloneElement(style.icon, { className: 'w-4 h-4 text-rose-400' })
        : isWarning
            ? React.cloneElement(style.icon, { className: 'w-4 h-4 text-amber-400' })
            : isOffline
                ? React.cloneElement(style.icon, { className: 'w-4 h-4 text-slate-400' })
                : style.icon;

    const finalBorder = (isDown || isWarning || isOffline) ? theme.border : style.border;
    const finalBg = (isDown || isWarning || isOffline) ? theme.bg : style.bg;
    const finalIconBg = (isDown || isWarning || isOffline) ? theme.iconBg : style.iconBg;
    const glowShadow = theme.glow;

    let portCount = parseInt(data.port || data.PORT, 10) || 0;
    try {
        const rawP = data.port || data.PORT;
        if (typeof rawP === 'string' && rawP.trim().startsWith('{')) {
            const p = JSON.parse(rawP);
            portCount = (Number(p.rj45 || 0) + Number(p.sfp || 0) + Number(p.sfpPlus || 0) + Number(p.wan || 0) + Number(p.mgmt || 0) + Number(p.ha || 0));
        }
    } catch (e) {}

    let cardWidth = 'w-72';

    if (data.subType === 'firewall') {
        if (portCount >= 30 || portCount === 48) cardWidth = 'w-[480px]';
        else if (portCount >= 24) cardWidth = 'w-[440px]';
        else if (portCount >= 16) cardWidth = 'w-[380px]';
        else if (portCount > 0) cardWidth = 'w-[320px]';
        else cardWidth = 'w-[460px]';
    } else if (data.subType === 'nvr' || data.subType === 'server') {
        cardWidth = 'w-[440px]';
    }

    return (
        <div className={`group ${cardWidth} p-3 rounded-xl border bg-gradient-to-br ${finalBg} backdrop-blur-xl shadow-lg flex flex-col transition-all duration-300 ${finalBorder} ${glowShadow} ${selected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#070c14] shadow-[0_0_20px_rgba(59,130,246,0.3)] z-50' : 'z-10'}`}>
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

            {/* Header / Identity */}
            <div className="flex items-center gap-3 relative z-10">
                <div className={`p-2 rounded-lg border shrink-0 ${finalIconBg} group-hover:scale-110 transition-transform duration-300 relative`}>
                    {isDown && <div className="absolute inset-0 bg-rose-500/20 blur-md rounded-full"></div>}
                    <div className="relative z-10">{finalIcon}</div>
                </div>

                <div className="flex flex-col text-left font-sans overflow-hidden flex-1">
                    <div className="flex items-center justify-between gap-1">
                        <span className="text-[12px] font-bold text-slate-100 leading-tight whitespace-nowrap tracking-wide group-hover:text-blue-200 transition-colors truncate">{data.label}</span>
                        {data.port && data.port !== '-' && (
                            <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                                Port {data.port}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-[9.5px] font-mono font-semibold tracking-tight select-all ${isDown ? 'text-rose-400 font-bold' : isWarning ? 'text-amber-400' : isOffline ? 'text-slate-400' : 'text-blue-400'}`}>
                            {isDown ? 'CRITICAL / DOWN' : isOffline ? 'OFFLINE' : data.ip}
                        </span>
                        {data.mac && data.mac !== '-' && (
                            <span className="text-[8.5px] font-mono text-slate-400 bg-slate-900/90 px-1.5 py-0.2 rounded border border-slate-800 tracking-tight select-all" title={`MAC: ${data.mac}`}>
                                {data.mac}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Dedicated Device Footer (UPS / ATS / AP / Server / Firewall / NVR) */}
            <EndpointTelemetryFooter data={data} />

            {/* Bottom Handles */}
            <Handle type="target" position={Position.Bottom} id="t-bottom" className="!bg-slate-400 !w-2 !h-2 !border-slate-800" style={{ left: '50%' }} />
            <Handle type="source" position={Position.Bottom} id="s-bottom" className="!bg-slate-400 !w-2 !h-2 !opacity-0" style={{ left: '50%' }} />
            <Handle type="target" position={Position.Bottom} id="t-bot" className="!bg-slate-400 !w-2 !h-2 !border-slate-800 hidden" style={{ left: '50%' }} />
            <Handle type="source" position={Position.Bottom} id="s-bot" className="!bg-slate-400 !w-2 !h-2 !opacity-0 hidden" style={{ left: '50%' }} />
        </div>
    );
}

export default memo(EndpointNode);