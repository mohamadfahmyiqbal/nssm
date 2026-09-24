import React from 'react';
import NodePortItem from './NodePortItem';

export default function NodePortGrid({ totalPorts, modularConfig, ports }) {
    const halfPorts = Math.ceil(totalPorts / 2);

    const getPortMeta = (portNum) => {
        if (!modularConfig) return { type: 'GE', label: `${portNum}`, border: 'border-slate-700/80', dot: 'bg-slate-500', text: 'text-slate-300' };

        const rj45 = Number(modularConfig.rj45 || 0);
        const sfp = Number(modularConfig.sfp || 0);
        const sfpPlus = Number(modularConfig.sfpPlus || 0);
        const wan = Number(modularConfig.wan || 0);
        const mgmt = Number(modularConfig.mgmt || 0);
        const ha = Number(modularConfig.ha || 0);

        if (portNum <= rj45) {
            return { type: 'RJ45', typeName: 'GE RJ45', label: `${portNum}`, border: 'border-slate-700/80', dot: 'bg-slate-500', text: 'text-slate-300' };
        }
        let offset = rj45;
        if (portNum <= offset + sfp) {
            const idx = portNum - offset;
            return { type: 'SFP', typeName: 'GE SFP', label: `S${idx}`, border: 'border-cyan-500/60 bg-cyan-950/40', dot: 'bg-cyan-400', text: 'text-cyan-300 font-bold' };
        }
        offset += sfp;
        if (portNum <= offset + sfpPlus) {
            const idx = portNum - offset;
            return { type: 'SFP+', typeName: '10G SFP+', label: `10G${idx}`, border: 'border-purple-500/60 bg-purple-950/40', dot: 'bg-purple-400', text: 'text-purple-300 font-bold' };
        }
        offset += sfpPlus;
        if (portNum <= offset + wan) {
            const idx = portNum - offset;
            return { type: 'WAN', typeName: 'WAN', label: `W${idx}`, border: 'border-amber-500/60 bg-amber-950/40', dot: 'bg-amber-400', text: 'text-amber-300 font-bold' };
        }
        offset += wan;
        if (portNum <= offset + mgmt) {
            const idx = portNum - offset;
            return { type: 'MGMT', typeName: 'MGMT', label: `M${idx}`, border: 'border-blue-500/60 bg-blue-950/40', dot: 'bg-blue-400', text: 'text-blue-300 font-bold' };
        }
        offset += mgmt;
        if (portNum <= offset + ha) {
            const idx = portNum - offset;
            return { type: 'HA', typeName: 'HA CLUSTER', label: `HA${idx}`, border: 'border-rose-500/60 bg-rose-950/40', dot: 'bg-rose-400', text: 'text-rose-300 font-bold' };
        }
        return { type: 'GE', typeName: 'Port', label: `${portNum}`, border: 'border-slate-700/80', dot: 'bg-slate-500', text: 'text-slate-300' };
    };

    const resolvePortData = (portNum) => {
        const meta = getPortMeta(portNum);
        let isUp = false;
        let portAlias = '';
        let portTrafficSummary = '';
        let portLoadColor = meta.border ? `${meta.border} hover:brightness-125` : 'bg-slate-900 border-slate-700/70 hover:bg-slate-700';
        let portTextColor = meta.text || 'text-slate-400';
        let portGlow = '';

        if (ports && Array.isArray(ports)) {
            const pData = ports.find(p => {
                if (!p) return false;
                const sName = String(p.shortName || '').toLowerCase().trim();
                const pName = String(p.name || '').toLowerCase().trim();

                if (sName === String(portNum) || sName === `port${portNum}` || sName === `p${portNum}` || sName === `gi${portNum}` || sName === `fa${portNum}`) return true;

                const stackMatch = pName.match(/(?:gi|fa|te|gigabitethernet|fastethernet)(\d+)\/(\d+)\/(\d+)/i);
                if (stackMatch) {
                    const swNum = parseInt(stackMatch[1], 10);
                    const ptNum = parseInt(stackMatch[3], 10);
                    if (swNum === 1 && ptNum === portNum) return true;
                    if (swNum === 2 && ptNum === (portNum - 24)) return true;
                }

                const genericMatch = pName.match(/(?:gi|fa|te|eth|ethernet|gigabitethernet|port|ge)[^\d]*(\d+)$/i);
                if (genericMatch && parseInt(genericMatch[1], 10) === portNum) return true;

                return false;
            });

            if (pData && (pData.status === 'up' || pData.status === 'UP' || pData.status === 1 || pData.status === '1')) {
                isUp = true;
                const inBps = pData.inBps || 0;
                const outBps = pData.outBps || 0;
                const speed = pData.speed || 1000000000;
                const maxUsage = Math.max(inBps, outBps);
                const usagePct = speed > 0 ? (maxUsage / speed) * 100 : 0;
                const hasErrors = (pData.inErrors > 0 || pData.outErrors > 0);

                if (hasErrors || usagePct >= 80) {
                    portLoadColor = 'bg-rose-500 border-rose-400';
                    portGlow = 'shadow-[0_0_8px_rgba(244,63,94,0.8)]';
                    portTextColor = 'text-white font-black';
                } else if (usagePct >= 50) {
                    portLoadColor = 'bg-amber-400 border-amber-300';
                    portGlow = 'shadow-[0_0_8px_rgba(245,158,11,0.8)]';
                    portTextColor = 'text-slate-950 font-black';
                } else {
                    portLoadColor = 'bg-emerald-500 border-emerald-400';
                    portGlow = 'shadow-[0_0_8px_rgba(16,185,129,0.8)]';
                    portTextColor = 'text-slate-950 font-black';
                }

                if (inBps > 0 || outBps > 0) {
                    portTrafficSummary = ` | IN: ${(inBps / (1024 * 1024)).toFixed(1)}M OUT: ${(outBps / (1024 * 1024)).toFixed(1)}M`;
                }
            }
            if (pData?.alias) portAlias = ` [${pData.alias}]`;
        }

        return { meta, isUp, portAlias, portTrafficSummary, portLoadColor, portTextColor, portGlow };
    };

    return (
        <div className="mt-3 px-1">
            <div className="flex flex-wrap justify-between items-center text-[9px] text-slate-400 font-bold mb-1.5 uppercase tracking-wider gap-1">
                <span>Network Ports (1-{totalPorts})</span>
                {ports && (
                    <span className="text-emerald-400 font-mono">
                        {ports.filter(p => p.status === 'up').length}/{ports.length} UP
                    </span>
                )}
            </div>

            {/* Modular Port Types Legend */}
            {modularConfig && (
                <div className="flex flex-wrap gap-1.5 mb-1.5 text-[8px] font-mono justify-center">
                    {Number(modularConfig.rj45 || 0) > 0 && <span className="px-1 py-0.2 bg-slate-800 text-slate-300 rounded border border-slate-700">RJ45:{modularConfig.rj45}</span>}
                    {Number(modularConfig.sfp || 0) > 0 && <span className="px-1 py-0.2 bg-cyan-950/60 text-cyan-300 rounded border border-cyan-500/50">SFP:{modularConfig.sfp}</span>}
                    {Number(modularConfig.sfpPlus || 0) > 0 && <span className="px-1 py-0.2 bg-purple-950/60 text-purple-300 rounded border border-purple-500/50">SFP+:{modularConfig.sfpPlus}</span>}
                    {Number(modularConfig.wan || 0) > 0 && <span className="px-1 py-0.2 bg-amber-950/60 text-amber-300 rounded border border-amber-500/50">WAN:{modularConfig.wan}</span>}
                    {Number(modularConfig.mgmt || 0) > 0 && <span className="px-1 py-0.2 bg-blue-950/60 text-blue-300 rounded border border-blue-900/50">MGMT:{modularConfig.mgmt}</span>}
                    {Number(modularConfig.ha || 0) > 0 && <span className="px-1 py-0.2 bg-rose-950/60 text-rose-300 rounded border border-rose-500/50">HA:{modularConfig.ha}</span>}
                </div>
            )}

            {/* 2-Row Switch Port Matrix Zigzag Box */}
            <div className="p-3 bg-slate-950/95 rounded-xl border border-slate-800/80 shadow-inner flex flex-col gap-y-3 overflow-hidden">
                {/* Baris Atas: Port Ganjil (1, 3, 5, ... ) */}
                <div 
                    className="grid gap-[3px] mr-2" 
                    style={{ gridTemplateColumns: `repeat(${halfPorts}, minmax(0, 1fr))` }}
                >
                    {Array.from({ length: halfPorts }).map((_, col) => {
                        const portNum = col * 2 + 1;
                        const pInfo = resolvePortData(portNum);
                        return <NodePortItem key={`p-odd-${portNum}`} portNum={portNum} isTopRow={true} {...pInfo} />;
                    })}
                </div>

                {/* Baris Bawah: Port Genap (2, 4, 6, ... ) */}
                <div 
                    className="grid gap-[3px] ml-2" 
                    style={{ gridTemplateColumns: `repeat(${halfPorts}, minmax(0, 1fr))` }}
                >
                    {Array.from({ length: halfPorts }).map((_, col) => {
                        const portNum = (col + 1) * 2;
                        const pInfo = resolvePortData(portNum);
                        return <NodePortItem key={`p-even-${portNum}`} portNum={portNum} isTopRow={false} {...pInfo} />;
                    })}
                </div>
            </div>
        </div>
    );
}
