import React from 'react';
import { Camera, HardDrive } from 'lucide-react';

export default function DeviceNvrTelemetryCard({ isNvr, nvrSnmpData, vendorMetrics, detectedVendor, isLoadingNvrSnmp }) {
    if (!isNvr && !nvrSnmpData && !vendorMetrics?.isNvr) return null;

    const info = nvrSnmpData?.info || vendorMetrics?.info || {};
    const res = vendorMetrics?.resources || {};
    const hddList = nvrSnmpData?.hdd || vendorMetrics?.hdd || [];
    const camerasList = nvrSnmpData?.cameras || vendorMetrics?.cameras || [];

    return (
        <div className="mt-5 pt-4 border-t border-slate-700/50 space-y-3">
            <div className="text-[10px] font-bold text-teal-400 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-teal-500/10 px-2 py-1.5 rounded-lg border border-teal-500/20 shadow-sm">
                    <Camera className="w-3.5 h-3.5" /> <span>{(detectedVendor || 'NVR / CCTV').toUpperCase()} METRICS</span>
                </div>
                {isLoadingNvrSnmp && (
                    <div className="flex items-center gap-1.5 text-teal-300 bg-teal-500/10 px-2 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                )}
            </div>

            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 space-y-2.5 font-medium text-[11px] hover:border-slate-700/80 transition-colors">
                {info.model && (
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Model</span>
                        <span className="text-slate-200 font-mono font-bold">{info.model}</span>
                    </div>
                )}
                {info.serialNumber && (
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Serial Number</span>
                        <span className="text-slate-200 font-mono">{info.serialNumber}</span>
                    </div>
                )}
                {info.firmware && (
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Firmware</span>
                        <span className="text-slate-200">{info.firmware}</span>
                    </div>
                )}
                {info.userAccessCount && (
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">User Access Count</span>
                        <span className="text-blue-400 font-bold">{info.userAccessCount}</span>
                    </div>
                )}
                {(info.temperature || res.temperature) && (
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Temperature</span>
                        <span className="text-amber-400 font-bold">{(info.temperature || res.temperature)}°C</span>
                    </div>
                )}
                {info.fanStatus && info.fanStatus !== 'N/A' && (
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Fan Health</span>
                        <span className={`font-semibold ${info.fanStatus.includes('Normal') ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {info.fanStatus}
                        </span>
                    </div>
                )}
                {info.psuStatus && info.psuStatus !== 'N/A' && (
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Power Supply</span>
                        <span className={`font-semibold ${info.psuStatus.includes('Normal') ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {info.psuStatus}
                        </span>
                    </div>
                )}
                {info.raidStatus && info.raidStatus !== 'N/A' && (
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">RAID Status</span>
                        <span className={`font-semibold ${info.raidStatus.includes('Normal') ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {info.raidStatus}
                        </span>
                    </div>
                )}
                {info.recordingState && info.recordingState !== 'N/A' && (
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Recording</span>
                        <span className={`font-semibold ${info.recordingState === 'Recording' ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {info.recordingState}
                        </span>
                    </div>
                )}

                {/* Status HDD */}
                {hddList.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-slate-800/60">
                        <div className="text-[10px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                            <HardDrive className="w-3 h-3" /> Status HDD ({hddList.length} slot)
                        </div>
                        <div className="max-h-24 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                            {hddList.map((h, i) => (
                                <div key={i} className="flex justify-between items-center text-[10px] bg-slate-900/50 p-1.5 rounded">
                                    <span className="text-slate-400">HDD {i + 1}</span>
                                    <span className="text-emerald-400">{h.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Status Kamera */}
                {camerasList.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-slate-800/60">
                        <div className="text-[10px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                            <Camera className="w-3 h-3" /> Status Kamera ({camerasList.length})
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                            {camerasList.map((c, i) => (
                                <div key={i} title={`Kamera ${i + 1}: ${c.status}`} className={`h-2 rounded ${c.status === 'Connected' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
