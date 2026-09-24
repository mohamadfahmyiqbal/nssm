import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Cpu, HardDrive, Thermometer, ArrowDownUp, RefreshCw } from 'lucide-react';
import { getDeviceTelemetryHistoryFromDB } from '../../services/api';

export default function DeviceTelemetryChart({ pid, ip, deviceType }) {
    const [timeRange, setTimeRange] = useState('24h');
    const [selectedMetric, setSelectedMetric] = useState('cpu'); // 'cpu' | 'ram' | 'temperature' | 'traffic'
    const [historyData, setHistoryData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchHistory = async () => {
        const targetId = pid || ip;
        if (!targetId) return;
        setIsLoading(true);
        try {
            const res = await getDeviceTelemetryHistoryFromDB(targetId, timeRange);
            if (res && res.success && Array.isArray(res.data)) {
                setHistoryData(res.data);
            } else {
                setHistoryData([]);
            }
        } catch (err) {
            console.error('Failed to load telemetry history:', err);
            setHistoryData([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [pid, ip, timeRange]);

    // Format & Calculate Metrics
    const chartStats = useMemo(() => {
        if (!historyData || historyData.length === 0) {
            return { points: [], min: 0, max: 100, avg: 0, current: 0, unit: '%' };
        }

        const points = historyData.map((item) => {
            let val = 0;
            if (selectedMetric === 'cpu') val = item.CPU_USAGE || 0;
            else if (selectedMetric === 'ram') val = item.RAM_USAGE || 0;
            else if (selectedMetric === 'temperature') val = item.TEMPERATURE || 0;
            else if (selectedMetric === 'traffic') {
                const totalBytes = (item.TRAFFIC_IN || 0) + (item.TRAFFIC_OUT || 0);
                val = +(totalBytes / (1024 * 1024)).toFixed(2); // in MB
            }

            const time = new Date(item.RECORDED_AT);
            const timeStr = timeRange === '1h' || timeRange === '24h'
                ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : `${time.getDate()}/${time.getMonth() + 1} ${time.getHours()}:00`;

            return { val, timeStr, rawDate: item.RECORDED_AT };
        });

        const values = points.map(p => p.val);
        const min = Math.min(...values);
        const max = Math.max(...values, selectedMetric === 'temperature' ? 50 : 10);
        const avg = +(values.reduce((a, b) => a + b, 0) / (values.length || 1)).toFixed(1);
        const current = values[values.length - 1] || 0;
        const unit = selectedMetric === 'temperature' ? '°C' : selectedMetric === 'traffic' ? 'MB' : '%';

        return { points, min, max, avg, current, unit };
    }, [historyData, selectedMetric, timeRange]);

    // SVG Polyline generator
    const svgPath = useMemo(() => {
        const { points, max } = chartStats;
        if (points.length < 2) return '';
        const width = 320;
        const height = 90;
        const padding = 8;

        const effectiveMax = max > 0 ? max : 100;
        const coords = points.map((p, idx) => {
            const x = padding + (idx / (points.length - 1)) * (width - padding * 2);
            const y = height - padding - (p.val / effectiveMax) * (height - padding * 2);
            return `${x},${y}`;
        });

        return coords.join(' ');
    }, [chartStats]);

    const getMetricColor = () => {
        switch (selectedMetric) {
            case 'cpu': return { stroke: '#38bdf8', fill: 'rgba(56,189,248,0.15)', text: 'text-sky-400' };
            case 'ram': return { stroke: '#a855f7', fill: 'rgba(168,85,247,0.15)', text: 'text-purple-400' };
            case 'temperature': return { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.15)', text: 'text-amber-400' };
            case 'traffic': return { stroke: '#10b981', fill: 'rgba(16,185,129,0.15)', text: 'text-emerald-400' };
            default: return { stroke: '#38bdf8', fill: 'rgba(56,189,248,0.15)', text: 'text-sky-400' };
        }
    };

    const color = getMetricColor();

    return (
        <div className="mt-4 pt-3.5 border-t border-slate-700/60 flex flex-col gap-3 font-sans">
            {/* Header / Time Filter */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-300">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                    <span>HISTORICAL TRENDS</span>
                </div>
                {/* Time Range Selector */}
                <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
                    {['1h', '24h', '7d', '30d'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setTimeRange(r)}
                            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-colors ${
                                timeRange === r
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {r.toUpperCase()}
                        </button>
                    ))}
                    <button
                        onClick={fetchHistory}
                        disabled={isLoading}
                        title="Refresh Data Historis"
                        className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                    >
                        <RefreshCw className={`w-2.5 h-2.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Metric Tabs */}
            <div className="grid grid-cols-4 gap-1.5">
                <button
                    onClick={() => setSelectedMetric('cpu')}
                    className={`flex flex-col items-center py-1.5 px-1 rounded-lg border text-[9.5px] font-medium transition-all ${
                        selectedMetric === 'cpu'
                            ? 'bg-sky-950/60 border-sky-500/50 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-900/60'
                    }`}
                >
                    <Cpu className="w-3 h-3 mb-0.5 text-sky-400" />
                    <span>CPU</span>
                </button>
                <button
                    onClick={() => setSelectedMetric('ram')}
                    className={`flex flex-col items-center py-1.5 px-1 rounded-lg border text-[9.5px] font-medium transition-all ${
                        selectedMetric === 'ram'
                            ? 'bg-purple-950/60 border-purple-500/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-900/60'
                    }`}
                >
                    <HardDrive className="w-3 h-3 mb-0.5 text-purple-400" />
                    <span>RAM</span>
                </button>
                <button
                    onClick={() => setSelectedMetric('temperature')}
                    className={`flex flex-col items-center py-1.5 px-1 rounded-lg border text-[9.5px] font-medium transition-all ${
                        selectedMetric === 'temperature'
                            ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-900/60'
                    }`}
                >
                    <Thermometer className="w-3 h-3 mb-0.5 text-amber-400" />
                    <span>SUHU</span>
                </button>
                <button
                    onClick={() => setSelectedMetric('traffic')}
                    className={`flex flex-col items-center py-1.5 px-1 rounded-lg border text-[9.5px] font-medium transition-all ${
                        selectedMetric === 'traffic'
                            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-900/60'
                    }`}
                >
                    <ArrowDownUp className="w-3 h-3 mb-0.5 text-emerald-400" />
                    <span>TRAFFIC</span>
                </button>
            </div>

            {/* Quick Stat Summary */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 text-[9px] font-mono">
                <div className="text-center">
                    <span className="text-slate-500 block text-[8px] font-bold">CURRENT</span>
                    <span className={`font-bold ${color.text}`}>{chartStats.current}{chartStats.unit}</span>
                </div>
                <div className="text-center border-x border-slate-800">
                    <span className="text-slate-500 block text-[8px] font-bold">AVG</span>
                    <span className="text-slate-300 font-bold">{chartStats.avg}{chartStats.unit}</span>
                </div>
                <div className="text-center">
                    <span className="text-slate-500 block text-[8px] font-bold">PEAK</span>
                    <span className="text-rose-400 font-bold">{chartStats.max > 0 ? chartStats.max : 0}{chartStats.unit}</span>
                </div>
            </div>

            {/* SVG Chart Visualization Area */}
            <div className="relative w-full h-[110px] bg-slate-950/90 rounded-xl border border-slate-800/80 p-2 flex items-center justify-center overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        <span>Mengambil data tren...</span>
                    </div>
                ) : chartStats.points.length < 2 ? (
                    <div className="text-slate-500 text-[10px] text-center font-medium">
                        Data historis belum tersedia untuk rentang {timeRange.toUpperCase()}.
                        <span className="block text-[8px] text-slate-600 mt-0.5">Polling otomatis sedang mencatat telemetri</span>
                    </div>
                ) : (
                    <svg className="w-full h-full" viewBox="0 0 320 90" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <line x1="8" y1="18" x2="312" y2="18" stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
                        <line x1="8" y1="45" x2="312" y2="45" stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
                        <line x1="8" y1="72" x2="312" y2="72" stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />

                        {/* Fill gradient area */}
                        <polygon
                            points={`8,82 ${svgPath} 312,82`}
                            fill={color.fill}
                        />

                        {/* Trend Line */}
                        <polyline
                            fill="none"
                            stroke={color.stroke}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={svgPath}
                        />
                    </svg>
                )}
            </div>

            {/* Timeline label hints */}
            {chartStats.points.length >= 2 && (
                <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 px-1">
                    <span>{chartStats.points[0]?.timeStr}</span>
                    <span className="text-slate-400 font-semibold">{chartStats.points.length} Data Points</span>
                    <span>{chartStats.points[chartStats.points.length - 1]?.timeStr}</span>
                </div>
            )}
        </div>
    );
}
