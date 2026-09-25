import React from 'react';
import {
    Coffee,
    XCircle,
    Clock,
    User,
    FileText,
    Trash2
} from 'lucide-react';

export default function ScheduleBreakModal({
    isOpen,
    editingBreak,
    formData,
    setFormData,
    technicians = [],
    onClose,
    onSubmit,
    onDelete
}) {
    if (!isOpen) return null;

    const handleSelectTech = (e) => {
        const nik = e.target.value;
        if (nik === 'ALL') {
            setFormData(prev => ({
                ...prev,
                technicianNik: 'ALL',
                technicianName: 'Semua Teknisi'
            }));
        } else {
            const tech = technicians.find(t => (t.nik || t.NIK) === nik);
            setFormData(prev => ({
                ...prev,
                technicianNik: nik,
                technicianName: tech ? (tech.nama || tech.NAMA) : ''
            }));
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Coffee className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-100 text-sm">
                                {editingBreak ? 'Edit Waktu Istirahat' : 'Tambah Waktu Istirahat Dinamis'}
                            </h3>
                            <p className="text-[11px] text-slate-400">
                                Atur jam istirahat kapan saja (bisa lebih dari 1 kali dalam 1 hari)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={onSubmit} className="p-5 flex flex-col gap-4 text-xs">
                    {/* Label / Nama Istirahat */}
                    <div>
                        <label className="block text-slate-400 font-medium mb-1">Nama / Keperluan Istirahat *</label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Istirahat Makan / Sholat / Coffee Break"
                            value={formData.label || ''}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    {/* Cakupan Teknisi */}
                    <div>
                        <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Cakupan Teknisi</span>
                        </label>
                        <select
                            value={formData.technicianNik || 'ALL'}
                            onChange={handleSelectTech}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                            <option value="ALL">🌐 Semua Teknisi (Global Tim)</option>
                            {technicians.map(t => {
                                const nik = t.nik || t.NIK;
                                const nama = t.nama || t.NAMA;
                                return (
                                    <option key={nik} value={nik}>
                                        👤 {nama} ({nik})
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Rentang Waktu */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Jam Mulai (08:00 - 17:00)</span>
                            </label>
                            <input
                                type="time"
                                required
                                value={formData.startTime || '12:00'}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Jam Selesai</span>
                            </label>
                            <input
                                type="time"
                                required
                                value={formData.endTime || '13:00'}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                            />
                        </div>
                    </div>

                    {/* Catatan Tambahan */}
                    <div>
                        <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>Catatan / Keterangan (Opsional)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Catatan tambahan..."
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    {/* Modal Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-2">
                        {editingBreak ? (
                            <button
                                type="button"
                                onClick={() => onDelete(editingBreak.id)}
                                className="px-3 py-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg transition-colors flex items-center gap-1.5 font-semibold"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                            </button>
                        ) : <div />}

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shadow-lg shadow-amber-600/20 transition-all flex items-center gap-1.5"
                            >
                                <Coffee className="w-3.5 h-3.5" />
                                <span>{editingBreak ? 'Simpan Perubahan' : 'Tetapkan Waktu Istirahat'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
