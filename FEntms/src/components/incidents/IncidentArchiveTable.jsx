import React, { useState, useMemo } from 'react';
import { 
    Archive, 
    RefreshCw, 
    FileDown, 
    Trash2, 
    Eye, 
    CheckCircle2, 
    Clock, 
    Activity, 
    ShieldAlert, 
    ChevronDown, 
    ChevronUp,
    Server,
    Wrench,
    HelpCircle,
    X
} from 'lucide-react';
import { generateIncidentReportPDF } from '../../utils/incidentReportGenerator';
import { useAuth } from '../../context/AuthContext';

export default function IncidentArchiveTable({
    archivedReports,
    archiveFilterStatus,
    setArchiveFilterStatus,
    fetchArchivedReports,
    handleUpdateStatus,
    handleDeleteArchive,
    isLoading
}) {
    const { canCloseIncident, canResolve, canDeleteArchive } = useAuth();
    const [selectedAuditReport, setSelectedAuditReport] = useState(null);

    // KPI Summary Monitoring
    const summary = useMemo(() => {
        const total = archivedReports.length;
        const open = archivedReports.filter(r => r.status === 'OPEN' || r.status === 'IN_PROGRESS').length;
        const resolved = archivedReports.filter(r => r.status === 'RESOLVED').length;
        const closed = archivedReports.filter(r => r.status === 'CLOSED').length;
        return { total, open, resolved, closed };
    }, [archivedReports]);

    return (
        <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
            {/* Header & Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-indigo-400" />
                    <div>
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                            Monitoring & Arsip Siklus Insiden IT
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono">
                            Audit Trail 5 Tahapan Penanganan Gangguan Perangkat
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={archiveFilterStatus}
                        onChange={(e) => setArchiveFilterStatus(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-1.5 outline-none font-mono"
                    >
                        <option value="ALL">Semua Status ({summary.total})</option>
                        <option value="IN_PROGRESS">Active / In Progress ({summary.open})</option>
                        <option value="RESOLVED">Resolved ({summary.resolved})</option>
                        <option value="CLOSED">Closed ({summary.closed})</option>
                    </select>

                    <button
                        onClick={fetchArchivedReports}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* KPI Monitoring Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Total Laporan:</span>
                    <span className="text-xs font-bold font-mono text-slate-200">{summary.total}</span>
                </div>
                <div className="p-2.5 bg-amber-950/20 border border-amber-900/40 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] text-amber-400 font-mono">In Progress:</span>
                    <span className="text-xs font-bold font-mono text-amber-300 animate-pulse">{summary.open}</span>
                </div>
                <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/40 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400 font-mono">Resolved:</span>
                    <span className="text-xs font-bold font-mono text-emerald-300">{summary.resolved}</span>
                </div>
                <div className="p-2.5 bg-indigo-950/20 border border-indigo-900/40 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] text-indigo-400 font-mono">Closed:</span>
                    <span className="text-xs font-bold font-mono text-indigo-300">{summary.closed}</span>
                </div>
            </div>

            {/* Table Arsip */}
            <div className="flex-1 overflow-x-auto">
                {archivedReports.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 font-mono text-xs">
                        Belum ada berita acara yang tersimpan di arsip database.
                    </div>
                ) : (
                    <table className="w-full text-left text-xs font-mono text-slate-300">
                        <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                            <tr>
                                <th className="p-3">No. Laporan</th>
                                <th className="p-3">Tanggal / Waktu</th>
                                <th className="p-3">Perangkat Terdampak</th>
                                <th className="p-3">Downtime</th>
                                <th className="p-3">Status Lifecycle</th>
                                <th className="p-3 text-right">Audit Trail & Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {archivedReports.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-3 font-bold text-amber-400">
                                        {item.reportNumber}
                                    </td>
                                    <td className="p-3 text-slate-400">
                                        {item.reportDate} <br />
                                        <span className="text-[10px] text-slate-500">{item.discoveredTime || '-'}</span>
                                    </td>
                                    <td className="p-3">
                                        <span className="font-bold text-slate-100">{item.primaryHostname}</span>
                                        <span className="text-[10px] text-cyan-400 block">{item.primaryIp}</span>
                                        {Array.isArray(item.devices) && item.devices.length > 1 && (
                                            <span className="text-[9px] text-slate-500 bg-slate-800 px-1 rounded">
                                                +{item.devices.length - 1} perangkat lainnya
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-slate-400">
                                        {item.totalDowntime || '-'}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            item.status === 'RESOLVED' || item.status === 'CLOSED'
                                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                                : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {/* Detail Audit Lifecycle Button */}
                                            <button
                                                onClick={() => setSelectedAuditReport(item)}
                                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded text-[10px] font-bold transition-colors flex items-center gap-1"
                                                title="Lihat Detail 5 Tahapan"
                                            >
                                                <Eye className="w-3 h-3" />
                                                <span>Audit 5-Tahap</span>
                                            </button>

                                            {/* Ubah Status Button */}
                                            {item.status !== 'CLOSED' && (
                                                item.status === 'RESOLVED' ? (
                                                    canCloseIncident ? (
                                                        <button
                                                            onClick={() => handleUpdateStatus(item.id, item.status)}
                                                            className="px-2 py-1 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800/60 rounded text-[10px] font-bold transition-colors"
                                                            title="SPV / Dept Head: Close Insiden"
                                                        >
                                                            Tutup (Close)
                                                        </button>
                                                    ) : (
                                                        <span className="text-[9px] font-mono text-slate-500 italic px-1" title="Menunggu Approval SPV/Dept Head">
                                                            Wait SPV
                                                        </span>
                                                    )
                                                ) : (
                                                    canResolve && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(item.id, item.status)}
                                                            className="px-2 py-1 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800/60 rounded text-[10px] font-bold transition-colors"
                                                            title="Teknisi: Selesaikan Insiden"
                                                        >
                                                            Resolve ✓
                                                        </button>
                                                    )
                                                )
                                            )}

                                            {/* Download PDF Button */}
                                            <button
                                                onClick={() => generateIncidentReportPDF({
                                                    reportNumber: item.reportNumber,
                                                    date: item.reportDate,
                                                    reporter: item.reporter,
                                                    discoveredTime: item.discoveredTime,
                                                    startTime: item.startTime,
                                                    endTime: item.endTime,
                                                    totalDowntime: item.totalDowntime,
                                                    finalStatus: item.status,
                                                    hostname: item.primaryHostname,
                                                    ip: item.primaryIp,
                                                    location: item.location,
                                                    assignedTechnician: item.assignedTechnician,
                                                    assignedTechnicianNik: item.assignedTechnicianNik,
                                                    devicesList: item.devices,
                                                    symptom: item.symptom,
                                                    impact: item.impact,
                                                    actionTaken: item.actionTaken,
                                                    rootCause: item.rootCause
                                                })}
                                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
                                                title="Download Berita Acara (PDF)"
                                            >
                                                <FileDown className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Delete Button (Khusus DEPT HEAD / ADMIN) */}
                                            {canDeleteArchive && (
                                                <button
                                                    onClick={() => handleDeleteArchive(item.id, item.reportNumber)}
                                                    className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded border border-rose-800/40 transition-colors"
                                                    title="Dept Head: Hapus Arsip"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* MODAL AUDIT TRAIL 5 TAHAP */}
            {selectedAuditReport && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
                            <div className="flex items-center gap-2.5">
                                <ShieldAlert className="w-5 h-5 text-indigo-400" />
                                <div>
                                    <h3 className="text-sm font-bold text-slate-100 font-mono">
                                        Audit Trail Lifecycle Insiden: {selectedAuditReport.reportNumber}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-mono">
                                        Rekam Jejak 5 Tahapan Penanganan Gangguan IT
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedAuditReport(null)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body: 5 Tahapan Timeline */}
                        <div className="p-4 overflow-y-auto space-y-3 font-mono text-xs custom-scrollbar">
                            {/* 1. Deteksi */}
                            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                                <div className="flex items-center justify-between text-rose-400 font-bold border-b border-slate-800/80 pb-1">
                                    <span className="flex items-center gap-1.5">
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        1. Deteksi Abnormality
                                    </span>
                                    <span className="text-[10px] text-slate-400">{selectedAuditReport.discoveredTime || '-'}</span>
                                </div>
                                <div className="text-slate-300 pt-1">
                                    Perangkat: <span className="text-white font-bold">{selectedAuditReport.primaryHostname}</span> ({selectedAuditReport.primaryIp}) <br />
                                    Lokasi: {selectedAuditReport.location || 'Server Room'} | Pelapor: {selectedAuditReport.reporter}
                                </div>
                            </div>

                            {/* 2. Triage & Dampak */}
                            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                                <div className="flex items-center justify-between text-amber-400 font-bold border-b border-slate-800/80 pb-1">
                                    <span className="flex items-center gap-1.5">
                                        <Activity className="w-3.5 h-3.5" />
                                        2. Triage & Klasifikasi Dampak
                                    </span>
                                </div>
                                <div className="text-slate-300 pt-1 space-y-0.5">
                                    <div><strong>Gejala:</strong> {selectedAuditReport.symptom || 'Anomali konektivitas node'}</div>
                                    <div><strong>Dampak:</strong> {selectedAuditReport.impact || 'Layanan terganggu'}</div>
                                    <div>
                                        <strong>Teknisi Ditugaskan:</strong>{' '}
                                        {selectedAuditReport.assignedTechnician ? (
                                            <span className="text-amber-300 font-bold">
                                                {selectedAuditReport.assignedTechnician}{' '}
                                                {selectedAuditReport.assignedTechnicianNik ? `(${selectedAuditReport.assignedTechnicianNik})` : ''}
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 italic">Belum ditentukan</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 3. Troubleshooting */}
                            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                                <div className="flex items-center justify-between text-blue-400 font-bold border-b border-slate-800/80 pb-1">
                                    <span className="flex items-center gap-1.5">
                                        <Wrench className="w-3.5 h-3.5" />
                                        3. Troubleshooting & Isolasi
                                    </span>
                                    <span className="text-[10px] text-slate-400">Mulai: {selectedAuditReport.startTime || '-'}</span>
                                </div>
                                <div className="text-slate-300 pt-1">
                                    Pemeriksaan konektivitas port, kabel, daya & pengujian jaringan.
                                </div>
                            </div>

                            {/* 4. Resolusi & Recovery */}
                            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                                <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800/80 pb-1">
                                    <span className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        4. Resolusi & Recovery
                                    </span>
                                    <span className="text-[10px] text-slate-400">Selesai: {selectedAuditReport.endTime || '-'} (Downtime: {selectedAuditReport.totalDowntime || '-'})</span>
                                </div>
                                <div className="text-slate-300 pt-1">
                                    <strong>Tindakan Perbaikan:</strong> {selectedAuditReport.actionTaken || 'Perangkat berhasil dipulihkan.'}
                                </div>
                            </div>

                            {/* 5. Root Cause Analysis (RCA) */}
                            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                                <div className="flex items-center justify-between text-purple-400 font-bold border-b border-slate-800/80 pb-1">
                                    <span className="flex items-center gap-1.5">
                                        <HelpCircle className="w-3.5 h-3.5" />
                                        5. Root Cause Analysis (RCA) & Pencegahan
                                    </span>
                                </div>
                                <div className="text-slate-300 pt-1 space-y-0.5">
                                    <div><strong>Akar Masalah:</strong> {selectedAuditReport.rootCause || 'Belum dianalisa spesifik'}</div>
                                    <div><strong>Status Final:</strong> <span className="text-emerald-400 font-bold">{selectedAuditReport.status}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-3 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950/70">
                            <button
                                onClick={() => setSelectedAuditReport(null)}
                                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-bold"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
