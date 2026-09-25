import React from 'react';

export default function WorkOrderTimeScheduleFields({
    startTime,
    endTime,
    estimatedHours,
    targetDurationMinutes,
    onChange
}) {
    return (
        <div className="grid grid-cols-4 gap-2.5">
            <div>
                <label className="block text-slate-400 font-medium mb-1">Jam Mulai *</label>
                <input
                    type="time"
                    value={startTime || '08:00'}
                    onChange={(e) => {
                        const newStart = e.target.value;
                        let mins = Math.round((estimatedHours || 1) * 60);
                        if (endTime) {
                            const [sh, sm] = newStart.split(':').map(Number);
                            const [eh, em] = endTime.split(':').map(Number);
                            const diffMins = (eh * 60 + em) - (sh * 60 + sm);
                            if (diffMins > 0) mins = diffMins;
                        }
                        onChange({
                            startTime: newStart,
                            estimatedHours: Number((mins / 60).toFixed(2))
                        });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono [color-scheme:dark]"
                    required
                />
            </div>
            <div>
                <label className="block text-slate-400 font-medium mb-1">Jam Selesai *</label>
                <input
                    type="time"
                    value={endTime || '10:00'}
                    onChange={(e) => {
                        const newEnd = e.target.value;
                        let mins = Math.round((estimatedHours || 1) * 60);
                        if (startTime) {
                            const [sh, sm] = startTime.split(':').map(Number);
                            const [eh, em] = newEnd.split(':').map(Number);
                            const diffMins = (eh * 60 + em) - (sh * 60 + sm);
                            if (diffMins > 0) mins = diffMins;
                        }
                        onChange({
                            endTime: newEnd,
                            estimatedHours: Number((mins / 60).toFixed(2))
                        });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono [color-scheme:dark]"
                    required
                />
            </div>
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-400 font-medium">Durasi (Menit)</label>
                </div>
                <input
                    type="number"
                    step="1"
                    min="2"
                    value={Math.round((parseFloat(estimatedHours) || 0) * 60) || 30}
                    onChange={(e) => {
                        const mins = parseInt(e.target.value, 10) || 0;
                        let newEnd = endTime;
                        if (startTime && mins > 0) {
                            const [sh, sm] = startTime.split(':').map(Number);
                            const totalMins = sh * 60 + sm + mins;
                            const eh = Math.min(23, Math.floor(totalMins / 60));
                            const em = totalMins % 60;
                            newEnd = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
                        }
                        onChange({
                            endTime: newEnd,
                            estimatedHours: Number((mins / 60).toFixed(2))
                        });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    title="Alokasi durasi jam kerja teknisi (bisa disesuaikan)"
                />
            </div>
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-cyan-400 font-medium truncate" title="Durasi Target = Jumlah Perangkat x Total cycle_time_minutes task ITAM">
                        Durasi (Target)
                    </label>
                </div>
                <div className="w-full bg-cyan-950/40 border border-cyan-500/40 rounded-lg p-2 text-cyan-200 font-mono font-bold flex items-center justify-between shadow-inner">
                    <span>{targetDurationMinutes || 0}</span>
                    <span className="text-[10px] text-cyan-400 font-normal">Mnt ITAM</span>
                </div>
            </div>
        </div>
    );
}
