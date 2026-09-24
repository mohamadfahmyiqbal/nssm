import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { showToast } from '../../utils/swal';
import { FileSpreadsheet, FileText, ShieldCheck, Activity, Terminal } from 'lucide-react';
import api from '../../services/api';
import { generateIncidentReportPDF } from '../../utils/incidentReportGenerator';

export default function ReportsView() {
    const [activeTab, setActiveTab] = useState('sla'); // 'sla' | 'logs'
    const [logsData, setLogsData] = useState([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    const [reportData, setReportData] = useState([]);
    const [isLoadingSLA, setIsLoadingSLA] = useState(false);

    useEffect(() => {
        if (activeTab === 'logs') {
            fetchLogs();
        } else if (activeTab === 'sla') {
            fetchSLA();
        }
    }, [activeTab]);

    const fetchSLA = async () => {
        setIsLoadingSLA(true);
        try {
            const res = await api.get('/reports/sla');
            if (res.data.success) {
                setReportData(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch SLA report:', error);
            showToast('error', 'Gagal memuat laporan SLA.');
        } finally {
            setIsLoadingSLA(false);
        }
    };

    const fetchLogs = async () => {
        setIsLoadingLogs(true);
        try {
            const res = await api.get('/logs');
            if (res.data.success) {
                setLogsData(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            showToast('error', 'Gagal memuat riwayat log.');
        } finally {
            setIsLoadingLogs(false);
        }
    };

    // 1. Export Data ke Excel (.xlsx)
    const handleExportExcel = () => {
        try {
            let formattedData = [];
            let sheetName = '';
            
            if (activeTab === 'sla') {
                formattedData = reportData.map((item) => ({
                    'Device Name': item.device,
                    'IP Address': item.ip,
                    'Vendor': item.vendor,
                    'SLA Uptime (%)': item.sla,
                    'Total Incidents': item.incidents,
                    'Downtime Duration': item.downtime,
                    'Health Status': item.status,
                }));
                sheetName = 'SLA_Report';
            } else {
                formattedData = logsData.map((item) => ({
                    'Waktu': new Date(item.createdAt).toLocaleString('id-ID'),
                    'Hostname': item.HOSTNAME,
                    'Status Lama': item.PREVIOUS_STATUS,
                    'Status Baru': item.NEW_STATUS,
                    'Metode': item.METHOD,
                    'Latency (ms)': item.LATENCY,
                }));
                sheetName = 'Activity_Logs';
            }

            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

            XLSX.writeFile(workbook, `NTMS_${sheetName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
            showToast('success', 'Laporan Excel berhasil diunduh.');
        } catch (err) {
            showToast('error', 'Gagal mengekspor laporan ke Excel.');
        }
    };

    // 2. Export Data ke PDF (.pdf)
    const handleExportPDF = () => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(16);
            
            if (activeTab === 'sla') {
                doc.text('NTMS - Network SLA & Incident Report', 14, 15);
                doc.setFontSize(10);
                doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} | Cikampek Location`, 14, 22);

                const tableHeaders = [['Device Name', 'IP Address', 'Vendor', 'SLA Uptime', 'Incidents', 'Downtime', 'Status']];
                const tableRows = reportData.map((item) => [
                    item.device, item.ip, item.vendor, item.sla, item.incidents, item.downtime, item.status
                ]);

                autoTable(doc, {
                    startY: 28,
                    head: tableHeaders,
                    body: tableRows,
                    theme: 'grid',
                    headStyles: { fillColor: [30, 41, 59] },
                    styles: { fontSize: 8 },
                });
                doc.save(`NTMS_SLA_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
            } else {
                doc.text('NTMS - Device Activity Logs', 14, 15);
                doc.setFontSize(10);
                doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

                const tableHeaders = [['Waktu', 'Hostname', 'Status Lama', 'Status Baru', 'Metode', 'Latency']];
                const tableRows = logsData.map((item) => [
                    new Date(item.createdAt).toLocaleString('id-ID'),
                    item.HOSTNAME || '-',
                    item.PREVIOUS_STATUS,
                    item.NEW_STATUS,
                    item.METHOD,
                    `${item.LATENCY} ms`
                ]);

                autoTable(doc, {
                    startY: 28,
                    head: tableHeaders,
                    body: tableRows,
                    theme: 'grid',
                    headStyles: { fillColor: [30, 41, 59] },
                    styles: { fontSize: 8 },
                });
                doc.save(`NTMS_Logs_${new Date().toISOString().slice(0, 10)}.pdf`);
            }
            showToast('success', 'Laporan PDF berhasil diunduh.');
        } catch (err) {
            showToast('error', 'Gagal mengekspor laporan ke PDF.');
        }
    };

    return (
        <div className="flex-1 flex flex-col gap-5 p-2 font-sans">
            {/* Top Header & Export Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-6">
                    <div>
                        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-blue-400" />
                            <span>Reports & Logs</span>
                        </h2>
                        <p className="text-xs text-slate-400 font-mono">
                            Pantau performa dan riwayat aktivitas jaringan
                        </p>
                    </div>

                    <div className="h-10 w-px bg-slate-800 hidden sm:block"></div>

                    {/* Tab Navigation */}
                    <div className="flex items-center bg-slate-950/50 p-1 rounded-xl border border-slate-800/80">
                        <button
                            onClick={() => setActiveTab('sla')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'sla' 
                                ? 'bg-blue-600 text-white shadow-lg' 
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                        >
                            <Activity className="w-4 h-4" />
                            <span>SLA Reports</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'logs' 
                                ? 'bg-indigo-600 text-white shadow-lg' 
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                        >
                            <Terminal className="w-4 h-4" />
                            <span>Activity Logs</span>
                        </button>
                    </div>
                </div>

                {/* Action Export Buttons */}
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    <button
                        onClick={() => generateIncidentReportPDF({
                            hostname: 'PILIH_DARI_DAFTAR',
                            complaint: 'Laporan insiden / anomali perangkat IT',
                            sourceType: 'monitoring'
                        })}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-950/60 border border-purple-600/50 text-purple-300 rounded-xl hover:bg-purple-900/60 font-bold transition-all shadow-lg"
                        title="Unduh Formulir Template Kosong Laporan Penanganan Gangguan"
                    >
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span>FORM GANGGUAN PDF</span>
                    </button>

                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-3.5 py-2 bg-emerald-950/50 border border-emerald-700/60 text-emerald-400 rounded-xl hover:bg-emerald-900/60 font-bold transition-all shadow-lg"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>EXPORT EXCEL</span>
                    </button>

                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-3.5 py-2 bg-rose-950/50 border border-rose-700/60 text-rose-400 rounded-xl hover:bg-rose-900/60 font-bold transition-all shadow-lg"
                    >
                        <FileText className="w-4 h-4" />
                        <span>EXPORT PDF</span>
                    </button>
                </div>
            </div>

            {/* Datatable Area */}
            <div className="bg-slate-900/40 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl flex-1 flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs">
                        <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
                            {activeTab === 'sla' ? (
                                <tr>
                                    <th className="px-5 py-4 font-semibold tracking-wider">Device Name</th>
                                    <th className="px-5 py-4 font-semibold tracking-wider">IP Address</th>
                                    <th className="px-5 py-4 font-semibold tracking-wider">Vendor</th>
                                    <th className="px-5 py-4 font-semibold tracking-wider">SLA Uptime</th>
                                    <th className="px-5 py-4 font-semibold tracking-wider text-center">Incidents</th>
                                    <th className="px-5 py-4 font-semibold tracking-wider">Downtime</th>
                                    <th className="px-5 py-4 font-semibold tracking-wider text-center">Status</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th className="px-4 py-3">Waktu Kejadian</th>
                                    <th className="px-4 py-3">Hostname</th>
                                    <th className="px-4 py-3 text-center">Status Transisi</th>
                                    <th className="px-4 py-3">Metode Polling</th>
                                    <th className="px-4 py-3 text-right">Latency</th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
                            {activeTab === 'sla' ? (
                                isLoadingSLA ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-slate-500 animate-pulse">
                                            Memuat Laporan SLA...
                                        </td>
                                    </tr>
                                ) : reportData.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                                            Tidak ada data perangkat.
                                        </td>
                                    </tr>
                                ) : (
                                    reportData.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                                            <td className="px-4 py-3 font-bold text-slate-100">{row.device}</td>
                                            <td className="px-4 py-3 text-slate-400">{row.ip}</td>
                                            <td className="px-4 py-3 text-slate-300">{row.vendor}</td>
                                            <td className="px-4 py-3 text-emerald-400 font-bold">{row.sla}</td>
                                            <td className="px-4 py-3 text-slate-300 text-center">{row.incidents} kali</td>
                                            <td className="px-4 py-3 text-slate-400">{row.downtime}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${row.status === 'Optimal'
                                                            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                                                            : row.status === 'Warning'
                                                                ? 'bg-amber-950/60 border-amber-800 text-amber-400'
                                                                : 'bg-rose-950/60 border-rose-800 text-rose-400'
                                                        }`}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : (
                                isLoadingLogs ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-slate-500 animate-pulse">
                                            Memuat histori log...
                                        </td>
                                    </tr>
                                ) : logsData.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                            Belum ada histori perubahan status.
                                        </td>
                                    </tr>
                                ) : (
                                    logsData.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                                            <td className="px-4 py-3 text-slate-400">{new Date(log.createdAt).toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-3 font-bold text-indigo-300">{log.HOSTNAME || '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.PREVIOUS_STATUS === 'UP' ? 'bg-emerald-900/50 text-emerald-400' : log.PREVIOUS_STATUS === 'DOWN' ? 'bg-rose-900/50 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>{log.PREVIOUS_STATUS}</span>
                                                    <span className="text-slate-500">→</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.NEW_STATUS === 'UP' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400'}`}>{log.NEW_STATUS}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 text-[10px]">{log.METHOD}</td>
                                            <td className="px-4 py-3 text-right text-slate-400">{log.LATENCY} ms</td>
                                        </tr>
                                    ))
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}