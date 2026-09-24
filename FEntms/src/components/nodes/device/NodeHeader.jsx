import React from 'react';
import { MapPin, Network } from 'lucide-react';

export default function NodeHeader({ data, badgeColor, iconBg, iconColor, isDown }) {
    return (
        <>
            {/* Header / Badges */}
            <div className="flex flex-wrap justify-between items-center gap-1.5 mb-3">
                <span className={`text-[9.5px] font-bold px-2.5 py-0.5 rounded-md border ${badgeColor} shadow-inner`}>
                    {data.vlan || 'LAN • VLAN 10'}
                </span>
                {data.rca?.isRootCause && (
                    <span className="text-[9.5px] text-rose-300 font-extrabold flex items-center gap-1 bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.4)]">
                        🔥 ROOT CAUSE ({data.rca.impactCount} DOWN)
                    </span>
                )}
                {data.rca?.classification === 'CASCADING_DOWN' && (
                    <span className="text-[9px] text-amber-300 font-semibold flex items-center gap-1 bg-amber-950/70 px-2 py-0.5 rounded-md border border-amber-600/60" title={`Terputus akibat parent switch down: ${data.rca.rootCauseDevice?.HOSTNAME || 'Uplink'}`}>
                        ⛓️ CASCADING
                    </span>
                )}
                {data.floor && (
                    <span className="text-[9.5px] text-slate-300 font-medium flex items-center gap-1 bg-slate-900/80 px-2.5 py-0.5 rounded-md border border-slate-700/50">
                        <MapPin className="w-3 h-3 text-blue-400" /> {data.floor}
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
            <div className="font-bold text-sm text-slate-100 tracking-wide break-words group-hover:text-blue-200 transition-colors px-2">
                {data.label}
            </div>

            {/* IP Address, MAC & Vendor Badge */}
            <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/50 tracking-tight select-all">
                    {data.ip}
                </span>
                {data.mac && data.mac !== '-' && (
                    <span className="text-[9.5px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 tracking-tight select-all">
                        {data.mac}
                    </span>
                )}
                {data.vendor && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80">
                        {data.vendor}
                    </span>
                )}
            </div>

            {/* Location Box */}
            {data.location && (
                <div className="text-[10px] text-blue-300/90 font-medium bg-blue-950/30 border border-blue-900/40 rounded-lg px-2.5 py-1 mt-2 whitespace-normal shadow-inner">
                    {data.location}
                </div>
            )}
        </>
    );
}
