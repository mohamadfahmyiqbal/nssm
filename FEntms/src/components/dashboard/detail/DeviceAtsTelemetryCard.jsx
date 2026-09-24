import React from 'react';

export default function DeviceAtsTelemetryCard({ isAts, vendorMetrics }) {
    if (!isAts) return null;

    const info = vendorMetrics?.info || {};
    const res = vendorMetrics?.resources || {};

    return (
        <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
            <div className="text-[10px] font-bold text-amber-400 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-amber-500/10 px-2 py-1.5 rounded-lg border border-amber-500/20 shadow-sm">
                    <span>RACK ATS TRANSFER TELEMETRY</span>
                </div>
            </div>
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 space-y-2.5 font-medium text-[11px]">
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">Selected Source</span>
                    <span className="text-amber-400 font-bold">{info.selectedSource || 'Source A (Primary)'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">Redundancy State</span>
                    <span className="text-emerald-400 font-bold">{info.redundancyStatus || 'Redundant (A & B OK)'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">Source A Status</span>
                    <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-slate-200">{info.powerSourceAStatus || 'Normal / OK'}</span>
                        {info.sourceAVoltage && <span className="text-slate-400 text-[10px]">({info.sourceAVoltage}V)</span>}
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">Source B Status</span>
                    <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-slate-200">{info.powerSourceBStatus || 'Normal / OK'}</span>
                        {info.sourceBVoltage && <span className="text-slate-400 text-[10px]">({info.sourceBVoltage}V)</span>}
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">Output Current</span>
                    <span className="text-blue-400 font-mono font-bold">{res.current || '0.0 A'}</span>
                </div>
            </div>
        </div>
    );
}
