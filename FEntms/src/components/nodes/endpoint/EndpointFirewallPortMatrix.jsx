import React from 'react';
import { Handle, Position } from 'reactflow';

/**
 * Matriks Port Firewall Multi-Vendor Dinamis
 * Mendukung:
 * 1. FortiGate 30-Port (16 GE RJ45 + 8 GE SFP + 4 10GE SFP+ + MGMT + HA)
 * 2. Standar Dinamis Berdasarkan Opsi Port (8, 10, 16, 24, 48 port) untuk Palo Alto, Cisco ASA/FTD, Sophos, MikroTik, dll.
 * 3. Fallback cerdas berdasarkan ports SNMP jika tersedia
 */
export default function EndpointFirewallPortMatrix({ ports, totalPortCount, vendor }) {
    const rawPortCount = parseInt(totalPortCount, 10);
    const vendorLower = String(vendor || '').toLowerCase();
    // Hanya gunakan layout khusus 30-port jika port eksplisit bernilai 30, atau belum diset dan vendor adalah FortiGate
    const isFortiGateSpecial = rawPortCount === 30 || (!rawPortCount && vendorLower.includes('forti'));

    // Helper pencocokan port interface dari telemetry SNMP
    const getPortData = (pNameTarget, pNumberAlt) => {
        if (!ports || !Array.isArray(ports)) return null;

        const target = String(pNameTarget).toLowerCase().trim();
        return ports.find(p => {
            if (!p) return false;
            const sName = String(p.shortName || '').toLowerCase().trim();
            const pName = String(p.name || '').toLowerCase().trim();

            if (sName === target || pName === target) return true;
            if (sName === `port${target}` || pName === `port${target}`) return true;
            if (sName === `ethernet${target}` || pName === `ethernet${target}`) return true;
            if (sName === `ge${target}` || pName === `gi${target}` || pName === `eth${target}`) return true;
            if (pNumberAlt && (sName === String(pNumberAlt) || sName === `port${pNumberAlt}` || sName === `eth${pNumberAlt}`)) return true;

            const match = pName.match(/(?:gi|fa|te|eth|ethernet|gigabitethernet|port|ge|wan|lan|internal)?([a-z0-9]+)$/i);
            if (match && match[1].toLowerCase() === target) return true;

            return false;
        });
    };

    const renderPortItem = (portLabel, pNameTarget, pNumberAlt = null, customBadge = null) => {
        const pData = getPortData(pNameTarget, pNumberAlt);
        let isUp = false;
        let portAlias = '';
        let portTrafficSummary = '';
        let portLoadColor = 'bg-slate-900 border-slate-700/80 hover:bg-slate-700';
        let portTextColor = 'text-slate-400';
        let portGlow = '';

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

        const portId = `fw-${String(portLabel).toLowerCase()}`;

        return (
            <div
                key={portId}
                className={`relative w-full aspect-square rounded-[3px] border transition-all group/port flex flex-col items-center justify-center ${isUp ? `${portLoadColor} ${portGlow} z-10` : portLoadColor}`}
                title={`Port ${portLabel}${portAlias} ${isUp ? '(UP' + portTrafficSummary + ')' : '(DOWN)'}`}
            >
                <span className={`text-[7px] font-mono select-none pointer-events-none leading-none ${portTextColor}`}>
                    {portLabel}
                </span>

                {customBadge && (
                    <span className="text-[5.5px] uppercase font-mono tracking-tighter text-slate-500 scale-75 leading-none">
                        {customBadge}
                    </span>
                )}

                {/* Handle Connectors Top & Bottom */}
                <Handle
                    type="target"
                    position={Position.Top}
                    id={`p-top-${portId}`}
                    isConnectable={true}
                    className="!w-full !h-full !min-w-0 !min-h-0 !border-0 !m-0 !transform-none !left-0 !top-0 !rounded-none !bg-transparent group-hover/port:!bg-orange-400/20 z-10"
                    style={{ position: 'absolute' }}
                />
                <Handle
                    type="source"
                    position={Position.Top}
                    id={`s-p-top-${portId}`}
                    isConnectable={true}
                    className="!w-full !h-full !min-w-0 !min-h-0 !border-0 !m-0 !transform-none !left-0 !top-0 !rounded-none !bg-transparent group-hover/port:!bg-orange-400/40 cursor-crosshair z-20"
                    style={{ position: 'absolute' }}
                />
                <Handle
                    type="target"
                    position={Position.Bottom}
                    id={`p-${portId}`}
                    isConnectable={true}
                    className="!w-full !h-full !min-w-0 !min-h-0 !border-0 !m-0 !transform-none !left-0 !top-0 !rounded-none !bg-transparent group-hover/port:!bg-orange-400/20 z-10"
                    style={{ position: 'absolute' }}
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    id={`s-p-${portId}`}
                    isConnectable={true}
                    className="!w-full !h-full !min-w-0 !min-h-0 !border-0 !m-0 !transform-none !left-0 !top-0 !rounded-none !bg-transparent group-hover/port:!bg-orange-400/40 cursor-crosshair z-20"
                    style={{ position: 'absolute' }}
                />
            </div>
        );
    };

    const upCount = ports && Array.isArray(ports)
        ? ports.filter(p => p && (p.status === 'up' || p.status === 'UP' || p.status === 1 || p.status === '1')).length
        : 0;

    // Parsing konfigurasi port modular jika bertipe JSON atau integer
    let modularConfig = null;
    let effectiveTotal = rawPortCount || (ports && ports.length > 0 ? ports.length : 16);

    try {
        if (typeof totalPortCount === 'string' && totalPortCount.trim().startsWith('{')) {
            modularConfig = JSON.parse(totalPortCount);
            effectiveTotal = (Number(modularConfig.rj45 || 0) + Number(modularConfig.sfp || 0) + Number(modularConfig.sfpPlus || 0) + Number(modularConfig.wan || 0) + Number(modularConfig.mgmt || 0) + Number(modularConfig.ha || 0));
        }
    } catch (e) {
        modularConfig = null;
    }

    // Jika bukan modular eksplisit tapi port 30 atau FortiGate default:
    if (!modularConfig && isFortiGateSpecial) {
        modularConfig = { rj45: 16, sfp: 8, sfpPlus: 4, wan: 2, mgmt: 1, ha: 1 };
    }

    // JIKA MENGGUNAKAN KONFIGURASI MODULAR DINAMIS
    if (modularConfig) {
        const { rj45 = 0, sfp = 0, sfpPlus = 0, wan = 0, mgmt = 0, ha = 0 } = modularConfig;
        const totalLanSfp = rj45 + sfp;
        const halfLanSfp = Math.ceil(totalLanSfp / 2);
        const displayVendorTitle = vendor ? `${vendor.toUpperCase()} INTERFACES` : 'FIREWALL INTERFACES';

        return (
            <div className="mt-3 px-1 font-sans">
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mb-1.5 uppercase tracking-wider">
                    <span>{displayVendorTitle} ({effectiveTotal} PORTS)</span>
                    {ports && (
                        <span className="text-orange-400 font-mono">
                            {upCount}/{ports.length} UP
                        </span>
                    )}
                </div>

                <div className="p-3 bg-slate-950/95 rounded-xl border border-slate-800/80 shadow-inner flex flex-col gap-y-3">
                    {/* 1. SEKSI GE RJ45 & SFP */}
                    {totalLanSfp > 0 && (
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[7.5px] font-mono text-slate-500 uppercase px-0.5">
                                {rj45 > 0 && <span>{rj45}x GE RJ45 (1-{rj45})</span>}
                                {sfp > 0 && <span className="text-cyan-400">{sfp}x GE SFP ({rj45 + 1}-{totalLanSfp})</span>}
                            </div>

                            {/* Baris Atas (Ganjil) */}
                            <div
                                className="grid gap-[3px] mr-1.5"
                                style={{ gridTemplateColumns: `repeat(${halfLanSfp}, minmax(0, 1fr))` }}
                            >
                                {Array.from({ length: halfLanSfp }).map((_, col) => {
                                    const pNum = col * 2 + 1;
                                    const isSfpPort = pNum > rj45;
                                    return renderPortItem(String(pNum), `port${pNum}`, pNum, isSfpPort ? 'sfp' : null);
                                })}
                            </div>

                            {/* Baris Bawah (Genap) */}
                            <div
                                className="grid gap-[3px] ml-1.5"
                                style={{ gridTemplateColumns: `repeat(${halfLanSfp}, minmax(0, 1fr))` }}
                            >
                                {Array.from({ length: halfLanSfp }).map((_, col) => {
                                    const pNum = (col + 1) * 2;
                                    if (pNum > totalLanSfp) return <div key={`empty-${col}`} />;
                                    const isSfpPort = pNum > rj45;
                                    return renderPortItem(String(pNum), `port${pNum}`, pNum, isSfpPort ? 'sfp' : null);
                                })}
                            </div>
                        </div>
                    )}

                    {/* 2. SEKSI KHUSUS: 10GE SFP+, WAN, dan MGMT/HA */}
                    {(sfpPlus > 0 || wan > 0 || mgmt > 0 || ha > 0) && (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3 text-[7.5px] font-mono">
                            {sfpPlus > 0 && (
                                <div className="flex-1">
                                    <span className="text-purple-400 font-bold block mb-1">
                                        {sfpPlus}x 10GE SFP+
                                    </span>
                                    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${sfpPlus}, minmax(0, 1fr))` }}>
                                        {Array.from({ length: sfpPlus }).map((_, idx) => {
                                            const label = `x${idx + 1}`;
                                            return renderPortItem(label, label, null, '10G');
                                        })}
                                    </div>
                                </div>
                            )}

                            {wan > 0 && (
                                <div className={`flex-1 ${sfpPlus > 0 ? 'border-l border-slate-800/80 pl-2' : ''}`}>
                                    <span className="text-amber-400 font-bold block mb-1">
                                        {wan}x WAN UPLINK
                                    </span>
                                    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${wan}, minmax(0, 1fr))` }}>
                                        {Array.from({ length: wan }).map((_, idx) => {
                                            const label = `WAN${idx + 1}`;
                                            return renderPortItem(label, `wan${idx + 1}`, null, 'wan');
                                        })}
                                    </div>
                                </div>
                            )}

                            {(mgmt > 0 || ha > 0) && (
                                <div className={`flex-1 ${(sfpPlus > 0 || wan > 0) ? 'border-l border-slate-800/80 pl-2' : ''}`}>
                                    <span className="text-emerald-400 font-bold block mb-1">
                                        CONTROL & CLUSTER
                                    </span>
                                    <div className="grid grid-cols-2 gap-1">
                                        {mgmt > 0 && renderPortItem('MGMT', 'mgmt', null, 'ctrl')}
                                        {ha > 0 && renderPortItem('HA', 'ha', null, 'clus')}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // SKENARIO B: Layout Dinamis Standar (Port 1 s/d N)
    const halfCount = Math.ceil(effectiveTotal / 2);
    const displayVendorTitle = vendor ? `${vendor.toUpperCase()} INTERFACES` : 'FIREWALL INTERFACES';

    return (
        <div className="mt-3 px-1 font-sans">
            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mb-1.5 uppercase tracking-wider">
                <span>{displayVendorTitle} (1-{effectiveTotal})</span>
                {ports && (
                    <span className="text-orange-400 font-mono">
                        {upCount}/{ports.length} UP
                    </span>
                )}
            </div>

            <div className="p-3 bg-slate-950/95 rounded-xl border border-slate-800/80 shadow-inner flex flex-col gap-y-3 overflow-hidden">
                {/* 1. Baris Port Data (1 s/d N) */}
                <div className="flex flex-col gap-1">
                    {/* Baris Atas: Port Ganjil (1, 3, 5, ... ) */}
                    <div
                        className="grid gap-[3px] mr-2"
                        style={{ gridTemplateColumns: `repeat(${halfCount}, minmax(0, 1fr))` }}
                    >
                        {Array.from({ length: halfCount }).map((_, col) => {
                            const portNum = col * 2 + 1;
                            return renderPortItem(String(portNum), `port${portNum}`, portNum);
                        })}
                    </div>

                    {/* Baris Bawah: Port Genap (2, 4, 6, ... ) */}
                    <div
                        className="grid gap-[3px] ml-2"
                        style={{ gridTemplateColumns: `repeat(${halfCount}, minmax(0, 1fr))` }}
                    >
                        {Array.from({ length: halfCount }).map((_, col) => {
                            const portNum = (col + 1) * 2;
                            if (portNum > effectiveTotal) return <div key={`empty-${col}`} />;
                            return renderPortItem(String(portNum), `port${portNum}`, portNum);
                        })}
                    </div>
                </div>

                {/* 2. Dedicated WAN & Control/Cluster (MGMT & HA) */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3 text-[7.5px] font-mono">
                    <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold uppercase tracking-wider">WAN:</span>
                        <div className="grid grid-cols-2 gap-1 w-24">
                            {renderPortItem('WAN1', 'wan1', null, 'wan')}
                            {renderPortItem('WAN2', 'wan2', null, 'wan')}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border-l border-slate-800/80 pl-3">
                        <span className="text-emerald-400 font-bold uppercase tracking-wider">CTRL:</span>
                        <div className="grid grid-cols-2 gap-1 w-24">
                            {renderPortItem('MGMT', 'mgmt', null, 'ctrl')}
                            {renderPortItem('HA', 'ha', null, 'clus')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
