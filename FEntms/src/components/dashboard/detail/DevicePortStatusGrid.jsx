import React from 'react';

export default function DevicePortStatusGrid({ selectedDevice, snmpData, isLoadingSnmp, isPowerDevice }) {
    if (isPowerDevice) return null;

    const shouldShow =
        !selectedDevice.subType ||
        selectedDevice.subType === 'switch' ||
        selectedDevice.subType === 'firewall' ||
        selectedDevice.subType === 'router' ||
        selectedDevice.label?.toLowerCase().includes('sw') ||
        selectedDevice.label?.toLowerCase().includes('forti') ||
        selectedDevice.label?.toLowerCase().includes('fw') ||
        (snmpData?.ports && snmpData.ports.length > 0) ||
        (selectedDevice.ports && selectedDevice.ports.length > 0);

    if (!shouldShow) return null;

    let devicePortCount = 24;
    let modularConfig = null;
    const rawPort = selectedDevice.port || selectedDevice.PORT;
    try {
        if (typeof rawPort === 'string' && rawPort.startsWith('{')) {
            const p = JSON.parse(rawPort);
            modularConfig = p;
            devicePortCount = (Number(p.rj45 || 0) + Number(p.sfp || 0) + Number(p.sfpPlus || 0) + Number(p.wan || 0) + Number(p.mgmt || 0) + Number(p.ha || 0)) || 24;
        } else if (rawPort && typeof rawPort === 'object') {
            modularConfig = rawPort;
            devicePortCount = (Number(rawPort.rj45 || 0) + Number(rawPort.sfp || 0) + Number(rawPort.sfpPlus || 0) + Number(rawPort.wan || 0) + Number(rawPort.mgmt || 0) + Number(rawPort.ha || 0)) || 24;
        } else {
            devicePortCount = parseInt(rawPort, 10) || 24;
        }
    } catch {
        devicePortCount = parseInt(rawPort, 10) || 24;
    }

    const getPortMeta = (portNum) => {
        if (!modularConfig) return { type: 'GE', label: `${portNum}`, border: 'border-slate-800', text: 'text-slate-500' };
        
        const rj45 = Number(modularConfig.rj45 || 0);
        const sfp = Number(modularConfig.sfp || 0);
        const sfpPlus = Number(modularConfig.sfpPlus || 0);
        const wan = Number(modularConfig.wan || 0);
        const mgmt = Number(modularConfig.mgmt || 0);
        const ha = Number(modularConfig.ha || 0);

        if (portNum <= rj45) return { type: 'RJ45', typeName: 'GE RJ45', label: `${portNum}`, border: 'border-slate-800 bg-slate-900', text: 'text-slate-400' };
        let offset = rj45;
        if (portNum <= offset + sfp) return { type: 'SFP', typeName: 'GE SFP', label: `S${portNum - offset}`, border: 'border-cyan-500/60 bg-cyan-950/40', text: 'text-cyan-300' };
        offset += sfp;
        if (portNum <= offset + sfpPlus) return { type: 'SFP+', typeName: '10G SFP+', label: `10G${portNum - offset}`, border: 'border-purple-500/60 bg-purple-950/40', text: 'text-purple-300' };
        offset += sfpPlus;
        if (portNum <= offset + wan) return { type: 'WAN', typeName: 'WAN', label: `W${portNum - offset}`, border: 'border-amber-500/60 bg-amber-950/40', text: 'text-amber-300' };
        offset += wan;
        if (portNum <= offset + mgmt) return { type: 'MGMT', typeName: 'MGMT', label: `M${portNum - offset}`, border: 'border-blue-500/60 bg-blue-950/40', text: 'text-blue-300' };
        offset += mgmt;
        if (portNum <= offset + ha) return { type: 'HA', typeName: 'HA', label: `HA${portNum - offset}`, border: 'border-rose-500/60 bg-rose-950/40', text: 'text-rose-300' };
        return { type: 'GE', typeName: 'Port', label: `${portNum}`, border: 'border-slate-800', text: 'text-slate-500' };
    };

    const portsList = (snmpData?.ports && snmpData.ports.length > 0) ? snmpData.ports : Array.from({ length: devicePortCount });
    const upPortsCount = snmpData?.ports
        ? snmpData.ports.filter(p => p.status === 'up' || p.status === 'UP' || p.status === 1 || p.status === '1').length
        : null;

    return (
        <div className="bg-slate-950/50 border border-slate-800/60 p-3 rounded-xl shadow-inner mt-2">
            <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-[10px] font-bold tracking-wider">
                    PORT STATUS ({upPortsCount !== null ? `${upPortsCount}/${snmpData.ports.length} UP` : 'LIVE'})
                </span>
                {isLoadingSnmp && <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>}
            </div>

            {modularConfig && (
                <div className="flex flex-wrap gap-1 mb-2 text-[8px] font-mono">
                    {Number(modularConfig.rj45 || 0) > 0 && <span className="px-1 py-0.2 bg-slate-800 text-slate-300 rounded border border-slate-700">RJ45:{modularConfig.rj45}</span>}
                    {Number(modularConfig.sfp || 0) > 0 && <span className="px-1 py-0.2 bg-cyan-950/60 text-cyan-300 rounded border border-cyan-500/50">SFP:{modularConfig.sfp}</span>}
                    {Number(modularConfig.sfpPlus || 0) > 0 && <span className="px-1 py-0.2 bg-purple-950/60 text-purple-300 rounded border border-purple-500/50">SFP+:{modularConfig.sfpPlus}</span>}
                    {Number(modularConfig.wan || 0) > 0 && <span className="px-1 py-0.2 bg-amber-950/60 text-amber-300 rounded border border-amber-500/50">WAN:{modularConfig.wan}</span>}
                    {Number(modularConfig.mgmt || 0) > 0 && <span className="px-1 py-0.2 bg-blue-950/60 text-blue-300 rounded border border-blue-500/50">MGMT:{modularConfig.mgmt}</span>}
                    {Number(modularConfig.ha || 0) > 0 && <span className="px-1 py-0.2 bg-rose-950/60 text-rose-300 rounded border border-rose-500/50">HA:{modularConfig.ha}</span>}
                </div>
            )}

            <div className="grid grid-cols-12 gap-1 bg-slate-900/80 p-1.5 rounded-lg border border-slate-700/50 max-h-48 overflow-y-auto custom-scrollbar">
                {portsList.map((port, i) => {
                    const portNum = i + 1;
                    const meta = getPortMeta(portNum);
                    const isUp = port && typeof port === 'object'
                        ? (port.status === 'up' || port.status === 'UP' || port.status === 1 || port.status === '1')
                        : false;
                    const portName = port && typeof port === 'object'
                        ? String(port.shortName || port.name || port.index || meta.label)
                        : meta.label;
                    const aliasText = port?.alias ? ` [${port.alias}]` : '';
                    const fullTitle = port && typeof port === 'object' && port.name
                        ? `${port.name} (${meta.typeName || 'Port'})${aliasText}`
                        : `Port ${portNum} (${meta.typeName || 'Port'})`;

                    return (
                        <div
                            key={port?.index || i}
                            title={`${fullTitle} - ${isUp ? 'CONNECTED (UP)' : 'DISCONNECTED (DOWN)'}`}
                            className={`w-full aspect-square rounded-[3px] border transition-all hover:scale-110 cursor-pointer flex items-center justify-center ${
                                isUp
                                    ? 'bg-[#10B981] border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] z-10'
                                    : `${meta.border || 'bg-slate-900 border-slate-800'}`
                            }`}
                        >
                            <span className={`text-[7px] font-bold font-mono truncate px-0.5 ${isUp ? 'text-slate-950 font-black' : meta.text}`}>
                                {portName.replace(/^(GigabitEthernet|FastEthernet|TenGigabitEthernet|Gi|Fa|Te|Eth|Po|port)/i, (match) => match.toLowerCase() === 'port' ? 'p' : '')}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between mt-2.5 px-1 text-[9.5px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-[#10B981] border border-emerald-400 rounded-sm shadow-[0_0_4px_rgba(16,185,129,0.8)]"></div>
                    <span>Connected (Up)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-slate-900 border border-slate-700/80 rounded-sm"></div>
                    <span>Disconnected (Down)</span>
                </div>
            </div>
        </div>
    );
}
