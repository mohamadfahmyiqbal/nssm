import React from 'react';
import { FileText, FileDown, Plus, Save, Archive } from 'lucide-react';

export default function IncidentHeaderToolbar({
    activeSubTab,
    setActiveSubTab,
    sendTeamsNotice,
    setSendTeamsNotice,
    handleSaveAndPublish,
    handleDownloadPDF,
    isLoading,
    selectedDevicesCount = 1
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            {/* Title Section */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-600/20 border border-purple-500/40 rounded-xl text-purple-400">
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                        <span>Manajemen Berita Acara & Laporan Gangguan IT</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                        Antrean Task Open, Pipeline 5-Tahap & Arsip Laporan
                    </p>
                </div>
            </div>

            {/* Sub Tab Switcher */}
            <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                <button
                    onClick={() => setActiveSubTab('create')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                        activeSubTab === 'create'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pipeline & Task Open</span>
                </button>
                <button
                    onClick={() => setActiveSubTab('archive')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                        activeSubTab === 'archive'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Monitoring & Arsip</span>
                </button>
            </div>

            {/* Action Buttons */}
            {activeSubTab === 'create' && (
                <div className="flex items-center gap-2.5">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono text-slate-300">
                        <input
                            type="checkbox"
                            checked={sendTeamsNotice}
                            onChange={(e) => setSendTeamsNotice(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-700 text-blue-600 bg-slate-900 cursor-pointer"
                        />
                        <span>Kirim ke MS Teams</span>
                    </label>

                    <button
                        onClick={handleSaveAndPublish}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all font-mono"
                        title="Simpan ke Database SQL Server"
                    >
                        <Save className="w-4 h-4" />
                        <span>SIMPAN ({selectedDevicesCount})</span>
                    </button>

                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all font-mono"
                        title="Hanya Unduh PDF tanpa Simpan"
                    >
                        <FileDown className="w-4 h-4" />
                        <span>PDF</span>
                    </button>
                </div>
            )}
        </div>
    );
}
