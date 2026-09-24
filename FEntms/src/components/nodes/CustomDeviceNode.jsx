import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { getStatusTheme } from '../../constants/statusStyles';
import NodeHeader from './device/NodeHeader';
import NodeTelemetryMetrics from './device/NodeTelemetryMetrics';
import NodePortGrid from './device/NodePortGrid';
import NodeFooter from './device/NodeFooter';

function CustomDeviceNode({ data, selected }) {
    const theme = getStatusTheme(data.status);
    const isDown = theme.key === 'down';
    const isWarning = theme.key === 'warning';
    const isOffline = theme.key === 'offline';

    let borderColor = theme.border;
    let bgGradient = theme.bg;
    let badgeColor = theme.badge;
    let iconBg = theme.iconBg;
    let iconColor = theme.text;
    let glowShadow = theme.glow;

    if (data.vlan?.includes('CCTV') && !isDown && !isWarning && !isOffline) {
        borderColor = 'border-purple-500/40 group-hover:border-purple-400/70';
        bgGradient = 'from-purple-950/40 via-slate-900/90 to-slate-950/95';
        badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
        iconBg = 'bg-purple-500/10 border-purple-500/20 text-purple-400';
        glowShadow = 'shadow-[0_0_20px_rgba(168,85,247,0.12)]';
    }

    let totalPorts = 24;
    let modularConfig = null;
    try {
        if (typeof data.port === 'string' && data.port.startsWith('{')) {
            const p = JSON.parse(data.port);
            modularConfig = p;
            totalPorts = (Number(p.rj45 || 0) + Number(p.sfp || 0) + Number(p.sfpPlus || 0) + Number(p.wan || 0) + Number(p.mgmt || 0) + Number(p.ha || 0)) || 24;
        } else if (data.port && typeof data.port === 'object') {
            modularConfig = data.port;
            totalPorts = (Number(data.port.rj45 || 0) + Number(data.port.sfp || 0) + Number(data.port.sfpPlus || 0) + Number(data.port.wan || 0) + Number(data.port.mgmt || 0) + Number(data.port.ha || 0)) || 24;
        } else {
            totalPorts = parseInt(data.port, 10) || 24;
        }
    } catch {
        totalPorts = parseInt(data.port, 10) || 24;
    }
    
    // Lebar node adaptif sesuai jumlah port
    let cardWidth = 'w-[440px]';
    if (totalPorts <= 8) cardWidth = 'w-[280px]';
    else if (totalPorts <= 12) cardWidth = 'w-[320px]';
    else if (totalPorts <= 16) cardWidth = 'w-[360px]';
    else if (totalPorts <= 24) cardWidth = 'w-[440px]';
    else if (totalPorts <= 32) cardWidth = 'w-[480px]';
    else if (totalPorts <= 48) cardWidth = 'w-[520px]';
    else cardWidth = 'w-[560px]';

    return (
        <div className={`group relative ${cardWidth} bg-gradient-to-br ${bgGradient} rounded-2xl border ${borderColor} p-4 backdrop-blur-xl text-center font-sans transition-all duration-300 ${glowShadow} ${selected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#070c14] shadow-[0_0_30px_rgba(59,130,246,0.3)] z-30' : 'z-10'}`}>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>

            {/* Top Handles */}
            <Handle type="target" position={Position.Top} id="t-top" className="!bg-slate-400 !w-2 !h-2 !border-slate-800" style={{ left: '50%' }} />
            <Handle type="source" position={Position.Top} id="s-top" className="!bg-slate-400 !w-2 !h-2 !opacity-0" style={{ left: '50%' }} />

            {/* Left Handles */}
            <Handle type="target" position={Position.Left} id="t-left" className="!bg-slate-400 !w-2 !h-2 !border-slate-800" style={{ top: '50%' }} />
            <Handle type="source" position={Position.Left} id="s-left" className="!bg-slate-400 !w-2 !h-2 !opacity-0" style={{ top: '50%' }} />

            {/* Right Handles */}
            <Handle type="target" position={Position.Right} id="t-right" className="!bg-slate-400 !w-2 !h-2 !border-slate-800" style={{ top: '50%' }} />
            <Handle type="source" position={Position.Right} id="s-right" className="!bg-slate-400 !w-2 !h-2 !opacity-0" style={{ top: '50%' }} />

            {/* Sub-components */}
            <NodeHeader
                data={data}
                badgeColor={badgeColor}
                iconBg={iconBg}
                iconColor={iconColor}
                isDown={isDown}
            />

            <NodeTelemetryMetrics data={data} />

            <NodePortGrid
                totalPorts={totalPorts}
                modularConfig={modularConfig}
                ports={data.ports}
            />

            <NodeFooter data={data} theme={theme} />

            {/* Bottom Card Center Handles */}
            <Handle type="target" position={Position.Bottom} id="t-bottom" className="!bg-slate-400 !w-2 !h-2 !border-slate-800" style={{ left: '50%' }} />
            <Handle type="source" position={Position.Bottom} id="s-bottom" className="!bg-slate-400 !w-2 !h-2 !opacity-0" style={{ left: '50%' }} />
        </div>
    );
}

export default memo(CustomDeviceNode);