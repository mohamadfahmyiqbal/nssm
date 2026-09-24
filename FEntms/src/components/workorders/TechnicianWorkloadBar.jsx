import React from 'react';
import { Users } from 'lucide-react';

export default function TechnicianWorkloadBar({ technicians, workloads, onSelectTechnician }) {
    return (
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3.5 shadow-lg flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Man Power Workload & Kapasitas Teknisi (Klik Kartu untuk Melihat Tugas)
                    </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                    {technicians.length} Teknisi Terdaftar
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
                {workloads.map(tech => (
                    <div 
                        key={tech.nik}
                        onClick={() => onSelectTechnician && onSelectTechnician(tech)}
                        title={`Klik untuk melihat daftar Work Order ${tech.name}`}
                        className={`p-2.5 rounded-lg border flex flex-col justify-between transition-all cursor-pointer hover:scale-[1.03] hover:shadow-lg ${
                            tech.activeTaskCount > 3
                                ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-400'
                                : tech.activeTaskCount > 0
                                    ? 'bg-blue-500/10 border-blue-500/30 hover:border-blue-400'
                                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-200 truncate group-hover:text-blue-400">{tech.name}</span>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                tech.activeTaskCount > 0 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'bg-slate-800 text-slate-400'
                            }`}>
                                {tech.activeTaskCount} Task
                            </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                            <span>Beban Waktu</span>
                            <span className="font-mono text-slate-200 font-semibold">{tech.totalEstimatedHours} Jam</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
