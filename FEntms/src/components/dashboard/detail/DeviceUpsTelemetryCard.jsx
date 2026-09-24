import React from 'react';

export default function DeviceUpsTelemetryCard({ isUps, vendorMetrics }) {
    if (!isUps) return null;

    const info = vendorMetrics?.info || {};
    const res = vendorMetrics?.resources || {};

    return (
        <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
            <div className="text-[10px] font-bold text-emerald-400 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-emerald-500/10 px-2 py-1.5 rounded-lg border border-emerald-500/20 shadow-sm">
                    <span>UPS POWER & BATTERY TELEMETRY</span>
                </div>
            </div>
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 space-y-2.5 font-medium text-[11px]">
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">Output Status</span>
                    <span className="text-emerald-400 font-bold">{info.outputStatus || 'On Line (Inverter)'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">Battery Status</span>
                    <span className="text-slate-200 font-bold">{info.batteryStatus || 'Normal (Good)'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">Battery Capacity</span>
                    <span className="text-emerald-400 font-mono font-bold">{res.batteryCapacity || '100%'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">Estimated Runtime</span>
                    <span className="text-blue-400 font-mono font-bold">{res.runtimeRemaining || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">Battery Voltage</span>
                    <span className="text-slate-200 font-mono">{res.batteryVoltage ? `${res.batteryVoltage} VDC` : '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">Output Load</span>
                    <span className="text-amber-400 font-mono font-bold">{res.outputLoad ? `${res.outputLoad}%` : '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">Output Voltage</span>
                    <span className="text-slate-300 font-mono">
                        {res.outputVoltage || res.voltage ? `${res.outputVoltage || res.voltage} VAC` : '-'}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">Input Voltage (PLN)</span>
                    <span className="text-slate-300 font-mono">{res.inputVoltage ? `${res.inputVoltage} VAC` : '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">Input Frequency</span>
                    <span className="text-slate-300 font-mono">{res.inputFrequency ? `${res.inputFrequency} Hz` : '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">Battery Temperature</span>
                    <span className="text-slate-300 font-mono">
                        {res.temperature || res.batteryTemp ? `${res.temperature || res.batteryTemp}°C` : '-'}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">Battery Replace</span>
                    <span className={`font-semibold ${info.batteryReplace?.includes('Replace') ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {info.batteryReplace || 'OK (No Replace)'}
                    </span>
                </div>
                {info.lastTransferReason && (
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Last Transfer Cause</span>
                        <span className="text-slate-400 font-mono text-[10px] truncate max-w-[180px]" title={info.lastTransferReason}>
                            {info.lastTransferReason}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
