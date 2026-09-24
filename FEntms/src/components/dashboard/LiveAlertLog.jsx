import React, { useState, useEffect } from 'react';
import { AlertCircle, Minimize2, X, CheckCircle, ShieldAlert, Cpu, HardDrive, Thermometer, Activity, Sparkles, AlertTriangle, Layers, FileDown } from 'lucide-react';
import { getSmartAlertsFromDB, ackSmartAlertInDB, getLogSummaryFromDB } from '../../services/api';
import axios from 'axios';
import darkSwal, { showToast } from '../../utils/swal';
import { generateIncidentReportPDF } from '../../utils/incidentReportGenerator';

export default function LiveAlertLog({ onNavigateToIncidents }) {
    const [activeTab, setActiveTab] = useState('triage'); // 'triage' | 'smart' | 'down'
    const [smartAlerts, setSmartAlerts] = useState([]);
    const [downLogs, setDownLogs] = useState([]);
    const [triageData, setTriageData] = useState(null);
    const [triageWindow, setTriageWindow] = useState('24h');
    const [loading, setLoading] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);

    const fetchAllAlerts = async () => {
        try {
            const [resDown, resSmart, resTriage] = await Promise.all([
                axios.get('http://pik1com074.local.ikoito.co.id:5000/api/logs').catch(() => ({ data: { success: false } })),
                getSmartAlertsFromDB().catch(() => ({ success: false })),
                getLogSummaryFromDB(triageWindow).catch(() => ({ success: false }))
            ]);

            if (resDown.data?.success) {
                const activeDown = resDown.data.data
                    .filter(log => log.NEW_STATUS === 'DOWN' && !log.IS_ACKNOWLEDGED)
                    .slice(0, 15);
                setDownLogs(activeDown);
            }

            if (resSmart?.success && Array.isArray(resSmart.data)) {
                const unackSmart = resSmart.data
                    .filter(a => !a.IS_ACKNOWLEDGED)
                    .slice(0, 20);
                setSmartAlerts(unackSmart);
            }

            if (resTriage?.success && resTriage.data) {
                setTriageData(resTriage.data);
            }
        } catch (error) {
            console.error('Failed to fetch alert logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllAlerts();
        const interval = setInterval(fetchAllAlerts, 10000);
        return () => clearInterval(interval);
    }, [triageWindow]);

    const handleAckDown = (log) => {
        if (onNavigateToIncidents) {
            onNavigateToIncidents({
                id: `down-${log.id}`,
                logDbId: log.id,
                reportNumber: `INC-${Date.now().toString().slice(-6)}`,
                primaryHostname: log.HOSTNAME || log.PID || 'Device Down',
                primaryIp: log.IP || '-',
                symptom: `Perangkat terdeteksi DOWN / Offline. Pesan: ${log.MESSAGE || 'Node unreachable'}`,
                impact: 'Konektivitas terputus total / service outage.',
                priority: 'P1',
                discoveredTime: log.RECORDED_AT ? new Date(log.RECORDED_AT).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                reportDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                sourceType: 'LIVE_ANOMALY',
                location: log.LOCATION || log.FLOOR || '-'
            });
            showToast('info', `Mengarahkan ke Manajemen Insiden untuk ${log.HOSTNAME || log.PID}...`);
        }
    };

    const handleAckSmart = (alert) => {
        if (onNavigateToIncidents) {
            onNavigateToIncidents({
                id: `smart-${alert.id}`,
                alertDbId: alert.id,
                reportNumber: `ALERT-${alert.id}`,
                primaryHostname: alert.HOSTNAME || alert.PID || 'Unknown Host',
                primaryIp: alert.IP || '-',
                symptom: alert.MESSAGE || 'Terdeteksi anomali telemetri perangkat.',
                impact: 'Potensi degradasi performa jaringan / link flap.',
                priority: alert.SEVERITY === 'CRITICAL' ? 'P1' : 'P2',
                discoveredTime: alert.RECORDED_AT ? new Date(alert.RECORDED_AT).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                reportDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                sourceType: 'LIVE_ANOMALY',
                location: alert.LOCATION || alert.FLOOR || 'Server Room'
            });
            showToast('info', `Mengarahkan ke Manajemen Insiden untuk ${alert.HOSTNAME || alert.PID}...`);
        }
    };

    const getSeverityBadge = (severity) => {
        if (severity === 'CRITICAL') return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
        if (severity === 'WARNING') return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    };

    const getPriorityBadge = (p) => {
        if (p === 'P1') return 'bg-rose-950 text-rose-300 border border-rose-500 font-extrabold animate-pulse';
        if (p === 'P2') return 'bg-orange-950 text-orange-300 border border-orange-500/80 font-bold';
        if (p === 'P3') return 'bg-amber-950 text-amber-300 border border-amber-500/60 font-semibold';
        return 'bg-blue-950 text-blue-300 border border-blue-500/40';
    };

    const totalUnack = smartAlerts.length + downLogs.length;

    return (
        <div className={`absolute bottom-6 left-6 z-20 w-[420px] bg-slate-950/95 border border-slate-800/90 rounded-2xl p-3 shadow-2xl backdrop-blur-xl font-mono text-xs transition-all duration-300 ${isMinimized ? 'h-12 overflow-hidden' : ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2">
                <div className="flex items-center gap-2 text-slate-200 font-bold">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>SMART ALERT & TRIAGE</span>
                    {totalUnack > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold animate-pulse">
                            {totalUnack}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                    <Minimize2 
                        onClick={() => setIsMinimized(!isMinimized)} 
                        className="w-3.5 h-3.5 cursor-pointer hover:text-slate-300 transition-colors" 
                        title={isMinimized ? "Maximize" : "Minimize"}
                    />
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Tab Navigation */}
                    <div className="grid grid-cols-3 gap-1 mb-2.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                        <button
                            onClick={() => setActiveTab('triage')}
                            className={`py-1 text-[9.5px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                                activeTab === 'triage' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>Triage & Summary</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('smart')}
                            className={`py-1 text-[9.5px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                                activeTab === 'smart' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span>Anomali ML</span>
                            {smartAlerts.length > 0 && (
                                <span className="bg-rose-500 text-white text-[8px] px-1 rounded-full font-bold">
                                    {smartAlerts.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('down')}
                            className={`py-1 text-[9.5px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                                activeTab === 'down' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span>Device Down</span>
                            {downLogs.length > 0 && (
                                <span className="bg-rose-500 text-white text-[8px] px-1 rounded-full font-bold">
                                    {downLogs.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Alert List Content */}
                    <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                        {activeTab === 'triage' && (
                            <div className="space-y-2.5">
                                {triageData?.digest && (
                                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 space-y-1.5 shadow-inner">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Executive Digest ({triageWindow})</span>
                                            <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold ${
                                                triageData.digest.overallHealthStatus === 'HEALTHY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                triageData.digest.overallHealthStatus === 'DEGRADED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                            }`}>
                                                {triageData.digest.overallHealthStatus}
                                            </span>
                                        </div>
                                        <p className="text-[9.5px] text-slate-300 leading-relaxed font-sans">
                                            {triageData.digest.executiveNarrative}
                                        </p>
                                    </div>
                                )}

                                {(!triageData?.incidents || triageData.incidents.length === 0) && !loading && (
                                    <div className="text-slate-500 text-center py-4 text-[10px]">
                                        Tidak ada insiden yang memerlukan triage.
                                    </div>
                                )}

                                {triageData?.incidents?.map((inc) => (
                                    <div key={inc.incidentId} className="text-[10px] bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/90 hover:border-slate-700/80 transition-all space-y-1.5 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`px-1.5 py-0.2 rounded text-[8px] ${getPriorityBadge(inc.priority)}`}>
                                                    {inc.priority}
                                                </span>
                                                <span className="text-slate-200 font-bold truncate max-w-[170px]">
                                                    {inc.device?.hostname || 'Perangkat IT'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => generateIncidentReportPDF({
                                                        hostname: inc.device?.hostname || 'Perangkat IT',
                                                        ip: inc.device?.ip || '-',
                                                        vendor: inc.device?.vendor || '-',
                                                        deviceType: inc.device?.type || 'Network Node',
                                                        location: inc.device?.location || inc.device?.floor || '-',
                                                        complaint: `${inc.title}: ${inc.summary}`,
                                                        impact: `Perangkat mengalami ${inc.occurrences}x anomali/event dalam window triage.`,
                                                        rootCause: inc.rootCause || inc.summary,
                                                        recommendation: inc.recommendation,
                                                        finalStatus: 'TRIAGE / IN PROGRESS',
                                                        sourceType: 'monitoring'
                                                    })}
                                                    className="flex items-center gap-1 bg-purple-500/20 text-purple-300 hover:bg-purple-500/40 px-2 py-0.5 rounded text-[8.5px] font-mono font-bold transition-colors"
                                                    title="Unduh Formulir PDF Penanganan Gangguan"
                                                >
                                                    <FileDown className="w-3 h-3" />
                                                    <span>PDF</span>
                                                </button>
                                                <span className="text-slate-400 text-[8.5px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                                                    {inc.occurrences}x
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-slate-300 text-[9.5px] leading-tight">
                                            {inc.title}: {inc.summary}
                                        </p>
                                        <div className="text-[9px] text-blue-300/90 bg-blue-950/40 p-1.5 rounded border border-blue-900/40">
                                            <span className="font-bold text-blue-400">💡 Rekomendasi: </span>{inc.recommendation}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'smart' && (
                            <>
                                {smartAlerts.length === 0 && !loading && (
                                    <div className="text-slate-500 text-center py-4 text-[10px]">
                                        Tidak ada anomali atau threshold alert aktif.
                                    </div>
                                )}
                                {smartAlerts.map((alert) => (
                                    <div key={alert.id} className="flex items-start justify-between text-[10px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-colors">
                                        <div className="flex-1 pr-2">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${getSeverityBadge(alert.SEVERITY)}`}>
                                                    {alert.SEVERITY}
                                                </span>
                                                <span className="text-slate-300 font-bold truncate max-w-[150px]">
                                                    {alert.HOSTNAME || alert.PID}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-[9.5px] leading-tight mb-1">
                                                {alert.MESSAGE}
                                            </p>
                                            <span className="text-slate-600 text-[8.5px]">
                                                {new Date(alert.RECORDED_AT || alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                            <button
                                                onClick={() => generateIncidentReportPDF({
                                                    hostname: alert.HOSTNAME || alert.PID || 'Perangkat IT',
                                                    ip: alert.IP || '-',
                                                    vendor: alert.VENDOR || '-',
                                                    deviceType: alert.TYPE || 'Perangkat Jaringan',
                                                    location: alert.LOCATION || alert.FLOOR || '-',
                                                    complaint: alert.MESSAGE || 'Terdeteksi anomali performa / threshold telemetri.',
                                                    impact: `Status keparahan: ${alert.SEVERITY}. Memerlukan inspeksi teknis.`,
                                                    rootCause: alert.MESSAGE,
                                                    sourceType: 'monitoring'
                                                })}
                                                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg text-[9px] font-bold transition-colors"
                                                title="Unduh Laporan PDF"
                                            >
                                                <FileDown className="w-3 h-3" />
                                                <span>PDF</span>
                                            </button>
                                            <button
                                                onClick={() => handleAckSmart(alert)}
                                                className="flex items-center gap-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 px-2 py-1 rounded-lg text-[9px] font-bold transition-colors"
                                                title="Buat Berita Acara / Penanganan Gangguan"
                                            >
                                                <CheckCircle className="w-3 h-3" />
                                                <span>Ack & Proses</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {activeTab === 'down' && (
                            <>
                                {downLogs.length === 0 && !loading && (
                                    <div className="text-slate-500 text-center py-4 text-[10px]">
                                        Semua perangkat dalam keadaan normal / online.
                                    </div>
                                )}
                                {downLogs.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between text-[10px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-colors">
                                        <div className="flex-1">
                                            <span className="text-slate-500 block mb-0.5 text-[8.5px]">{new Date(log.createdAt).toLocaleString()}</span>
                                            <span className="text-slate-300 font-bold">{log.HOSTNAME || log.PID}</span>
                                            <span className="text-rose-400 font-bold ml-2">
                                                • {log.NEW_STATUS} ({log.METHOD})
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 ml-2">
                                            <button
                                                onClick={() => generateIncidentReportPDF({
                                                    hostname: log.HOSTNAME || log.PID || 'Perangkat IT',
                                                    ip: log.IP || '-',
                                                    complaint: `Perangkat mengalami status ${log.NEW_STATUS} saat polling metode ${log.METHOD}.`,
                                                    impact: 'Perangkat tidak merespons ping/SNMP dan layanan terputus.',
                                                    rootCause: `Koneksi putus (${log.METHOD} Unreachable).`,
                                                    sourceType: 'monitoring'
                                                })}
                                                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg text-[9px] font-bold transition-colors"
                                                title="Unduh Laporan PDF"
                                            >
                                                <FileDown className="w-3 h-3" />
                                                <span>PDF</span>
                                            </button>
                                            <button
                                                onClick={() => handleAckDown(log)}
                                                className="flex items-center gap-1 bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 px-2 py-1 rounded-lg text-[9px] font-bold transition-colors"
                                                title="Buat Berita Acara / Penanganan Gangguan"
                                            >
                                                <CheckCircle className="w-3 h-3" />
                                                <span>Ack & Proses</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}