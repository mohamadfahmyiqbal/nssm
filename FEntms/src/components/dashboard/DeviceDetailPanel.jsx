import React, { useState, useEffect } from 'react';
import { MapPin, X, Activity, Bell, BellOff, Trash2 } from 'lucide-react';
import DeviceTelemetryChart from './DeviceTelemetryChart';
import { getDevicePredictionsFromDB } from '../../services/api';
import { useDevices } from '../../context/DeviceContext';

import DevicePredictiveHealthCard from './detail/DevicePredictiveHealthCard';
import DevicePortStatusGrid from './detail/DevicePortStatusGrid';
import DeviceSystemInfoCard from './detail/DeviceSystemInfoCard';
import DeviceNetworkResourcesCard from './detail/DeviceNetworkResourcesCard';
import DeviceNvrTelemetryCard from './detail/DeviceNvrTelemetryCard';
import DeviceUpsTelemetryCard from './detail/DeviceUpsTelemetryCard';
import DeviceAtsTelemetryCard from './detail/DeviceAtsTelemetryCard';

export default function DeviceDetailPanel({
    selectedDevice,
    setSelectedDevice,
    snmpData,
    isLoadingSnmp,
    nvrSnmpData,
    isLoadingNvrSnmp,
    pollingOverrides,
    handlePollingOverrideChange,
    notificationPrefs,
    handleNotificationToggle,
    notifKey,
    handleRemoveNode,
    vendorMetrics
}) {
    const { disabledPollingMap, toggleDevicePolling } = useDevices();
    const [predictionData, setPredictionData] = useState(null);
    const [isLoadingPred, setIsLoadingPred] = useState(false);

    useEffect(() => {
        if (!selectedDevice) {
            setPredictionData(null);
            return;
        }
        const fetchPredictions = async () => {
            const pid = selectedDevice.id || selectedDevice.PID || selectedDevice.ip || selectedDevice.IP;
            if (!pid) return;
            setIsLoadingPred(true);
            try {
                const res = await getDevicePredictionsFromDB(pid);
                if (res?.success && res.data) {
                    setPredictionData(res.data);
                }
            } catch (e) {
                // Ignore silent failure
            } finally {
                setIsLoadingPred(false);
            }
        };

        fetchPredictions();
    }, [selectedDevice]);

    if (!selectedDevice) return null;

    const isLiveUp = !!(nvrSnmpData || vendorMetrics || (snmpData && snmpData.sysDescr && snmpData.sysDescr !== 'N/A'));
    const effectiveStatus = isLiveUp ? 'up' : (selectedDevice.status?.toLowerCase() || 'up');
    const detectedVendor = vendorMetrics?.vendor || nvrSnmpData?.vendor || selectedDevice.vendor || null;

    const subTypeLower = (selectedDevice.subType || '').toLowerCase();
    const labelLower = (selectedDevice.label || '').toLowerCase();
    const isUps = subTypeLower === 'ups' || labelLower.includes('ups') || vendorMetrics?.category === 'ups' || vendorMetrics?.isUps || vendorMetrics?.vendorId === 'schneider_ups';
    const isAts = subTypeLower === 'ats' || labelLower.includes('ats') || vendorMetrics?.category === 'ats' || vendorMetrics?.isAts || vendorMetrics?.vendorId === 'apc_ats';
    const isNvr = subTypeLower === 'nvr' || labelLower.includes('nvr') || vendorMetrics?.category === 'nvr' || vendorMetrics?.isNvr;
    const isPowerDevice = isUps || isAts;

    return (
        <div className="fixed top-6 right-6 z-[50] w-[350px] sm:w-[400px] max-h-[calc(100vh-3rem)] bg-slate-900/95 border border-slate-700/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl font-sans text-xs text-slate-200 transition-all duration-300 animate-in fade-in slide-in-from-right-4 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700/50 p-5 pb-3 shrink-0 gap-8">
                <div className="flex items-center gap-2 text-blue-400 font-bold tracking-wide">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg shadow-inner">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <span>DEVICE INFO</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleRemoveNode(selectedDevice.id)}
                        title="Keluarkan dari Canvas"
                        className="text-slate-400 hover:text-rose-400 bg-slate-800/40 hover:bg-slate-800 p-1.5 rounded-lg transition-all duration-300"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setSelectedDevice(null)}
                        title="Tutup Panel"
                        className="text-slate-400 hover:text-rose-400 bg-slate-800/40 hover:bg-slate-800 p-1.5 rounded-lg transition-all duration-300 hover:rotate-90"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 w-full">
                <div className="space-y-4 text-[11px] p-5 pt-4 flex-col flex shrink-0">
                    {/* Device Name & Status */}
                    <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 shadow-inner group hover:border-slate-700/80 transition-colors gap-6">
                        <div className="flex-1">
                            <span className="text-slate-500 block text-[9px] font-bold tracking-wider mb-0.5">DEVICE NAME</span>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-100 text-sm block group-hover:text-blue-400 transition-colors break-words">{selectedDevice.label}</span>
                                {detectedVendor && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-blue-950/70 border border-blue-600/40 text-blue-400">
                                        {detectedVendor}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                            <span className="text-slate-500 block text-[9px] font-bold tracking-wider mb-0.5 font-mono">STATUS OPERASIONAL</span>
                            <div className="flex items-center gap-1.5">
                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${effectiveStatus === 'up' ? 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)]' : effectiveStatus === 'warning' ? 'bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse' : 'bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse'}`}></span>
                                <span className={`font-mono font-bold uppercase tracking-wider text-[11px] ${effectiveStatus === 'up' ? 'text-[#10B981]' : effectiveStatus === 'warning' ? 'text-[#F59E0B]' : 'text-[#EF4444]'}`}>
                                    {effectiveStatus === 'up' ? 'NORMAL / UP' : effectiveStatus === 'warning' ? 'WARNING' : 'CRITICAL / DOWN'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Predictive Health Card */}
                    <DevicePredictiveHealthCard predictionData={predictionData} />

                    {/* Floor, IP & MAC */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                            <span className="text-slate-500 block text-[9px] font-bold tracking-wider mb-1 font-mono">LANTAI / DENAH</span>
                            <span className="text-emerald-400 font-medium block break-words" title={selectedDevice.floor || 'Unmapped'}>
                                {selectedDevice.floor || 'Unmapped'}
                            </span>
                        </div>
                        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                            <span className="text-slate-500 block text-[9px] font-bold tracking-wider mb-1 font-mono">IP ADDRESS</span>
                            <span className="text-blue-400 font-mono font-bold block break-all select-all tracking-tight" title={selectedDevice.ip || 'Dynamic / Trunk'}>
                                {selectedDevice.ip || 'Dynamic / Trunk'}
                            </span>
                        </div>
                    </div>

                    {selectedDevice.mac && selectedDevice.mac !== '-' && (
                        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 flex justify-between items-center">
                            <span className="text-slate-500 text-[9px] font-bold tracking-wider font-mono">MAC ADDRESS</span>
                            <span className="text-slate-200 font-mono font-bold text-xs select-all tracking-tight">{selectedDevice.mac}</span>
                        </div>
                    )}

                    {/* Location */}
                    <div className="bg-gradient-to-br from-blue-950/40 to-indigo-950/40 border border-blue-900/40 p-3 rounded-xl shadow-inner relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="text-blue-400 block text-[9px] font-bold tracking-wider mb-1">TITIK LOKASI FISIK:</span>
                        <span className="text-slate-200 block text-xs leading-relaxed font-medium relative z-10">{selectedDevice.location || 'Belum ditentukan'}</span>
                    </div>

                    {/* UI PORT VIEW */}
                    <DevicePortStatusGrid
                        selectedDevice={selectedDevice}
                        snmpData={snmpData}
                        isLoadingSnmp={isLoadingSnmp}
                        isPowerDevice={isPowerDevice}
                    />

                    {/* Notification & Polling Toggles */}
                    <div className="flex flex-col gap-2 mt-2">
                        {/* Polling Toggle */}
                        {(() => {
                            const devKey = selectedDevice.id || selectedDevice.PID || selectedDevice.ip || notifKey;
                            const isPollingDisabled = !!(disabledPollingMap && (disabledPollingMap[devKey] || disabledPollingMap[selectedDevice.ip] || disabledPollingMap[selectedDevice.label]));
                            return (
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (toggleDevicePolling) toggleDevicePolling(devKey);
                                    }}
                                    className="bg-slate-950/50 border border-slate-800/60 p-3 rounded-xl flex justify-between items-center group hover:border-slate-700/60 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Activity className={`w-3.5 h-3.5 ${!isPollingDisabled ? 'text-blue-400' : 'text-slate-500'}`} />
                                        <div className="flex flex-col">
                                            <span className="text-slate-300 text-[10px] font-bold tracking-wider">AUTO-POLLING STATUS</span>
                                            <span className="text-[9px] font-mono text-slate-500">
                                                {!isPollingDisabled ? 'Aktif di-poll oleh Agent & Cron' : 'Dinonaktifkan (Muted / Paused)'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            !isPollingDisabled ? 'bg-blue-600' : 'bg-slate-700'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                !isPollingDisabled ? 'translate-x-4' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                            );
                        })()}

                        {/* Notification Toggle */}
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationToggle(notifKey);
                            }}
                            className="bg-slate-950/50 border border-slate-800/60 p-3 rounded-xl flex justify-between items-center group hover:border-slate-700/60 cursor-pointer transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                {notificationPrefs[notifKey] !== false ? (
                                    <Bell className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                    <BellOff className="w-3.5 h-3.5 text-rose-400" />
                                )}
                                <span className="text-slate-500 text-[10px] font-bold tracking-wider">KIRIM NOTIFIKASI ALERT</span>
                            </div>
                            <button
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notificationPrefs[notifKey] !== false ? 'bg-emerald-500' : 'bg-slate-700'
                                    }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notificationPrefs[notifKey] !== false ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* SNMP v3 Metrics Section */}
                    {(isPowerDevice || isNvr || selectedDevice.subType === 'server' || selectedDevice.subType === 'camera' || selectedDevice.subType === 'cctv' || selectedDevice.subType === 'switch' || selectedDevice.subType === 'router' || selectedDevice.subType === 'firewall' || selectedDevice.label?.toLowerCase().includes('sw') || snmpData || vendorMetrics) && (
                        <div className="mt-5 pt-4 border-t border-slate-700/50 space-y-3">
                            <div className="text-[10px] font-bold text-indigo-400 flex items-center justify-between">
                                <div className="flex items-center gap-2 bg-indigo-500/10 px-2 py-1.5 rounded-lg border border-indigo-500/20 shadow-sm">
                                    <Activity className="w-3.5 h-3.5" /> <span>SNMP v3 METRICS</span>
                                </div>
                                {isLoadingSnmp && (
                                    <div className="flex items-center gap-1.5 text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-full">
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                )}
                            </div>

                            {/* MIB-2 & Entity System Info */}
                            {!isNvr && (
                                <DeviceSystemInfoCard snmpData={snmpData} vendorMetrics={vendorMetrics} />
                            )}

                            {/* Switch/Router/Server Resources & Network Traffic */}
                            <DeviceNetworkResourcesCard
                                isPowerDevice={isPowerDevice}
                                isNvr={isNvr}
                                snmpData={snmpData}
                                vendorMetrics={vendorMetrics}
                            />

                            {/* Uptime */}
                            <div className="bg-gradient-to-r from-slate-950/80 to-slate-900/80 border border-slate-700/50 p-4 rounded-xl flex justify-between items-center group shadow-inner">
                                <div className="flex items-center gap-2.5">
                                    <div className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </div>
                                    <span className="text-slate-400 text-[10px] font-bold tracking-wider">SYSTEM UPTIME</span>
                                </div>
                                <span className="text-slate-200 font-mono text-xs font-bold tracking-wide bg-slate-800/90 px-2.5 py-1.5 rounded-lg border border-slate-600/50 shadow-sm">{snmpData ? snmpData.uptime : '-'}</span>
                            </div>

                            {/* NVR Specific Telemetry */}
                            <DeviceNvrTelemetryCard
                                isNvr={isNvr}
                                nvrSnmpData={nvrSnmpData}
                                vendorMetrics={vendorMetrics}
                                detectedVendor={detectedVendor}
                                isLoadingNvrSnmp={isLoadingNvrSnmp}
                            />

                            {/* UPS Specific Telemetry */}
                            <DeviceUpsTelemetryCard
                                isUps={isUps}
                                vendorMetrics={vendorMetrics}
                            />

                            {/* ATS Specific Telemetry */}
                            <DeviceAtsTelemetryCard
                                isAts={isAts}
                                vendorMetrics={vendorMetrics}
                            />

                            {/* Historical Trends & Performance Metrics Chart */}
                            <DeviceTelemetryChart
                                pid={selectedDevice.id || selectedDevice.PID}
                                ip={selectedDevice.ip || selectedDevice.IP}
                                deviceType={selectedDevice.subType || selectedDevice.type}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}