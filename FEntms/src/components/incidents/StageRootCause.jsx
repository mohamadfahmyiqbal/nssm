import React from 'react';
import { HelpCircle } from 'lucide-react';

const RCA_PRESETS = [
    'Kabel UTP / Fiber Optic Putus atau Tertekuk',
    'Port Switch Rusak / CRC Error Tinggi',
    'Power Supply Unit (PSU) / Adaptor Mati / Fluktuasi Daya',
    'Device Hang / Memory Leak (Perlu Hard Reboot)',
    'Broadcast Storm / Looping STP pada Switch Edge',
    'Konfigurasi VLAN / IP Address Konflik',
    'Overheating / Kipas Pendingin Perangkat Rusak'
];

export default function StageRootCause({
    reportForm,
    setReportForm,
    onBack
}) {
    return (
        <div className="space-y-3 p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/70">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-xs font-bold text-purple-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Tahap 5: Root Cause Analysis (RCA) & Tindak Lanjut
                </span>
                <span className="text-[10px] font-mono text-slate-500">Analisa Akar Masalah</span>
            </div>

            {/* Quick RCA Presets */}
            <div>
                <span className="text-[10px] text-slate-400 block mb-1.5">Pilih Rekomendasi Preset Akar Masalah:</span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                    {RCA_PRESETS.map((preset, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setReportForm({ ...reportForm, rootCause: preset })}
                            className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-purple-300 text-left transition-colors"
                        >
                            + {preset}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3 text-xs font-mono">
                <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Akar Penyebab Utama (Root Cause):</label>
                    <textarea
                        rows={2}
                        placeholder="Tuliskan analisa akar masalah kegagalan sistem..."
                        value={reportForm.rootCause || ''}
                        onChange={(e) => setReportForm({ ...reportForm, rootCause: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-purple-500"
                    />
                </div>

                <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Tindak Lanjut & Rekomendasi Pencegahan:</label>
                    <input
                        type="text"
                        placeholder="Contoh: Pengadaan unit adaptor cadangan & penambahan surge protector..."
                        value={reportForm.preventiveAction || ''}
                        onChange={(e) => setReportForm({ ...reportForm, preventiveAction: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-purple-500"
                    />
                </div>
            </div>

            <div className="flex justify-between pt-2">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono"
                >
                    ← Kembali
                </button>
                <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                    ✓ Siap Disimpan & Diterbitkan
                </span>
            </div>
        </div>
    );
}
