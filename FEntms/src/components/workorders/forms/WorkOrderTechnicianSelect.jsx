import React from 'react';

export default function WorkOrderTechnicianSelect({
    assignedTechnicianNik,
    targetDate,
    teamMembers = [],
    technicians = [],
    onSelectTechnician,
    onChange
}) {
    return (
        <div className="flex flex-col gap-3">
            {/* PIC Utama & Tanggal Target */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-slate-400 font-medium mb-1">Teknisi Utama (PIC) *</label>
                    <select
                        value={assignedTechnicianNik}
                        onChange={onSelectTechnician}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                        required
                    >
                        <option value="">-- Pilih Teknisi Utama --</option>
                        {technicians.map(t => {
                            const techNik = t.nik || t.NIK;
                            const techNama = t.nama || t.NAMA;
                            return (
                                <option key={techNik} value={techNik}>
                                    {techNama} ({techNik})
                                </option>
                            );
                        })}
                    </select>
                </div>
                <div>
                    <label className="block text-slate-400 font-medium mb-1">Target Tanggal Pengerjaan</label>
                    <input
                        type="date"
                        value={targetDate || ''}
                        onChange={(e) => onChange({ targetDate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                    />
                </div>
            </div>

            {/* Anggota Tim Pendamping (Helper) */}
            <div>
                <label className="block text-slate-400 font-medium mb-1">
                    Anggota Tim Pendamping / Helper (Opsional)
                </label>
                <div className="bg-slate-950/80 border border-slate-700 rounded-lg p-2.5 max-h-28 overflow-y-auto flex flex-wrap gap-2">
                    {technicians.filter(t => (t.nik || t.NIK) !== assignedTechnicianNik).map(t => {
                        const tNik = t.nik || t.NIK;
                        const tName = t.nama || t.NAMA;
                        const isSelected = teamMembers.some(m => m.nik === tNik);

                        return (
                            <button
                                type="button"
                                key={tNik}
                                onClick={() => {
                                    if (isSelected) {
                                        onChange({ teamMembers: teamMembers.filter(m => m.nik !== tNik) });
                                    } else {
                                        onChange({ teamMembers: [...teamMembers, { nik: tNik, name: tName }] });
                                    }
                                }}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 border ${
                                    isSelected
                                        ? 'bg-blue-600/30 text-blue-200 border-blue-500/50 shadow-sm'
                                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-400' : 'bg-slate-600'}`} />
                                <span>{tName}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
