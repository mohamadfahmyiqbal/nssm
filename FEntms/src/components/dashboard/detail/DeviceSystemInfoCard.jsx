import React from 'react';

export default function DeviceSystemInfoCard({ snmpData, vendorMetrics }) {
    if (!snmpData) return null;

    const info = vendorMetrics?.info || {};
    const model = info.model || snmpData.model;
    const serialNumber = info.serialNumber || snmpData.serialNumber;
    const fanStatus = info.fanStatus;
    const psuStatus = info.psuStatus;

    return (
        <div className="relative group overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 p-4 rounded-xl border border-slate-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="space-y-3 relative z-10">
                <div className="flex justify-between items-start gap-4">
                    <span className="text-slate-500 text-[10px] font-bold tracking-wider shrink-0 mt-0.5">SYS NAME</span>
                    <span className="text-blue-300 text-xs text-right font-semibold break-all leading-relaxed">{snmpData.sysName || '-'}</span>
                </div>
                {model && (
                    <div className="flex justify-between items-start gap-4 border-t border-slate-800/60 pt-3">
                        <span className="text-slate-500 text-[10px] font-bold tracking-wider shrink-0 mt-0.5">MODEL / CHASSIS</span>
                        <span className="text-emerald-300 text-xs text-right font-mono font-semibold">{model}</span>
                    </div>
                )}
                {serialNumber && (
                    <div className="flex justify-between items-start gap-4 border-t border-slate-800/60 pt-3">
                        <span className="text-slate-500 text-[10px] font-bold tracking-wider shrink-0 mt-0.5">SERIAL NUMBER</span>
                        <span className="text-slate-300 text-xs text-right font-mono">{serialNumber}</span>
                    </div>
                )}
                <div className="flex justify-between items-start gap-4 border-t border-slate-800/60 pt-3">
                    <span className="text-slate-500 text-[10px] font-bold tracking-wider shrink-0 mt-0.5">FIRMWARE</span>
                    <span className="text-slate-300 text-[11px] text-right break-words leading-relaxed">{snmpData.sysDescr || '-'}</span>
                </div>
                <div className="flex justify-between items-start gap-4 border-t border-slate-800/60 pt-3">
                    <span className="text-slate-500 text-[10px] font-bold tracking-wider shrink-0 mt-0.5">LOCATION</span>
                    <span className="text-slate-300 text-[11px] text-right">{snmpData.sysLocation || '-'}</span>
                </div>
                {/* Fan & PSU Health */}
                {(fanStatus || psuStatus) && (
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-800/60 pt-3">
                        {fanStatus && (
                            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-center">
                                <span className="text-slate-500 text-[8px] font-bold block mb-0.5">FAN HEALTH</span>
                                <span className={`text-[10px] font-bold ${fanStatus.includes('Normal') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {fanStatus}
                                </span>
                            </div>
                        )}
                        {psuStatus && (
                            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-center">
                                <span className="text-slate-500 text-[8px] font-bold block mb-0.5">POWER SUPPLY</span>
                                <span className={`text-[10px] font-bold ${psuStatus.includes('Normal') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {psuStatus}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
