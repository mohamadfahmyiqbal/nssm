import React, { useState, useRef, useEffect } from 'react';
import { Activity, UserCheck, User, Search, ChevronDown, ChevronRight } from 'lucide-react';

export default function StageTriageImpact({
    reportForm,
    setReportForm,
    usersList = [],
    loadingUsers = false,
    onBack,
    onNext
}) {
    const [isTechDropdownOpen, setIsTechDropdownOpen] = useState(false);
    const [techSearchFilter, setTechSearchFilter] = useState('');
    const techDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (techDropdownRef.current && !techDropdownRef.current.contains(e.target)) {
                setIsTechDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedTechNames = (reportForm.assignedTechnician || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    const filteredUsers = usersList.filter(u => {
        if (!techSearchFilter.trim()) return true;
        const q = techSearchFilter.toLowerCase();
        return (
            (u.nama && u.nama.toLowerCase().includes(q)) ||
            (u.nik && String(u.nik).toLowerCase().includes(q)) ||
            (u.dept && u.dept.toLowerCase().includes(q))
        );
    });

    return (
        <div className="space-y-3 p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/70">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Tahap 2: Triage & Klasifikasi Dampak (Impact)
                </span>
                <span className="text-[10px] font-mono text-slate-500">Klasifikasi Severity</span>
            </div>

            <div className="space-y-3 text-xs font-mono">
                <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Keluhan Utama / Gejala Awal (Symptom):</label>
                    <textarea
                        rows={2}
                        placeholder="Contoh: Perangkat switch CCTV mati total, akses feed kamera terputus pada area Lantai 2..."
                        value={reportForm.symptom || ''}
                        onChange={(e) => setReportForm({ ...reportForm, symptom: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Dampak Layanan / Operasional (Impact):</label>
                    <textarea
                        rows={2}
                        placeholder="Contoh: Monitoring keamanan gedung blind spot pada 8 kamera CCTV..."
                        value={reportForm.impact || ''}
                        onChange={(e) => setReportForm({ ...reportForm, impact: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-blue-500"
                    />
                </div>

                {/* ATTACH TEKNISI PENANGGUNG JAWAB (BOOTSTRAP MULTISELECT STYLE) */}
                <div className="p-3 bg-slate-900/80 border border-amber-500/30 rounded-xl space-y-2 relative" ref={techDropdownRef}>
                    <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Tugaskan / Attach Teknisi Penangan (Multiselect):</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">
                            {selectedTechNames.length > 0 ? `${selectedTechNames.length} Teknisi Terpilih` : 'None Selected'}
                        </span>
                    </div>

                    {/* Bootstrap Multiselect Trigger Button */}
                    <div 
                        onClick={() => setIsTechDropdownOpen(!isTechDropdownOpen)}
                        className={`w-full min-h-[38px] bg-slate-950 border rounded-lg px-3 py-1.5 flex items-center justify-between cursor-pointer transition-all shadow-sm ${
                            isTechDropdownOpen 
                                ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-amber-500/10' 
                                : 'border-slate-700 hover:border-slate-600'
                        }`}
                    >
                        <div className="flex flex-wrap items-center gap-1.5 flex-1 pr-2">
                            {selectedTechNames.length === 0 ? (
                                <span className="text-xs text-slate-500 font-mono">-- Pilih Teknisi (Bisa Lebih Dari 1) --</span>
                            ) : (
                                selectedTechNames.map((name, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <User className="w-2.5 h-2.5 text-amber-400" />
                                        <span>{name}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updatedNames = selectedTechNames.filter((_, i) => i !== idx);
                                                const nList = (reportForm.assignedTechnicianNik || '')
                                                    .split(',')
                                                    .map(s => s.trim())
                                                    .filter(Boolean);
                                                const matchedUser = usersList.find(u => u.nama.toLowerCase() === name.toLowerCase());
                                                const updatedNiks = matchedUser 
                                                    ? nList.filter(nik => nik !== String(matchedUser.nik))
                                                    : nList;

                                                setReportForm({
                                                    ...reportForm,
                                                    assignedTechnician: updatedNames.join(', '),
                                                    assignedTechnicianNik: updatedNiks.join(', ')
                                                });
                                            }}
                                            className="text-amber-400 hover:text-rose-400 font-bold ml-0.5 leading-none"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))
                            )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isTechDropdownOpen ? 'rotate-180 text-amber-400' : ''}`} />
                    </div>

                    {/* Bootstrap Multiselect Popup Menu */}
                    {isTechDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
                            <div className="p-2 border-b border-slate-800 bg-slate-950/80 space-y-2">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama atau NIK teknisi..."
                                        value={techSearchFilter}
                                        onChange={(e) => setTechSearchFilter(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-xs outline-none focus:border-amber-500 font-mono"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const allNames = usersList.map(u => u.nama);
                                            const allNiks = usersList.map(u => String(u.nik));
                                            setReportForm({
                                                ...reportForm,
                                                assignedTechnician: allNames.join(', '),
                                                assignedTechnicianNik: allNiks.join(', ')
                                            });
                                        }}
                                        className="text-amber-400 hover:text-amber-300 font-bold"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReportForm({
                                                ...reportForm,
                                                assignedTechnician: '',
                                                assignedTechnicianNik: ''
                                            });
                                        }}
                                        className="text-slate-400 hover:text-slate-200"
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-52 overflow-y-auto custom-scrollbar p-1 divide-y divide-slate-800/40">
                                {loadingUsers ? (
                                    <div className="p-3 text-center text-xs text-slate-500 italic font-mono">
                                        Memuat data teknisi...
                                    </div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-slate-500 italic font-mono">
                                        Tidak ada teknisi yang cocok.
                                    </div>
                                ) : (
                                    filteredUsers.map(u => {
                                        const isSelected = selectedTechNames.map(n => n.toLowerCase()).includes(u.nama.toLowerCase());

                                        return (
                                            <label
                                                key={u.nik}
                                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs font-mono select-none ${
                                                    isSelected
                                                        ? 'bg-amber-950/50 text-amber-200 font-bold'
                                                        : 'hover:bg-slate-800/60 text-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            const currentNames = (reportForm.assignedTechnician || '')
                                                                .split(',')
                                                                .map(s => s.trim())
                                                                .filter(Boolean);
                                                            const currentNiks = (reportForm.assignedTechnicianNik || '')
                                                                .split(',')
                                                                .map(s => s.trim())
                                                                .filter(Boolean);

                                                            let newNames, newNiks;
                                                            if (isSelected) {
                                                                newNames = currentNames.filter(n => n.toLowerCase() !== u.nama.toLowerCase());
                                                                newNiks = currentNiks.filter(n => n !== String(u.nik));
                                                            } else {
                                                                newNames = [...currentNames, u.nama];
                                                                newNiks = [...currentNiks, String(u.nik)];
                                                            }

                                                            setReportForm({
                                                                ...reportForm,
                                                                assignedTechnician: newNames.join(', '),
                                                                assignedTechnicianNik: newNiks.join(', ')
                                                            });
                                                        }}
                                                        className="w-4 h-4 rounded border-slate-700 text-amber-500 bg-slate-950 focus:ring-amber-500 cursor-pointer accent-amber-500"
                                                    />
                                                    <div>
                                                        <span>{u.nama}</span>
                                                        <span className="text-[10px] text-slate-400 font-normal ml-2">NIK: {u.nik}</span>
                                                    </div>
                                                </div>
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-400 uppercase font-normal">
                                                    {u.role || 'TECH'}
                                                </span>
                                            </label>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    <p className="text-[9px] text-slate-400 italic">
                        * Teknisi terpilih akan otomatis tertera pada notifikasi MS Teams dan lembar pengesahan Berita Acara PDF.
                    </p>
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
                    <span>Lanjut ke Troubleshooting</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
