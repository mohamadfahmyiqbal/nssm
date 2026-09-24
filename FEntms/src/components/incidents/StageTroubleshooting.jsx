import React from 'react';
import { Wrench, ChevronRight } from 'lucide-react';

export default function StageTroubleshooting({
    reportForm,
    setReportForm,
    onBack,
    onNext
}) {
    return (
        <div className="space-y-3 p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/70">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-xs font-bold text-blue-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    Tahap 3: Troubleshooting & Isolasi Masalah
                </span>
                <span className="text-[10px] font-mono text-slate-500">Langkah Teknis</span>
            </div>

            <div className="space-y-3 text-xs font-mono">
                <div>
                    <label className="text-[10px] text-slate-400 block mb-1">1. Cek Awal / Pengujian Konektivitas:</label>
                    <input
                        type="text"
                        placeholder="Contoh: Ping timeout 100%, cek LED port switch mati..."
                        value={reportForm.initialCheck || ''}
                        onChange={(e) => setReportForm({ ...reportForm, initialCheck: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                    />
                </div>

                <div>
                    <label className="text-[10px] text-slate-400 block mb-1">2. Diagnosa & Isolasi (Pengecekan Fisik/Logika):</label>
                    <input
                        type="text"
                        placeholder="Contoh: Tes kabel LAN tester normal, power adaptor switch terukur 0V..."
                        value={reportForm.diagnosis || ''}
                        onChange={(e) => setReportForm({ ...reportForm, diagnosis: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Mulai Penanganan (Waktu):</label>
                        <input
                            type="text"
                            value={reportForm.startTime || ''}
                            onChange={(e) => setReportForm({ ...reportForm, startTime: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Selesai Penanganan (Waktu):</label>
                        <input
                            type="text"
                            placeholder="Contoh: 14:30 WIB"
                            value={reportForm.endTime || ''}
                            onChange={(e) => setReportForm({ ...reportForm, endTime: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                        />
                    </div>
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
                <button
                    type="button"
                    onClick={onNext}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-bold"
                >
                    <span>Lanjut ke Resolusi & Recovery</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
