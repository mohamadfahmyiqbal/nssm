import React, { useState } from 'react';
import { HelpCircle, ChevronUp, ChevronDown, Activity, Cpu, Shield, Server, Camera, Monitor, Network } from 'lucide-react';

export default function TopologyLegend() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute top-6 left-6 z-20 w-72 bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl font-mono text-xs text-slate-300 transition-all duration-300">
            {/* Header Panel */}
            <div
                className={`flex items-center justify-between ${isOpen ? 'border-b border-slate-700/50 pb-3' : 'pb-0'} cursor-pointer group`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 text-slate-200 font-bold tracking-wide">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                        <HelpCircle className="w-4 h-4 text-blue-400" />
                    </div>
                    <span>TOPOLOGY LEGEND</span>
                </div>
                <button className="text-slate-400 group-hover:text-white bg-slate-800/30 group-hover:bg-slate-700/50 p-1.5 rounded-lg transition-all duration-300">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {isOpen && (
                <div className="mt-3 space-y-3 text-[11px]">
                    {/* Status Perangkat */}
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 mb-2 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                            <Activity className="w-3.5 h-3.5 text-emerald-400" /> DEVICE STATUS
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded border border-slate-800">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.7)] shrink-0"></span>
                                <span className="text-slate-200">Normal / Up</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded border border-slate-800">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.7)] animate-pulse shrink-0"></span>
                                <span className="text-slate-200">Warning / High</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded border border-slate-800">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse shrink-0"></span>
                                <span className="text-slate-200">Critical / Down</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded border border-slate-800">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#6B7280] shrink-0"></span>
                                <span className="text-slate-400">Offline / Unmanaged</span>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-800" />

                    {/* Heatmap Beban Port Switch */}
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 mb-2 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                            <Network className="w-3.5 h-3.5 text-sky-400" /> PORT HEATMAP (LOAD)
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800/80">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
                                    <span className="text-emerald-400 font-medium">Ringan / Normal</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono font-bold">&lt; 50%</span>
                            </div>
                            <div className="flex items-center justify-between bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800/80">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.8)]"></span>
                                    <span className="text-amber-400 font-medium">Beban Sedang</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono font-bold">50% - 80%</span>
                            </div>
                            <div className="flex items-center justify-between bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800/80">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded bg-[#EF4444] shadow-[0_0_6px_rgba(239,68,68,0.8)]"></span>
                                    <span className="text-rose-400 font-medium">Beban Kritis / Error</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono font-bold">&gt; 80%</span>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-800" />

                    {/* VLAN & Network Type */}
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                            <Shield className="w-3 h-3 text-purple-400" /> VLAN CATEGORY
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between bg-slate-900/60 px-2 py-1 rounded border border-slate-800/60">
                                <span className="text-emerald-400">LAN • VLAN 10</span>
                                <span className="text-[10px] text-slate-400">Core & Workstation</span>
                            </div>
                            <div className="flex items-center justify-between bg-slate-900/60 px-2 py-1 rounded border border-slate-800/60">
                                <span className="text-purple-400">CCTV • VLAN 20</span>
                                <span className="text-[10px] text-slate-400">Camera & NVR</span>
                            </div>
                            <div className="flex items-center justify-between bg-slate-900/60 px-2 py-1 rounded border border-slate-800/60">
                                <span className="text-amber-400">IOT • VLAN 30</span>
                                <span className="text-[10px] text-slate-400">Access Control</span>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-800" />

                    {/* Line / Link Type */}
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                            <Cpu className="w-3 h-3 text-blue-400" /> CONNECTION TYPES
                        </div>
                        <div className="space-y-1 text-[10px] text-slate-400">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 bg-blue-500"></div>
                                <span>Solid Link (Active / Primary)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 border-t border-dashed border-amber-400"></div>
                                <span>Dashed Link (Redundant / Backup)</span>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-800" />

                    {/* Device Types */}
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                            <Server className="w-3 h-3 text-indigo-400" /> DEVICE TYPES
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400">
                            <div className="flex items-center gap-2">
                                <Network className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Switch / Core</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Server className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Server / NVR</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Camera className="w-3.5 h-3.5 text-purple-400" />
                                <span>Kamera / CCTV</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Monitor className="w-3.5 h-3.5 text-blue-400" />
                                <span>Komputer / PC</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}