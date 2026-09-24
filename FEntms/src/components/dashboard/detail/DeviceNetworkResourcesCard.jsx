import React from 'react';

export default function DeviceNetworkResourcesCard({ isPowerDevice, isNvr, snmpData, vendorMetrics }) {
    if (isPowerDevice || isNvr) return null;

    const res = vendorMetrics?.resources || {};
    const cpuVal = res.cpu || snmpData?.cpu || '-';
    const ramVal = res.memory || snmpData?.memory || '-';
    const voltVal = res.voltage ? `${res.voltage}V` : null;
    const tempVal = res.temperature ? `${res.temperature}°C` : null;
    const thirdMetricLabel = res.voltage ? 'VOLT' : res.temperature ? 'SUHU' : 'DISK';
    const thirdMetricVal = voltVal || tempVal || (snmpData ? snmpData.storage : '-');

    return (
        <div className="space-y-3">
            {/* Hardware Resource */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-950/40 border border-slate-800/50 p-2.5 rounded-lg text-center opacity-80 hover:opacity-100 hover:border-slate-600/50 transition-all duration-300">
                    <span className="text-slate-500 block text-[8px] font-bold tracking-wider mb-1">CPU</span>
                    <span className="text-slate-400 font-mono text-[11px] font-semibold">{cpuVal}</span>
                </div>
                <div className="bg-slate-950/40 border border-slate-800/50 p-2.5 rounded-lg text-center opacity-80 hover:opacity-100 hover:border-slate-600/50 transition-all duration-300">
                    <span className="text-slate-500 block text-[8px] font-bold tracking-wider mb-1">RAM</span>
                    <span className="text-slate-400 font-mono text-[11px] font-semibold">{ramVal}</span>
                </div>
                <div className="bg-slate-950/40 border border-slate-800/50 p-2.5 rounded-lg text-center opacity-80 hover:opacity-100 hover:border-slate-600/50 transition-all duration-300">
                    <span className="text-slate-500 block text-[8px] font-bold tracking-wider mb-1">{thirdMetricLabel}</span>
                    <span className="text-slate-400 font-mono text-[11px] font-semibold">{thirdMetricVal}</span>
                </div>
            </div>

            {/* Network & Interface Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="group bg-slate-950/50 border border-slate-800/60 p-3.5 rounded-xl hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300">
                    <span className="text-slate-500 text-[9px] font-bold tracking-wider block mb-1.5 group-hover:text-emerald-500/70 transition-colors">TRAFFIC IN</span>
                    <span className="text-emerald-400 font-mono text-sm font-bold block">{snmpData ? snmpData.networkTraffic?.in : '-'}</span>
                </div>
                <div className="group bg-slate-950/50 border border-slate-800/60 p-3.5 rounded-xl hover:border-rose-500/30 hover:bg-rose-500/5 transition-all duration-300">
                    <span className="text-slate-500 text-[9px] font-bold tracking-wider block mb-1.5 group-hover:text-rose-500/70 transition-colors">TRAFFIC OUT</span>
                    <span className="text-rose-400 font-mono text-sm font-bold block">{snmpData ? snmpData.networkTraffic?.out : '-'}</span>
                </div>
                <div className="group bg-slate-950/50 border border-slate-800/60 p-3.5 rounded-xl hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300">
                    <span className="text-slate-500 text-[9px] font-bold tracking-wider block mb-1.5 group-hover:text-blue-500/70 transition-colors">UDP PKTS</span>
                    <span className="text-blue-300 font-mono text-sm font-bold block">{snmpData ? snmpData.udpDatagrams : '-'}</span>
                </div>
                <div className="group bg-slate-950/50 border border-slate-800/60 p-3.5 rounded-xl hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-300">
                    <span className="text-slate-500 text-[9px] font-bold tracking-wider block mb-1.5 group-hover:text-indigo-500/70 transition-colors">INTERFACES</span>
                    <span className="text-indigo-300 font-mono text-sm font-bold block">{snmpData ? snmpData.totalInterfaces : '-'}</span>
                </div>
            </div>
        </div>
    );
}
