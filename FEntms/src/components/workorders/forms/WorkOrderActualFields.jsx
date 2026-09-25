import React from 'react';

export default function WorkOrderActualFields({
    actualStartTime,
    actualEndTime,
    actualDurationMinutes,
    actualHours,
    completionNotes,
    remarks,
    onChange
}) {
    return (
        <div className="p-3 bg-slate-950/60 border border-emerald-500/30 rounded-xl flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Realisasi / Actual Pengerjaan Teknisi
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                    Isi saat/setelah pekerjaan selesai
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
                <div>
                    <label className="block text-slate-400 font-medium mb-1">Actual Mulai</label>
                    <input
                        type="time"
                        value={actualStartTime || ''}
                        onChange={(e) => {
                            const actStart = e.target.value;
                            let actMins = actualDurationMinutes || '';
                            if (actStart && actualEndTime) {
                                const [sh, sm] = actStart.split(':').map(Number);
                                const [eh, em] = actualEndTime.split(':').map(Number);
                                const diff = (eh * 60 + em) - (sh * 60 + sm);
                                if (diff > 0) actMins = diff;
                            }
                            onChange({
                                actualStartTime: actStart,
                                actualDurationMinutes: actMins,
                                actualHours: actMins ? Number((actMins / 60).toFixed(2)) : actualHours
                            });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-emerald-300 focus:outline-none focus:border-emerald-500 font-mono [color-scheme:dark]"
                    />
                </div>
                <div>
                    <label className="block text-slate-400 font-medium mb-1">Actual Selesai</label>
                    <input
                        type="time"
                        value={actualEndTime || ''}
                        onChange={(e) => {
                            const actEnd = e.target.value;
                            let actMins = actualDurationMinutes || '';
                            if (actualStartTime && actEnd) {
                                const [sh, sm] = actualStartTime.split(':').map(Number);
                                const [eh, em] = actEnd.split(':').map(Number);
                                const diff = (eh * 60 + em) - (sh * 60 + sm);
                                if (diff > 0) actMins = diff;
                            }
                            onChange({
                                actualEndTime: actEnd,
                                actualDurationMinutes: actMins,
                                actualHours: actMins ? Number((actMins / 60).toFixed(2)) : actualHours
                            });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-emerald-300 focus:outline-none focus:border-emerald-500 font-mono [color-scheme:dark]"
                    />
                </div>
                <div>
                    <label className="block text-slate-400 font-medium mb-1">Actual Durasi (Mnt)</label>
                    <input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="Contoh: 45"
                        value={actualDurationMinutes !== undefined && actualDurationMinutes !== null ? actualDurationMinutes : ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            const mins = val === '' ? '' : parseInt(val, 10);
                            onChange({
                                actualDurationMinutes: mins,
                                actualHours: mins !== '' && !isNaN(mins) ? Number((mins / 60).toFixed(2)) : ''
                            });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-emerald-300 font-bold focus:outline-none focus:border-emerald-500 font-mono"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                    <label className="block text-slate-400 font-medium mb-1">Catatan Penyelesaian / Temuan Lapangan</label>
                    <textarea
                        rows="2"
                        placeholder="Kondisi perangkat setelah pemeliharaan, kendala lapangan..."
                        value={completionNotes || ''}
                        onChange={(e) => onChange({ completionNotes: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label className="block text-slate-400 font-medium mb-1">Remarks (Keterangan / Catatan Khusus)</label>
                    <textarea
                        rows="2"
                        placeholder="Catatan tambahan, disposisi perizinan, instruksi khusus atau nomor referensi lanjutan..."
                        value={remarks || ''}
                        onChange={(e) => onChange({ remarks: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                </div>
            </div>
        </div>
    );
}
