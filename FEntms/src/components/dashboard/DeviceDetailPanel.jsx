import React from 'react';
import { MapPin, X, Activity, HardDrive, Camera, Bell, BellOff, Trash2 } from 'lucide-react';

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
    if (!selectedDevice) return null;

    const isLiveUp = !!(nvrSnmpData || vendorMetrics || (snmpData && snmpData.sysDescr && snmpData.sysDescr !== 'N/A'));
    const effectiveStatus = isLiveUp ? 'up' : (selectedDevice.status?.toLowerCase() || 'up');
    const detectedVendor = vendorMetrics?.vendor || nvrSnmpData?.vendor || selectedDevice.vendor || null;

    return (
        <div className="fixed top-6 left-6 z-[60] w-[350px] sm:w-[400px] max-h-[calc(100vh-3rem)] bg-slate-900/90 border border-slate-700/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl font-sans text-xs text-slate-200 transition-all duration-300 animate-in fade-in slide-in-from-left-4 flex flex-col">
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

            <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 w-full">
                <div className="space-y-4 text-[11px] p-5 pt-4 flex-col flex shrink-0">
                {/* Device Name & Status */}
                <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 shadow-inner group hover:border-slate-700/80 transition-colors gap-6">
                    <div className="flex-1">
                        <span className="text-slate-500 block text-[9px] font-bold tracking-wider mb-0.5">DEVICE NAME</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 text-sm block group-hover:text-blue-400 transition-colors break-words">{selectedDevice.label}</span>
                            {detectedVendor && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-blue-950/70 border border-blue-600/40 text-blue-400">
                                    {detectedVendor}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <span className="text-slate-500 block text-[9px] font-bold tracking-wider mb-0.5">STATUS</span>
                        <span className={`font-bold text-xs uppercase flex items-center justify-end gap-1.5 ${effectiveStatus === 'down' ? 'text-rose-500' :
                                effectiveStatus === 'warning' ? 'text-amber-500' :
                                    'text-emerald-500'
                            }`}>
                            <span className="relative flex w-2 h-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${effectiveStatus === 'down' ? 'bg-rose-500' :
                                        effectiveStatus === 'warning' ? 'bg-amber-500' :
                                            'bg-emerald-500'
                                    }`}></span>
                                <span className={`relative inline-flex rounded-full w-2 h-2 ${effectiveStatus === 'down' ? 'bg-rose-500' :
                                        effectiveStatus === 'warning' ? 'bg-amber-500' :
                                            'bg-emerald-500'
                                    }`}></span>
                            </span>
                            {effectiveStatus === 'down' ? 'OFFLINE' : effectiveStatus === 'warning' ? 'WARNING' : 'ONLINE'}
                        </span>
                    </div>
                </div>

                {/* Floor, IP & MAC */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                        <span className="text-slate-500 block text-[9px] font-bold tracking-wider mb-1">LANTAI / DENAH</span>
                        <span className="text-emerald-400 font-medium block break-words" title={selectedDevice.floor || 'Unmapped'}>
                            {selectedDevice.floor || 'Unmapped'}
                        </span>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                        <span className="text-slate-500 block text-[9px] font-bold tracking-wider mb-1">IP ADDRESS</span>
                        <span className="text-blue-400 font-mono font-medium block break-all" title={selectedDevice.ip || 'Dynamic / Trunk'}>
                            {selectedDevice.ip || 'Dynamic / Trunk'}
                        </span>
                    </div>
                </div>

                {selectedDevice.mac && selectedDevice.mac !== '-' && (
                    <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50 flex justify-between items-center">
                        <span className="text-slate-500 text-[9px] font-bold tracking-wider">MAC ADDRESS</span>
                        <span className="text-slate-300 font-mono text-xs">{selectedDevice.mac}</span>
                    </div>
                )}

                {/* Location */}
                <div className="bg-gradient-to-br from-blue-950/40 to-indigo-950/40 border border-blue-900/40 p-3 rounded-xl shadow-inner relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="text-blue-400 block text-[9px] font-bold tracking-wider mb-1">TITIK LOKASI FISIK:</span>
                    <span className="text-slate-200 block text-xs leading-relaxed font-medium relative z-10">{selectedDevice.location || 'Belum ditentukan'}</span>
                </div>

                {/* UI PORT VIEW (Hanya tampil jika tipe perangkat switch) */}
                {(!selectedDevice.subType || selectedDevice.subType === 'switch' || selectedDevice.label?.toLowerCase().includes('sw')) && (
                    <div className="bg-slate-950/50 border border-slate-800/60 p-3 rounded-xl shadow-inner mt-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-500 text-[10px] font-bold tracking-wider">PORT STATUS (LIVE)</span>
                            {isLoadingSnmp && <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>}
                        </div>
                        <div className="grid grid-cols-12 gap-1 bg-slate-900/80 p-1.5 rounded-lg border border-slate-700/50 max-h-48 overflow-y-auto custom-scrollbar">
                            {(snmpData?.ports || Array.from({ length: 24 })).map((port, i) => {
                                const isUp = snmpData?.ports ? port.status === 'up' : (i % 5 !== 0);
                                const portName = snmpData?.ports ? (port.shortName || port.index) : (i + 1);
                                const aliasText = port?.alias ? ` [${port.alias}]` : '';
                                const fullTitle = snmpData?.ports && port.name ? `${port.name}${aliasText}` : `Interface ${portName}`;
                                return (
                                    <div 
                                        key={i} 
                                        title={`${fullTitle} - ${isUp ? 'UP' : 'DOWN'}`}
                                        className={`w-full aspect-square rounded-[2px] border transition-all hover:scale-110 cursor-pointer flex items-center justify-center ${
                                            isUp 
                                            ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]' 
                                            : 'bg-slate-800 border-slate-700/80 opacity-60'
                                        }`}
                                    >
                                        <span className={`text-[8px] font-bold font-mono ${isUp ? 'text-white' : 'text-slate-500'}`}>{portName}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex justify-between mt-2 px-1 text-[9px] text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-emerald-500/40 border border-emerald-500/80 rounded-sm"></div> 
                                <span>Connected (Up)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-slate-800 border border-slate-700/80 rounded-sm"></div> 
                                <span>Disconnected</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notification Toggle */}
                <div 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationToggle(notifKey);
                    }}
                    className="bg-slate-950/50 border border-slate-800/60 p-3 rounded-xl flex justify-between items-center group hover:border-slate-700/60 cursor-pointer transition-colors mt-2"
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
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            notificationPrefs[notifKey] !== false ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                notificationPrefs[notifKey] !== false ? 'translate-x-4' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>

                {/* SNMP v3 Metrics */}
                {(selectedDevice.subType === 'nvr' || selectedDevice.subType === 'server' || selectedDevice.subType === 'camera' || selectedDevice.subType === 'cctv' || selectedDevice.subType === 'switch' || selectedDevice.subType === 'router' || selectedDevice.subType === 'firewall' || selectedDevice.label?.toLowerCase().includes('sw') || snmpData || vendorMetrics) && (
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
                        {snmpData && !(selectedDevice.subType === 'nvr' || selectedDevice.label?.toLowerCase().includes('nvr')) && (
                            <div className="relative group overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 p-4 rounded-xl border border-slate-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="space-y-3 relative z-10">
                                    <div className="flex justify-between items-start gap-4">
                                        <span className="text-slate-500 text-[10px] font-bold tracking-wider shrink-0 mt-0.5">SYS NAME</span>
                                        <span className="text-blue-300 text-xs text-right font-semibold break-all leading-relaxed">{snmpData.sysName || '-'}</span>
                                    </div>
                                    {(vendorMetrics?.info?.model || snmpData?.model) && (
                                        <div className="flex justify-between items-start gap-4 border-t border-slate-800/60 pt-3">
                                            <span className="text-slate-500 text-[10px] font-bold tracking-wider shrink-0 mt-0.5">MODEL / CHASSIS</span>
                                            <span className="text-emerald-300 text-xs text-right font-mono font-semibold">{vendorMetrics?.info?.model || snmpData?.model}</span>
                                        </div>
                                    )}
                                    {(vendorMetrics?.info?.serialNumber || snmpData?.serialNumber) && (
                                        <div className="flex justify-between items-start gap-4 border-t border-slate-800/60 pt-3">
                                            <span className="text-slate-500 text-[10px] font-bold tracking-wider shrink-0 mt-0.5">SERIAL NUMBER</span>
                                            <span className="text-slate-300 text-xs text-right font-mono">{vendorMetrics?.info?.serialNumber || snmpData?.serialNumber}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start gap-4 border-t border-slate-800/60 pt-3">
                                        <span className="text-slate-500 text-[10px] font-bold tracking-wider shrink-0 mt-0.5">FIRMWARE</span>
                                        <span className="text-slate-300 text-[11px] text-right break-words leading-relaxed">{snmpData.sysDescr || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-start gap-4 border-t border-slate-800/60 pt-3">
                                        <span className="text-slate-500 text-[10px] font-bold tracking-wider shrink-0 mt-0.5">LOCATION</span>
                                        <span className="text-slate-300 text-[11px] text-right">{snmpData.sysLocation || '-'}</span>
                                    </div>
                                    {/* Fan & PSU Health untuk Switch / Firewall */}
                                    {(vendorMetrics?.info?.fanStatus || vendorMetrics?.info?.psuStatus) && (
                                        <div className="grid grid-cols-2 gap-2 border-t border-slate-800/60 pt-3">
                                            {vendorMetrics?.info?.fanStatus && (
                                                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-center">
                                                    <span className="text-slate-500 text-[8px] font-bold block mb-0.5">FAN HEALTH</span>
                                                    <span className={`text-[10px] font-bold ${vendorMetrics.info.fanStatus.includes('Normal') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {vendorMetrics.info.fanStatus}
                                                    </span>
                                                </div>
                                            )}
                                            {vendorMetrics?.info?.psuStatus && (
                                                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-center">
                                                    <span className="text-slate-500 text-[8px] font-bold block mb-0.5">POWER SUPPLY</span>
                                                    <span className={`text-[10px] font-bold ${vendorMetrics.info.psuStatus.includes('Normal') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {vendorMetrics.info.psuStatus}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Hardware Resource (Dynamic per Vendor) */}
                        {!(selectedDevice.subType === 'nvr' || selectedDevice.label?.toLowerCase().includes('nvr')) && (
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-slate-950/40 border border-slate-800/50 p-2.5 rounded-lg text-center opacity-80 hover:opacity-100 hover:border-slate-600/50 transition-all duration-300">
                                    <span className="text-slate-500 block text-[8px] font-bold tracking-wider mb-1">CPU</span>
                                    <span className="text-slate-400 font-mono text-[11px] font-semibold">{vendorMetrics?.resources?.cpu || snmpData?.cpu || '-'}</span>
                                </div>
                                <div className="bg-slate-950/40 border border-slate-800/50 p-2.5 rounded-lg text-center opacity-80 hover:opacity-100 hover:border-slate-600/50 transition-all duration-300">
                                    <span className="text-slate-500 block text-[8px] font-bold tracking-wider mb-1">RAM</span>
                                    <span className="text-slate-400 font-mono text-[11px] font-semibold">{vendorMetrics?.resources?.memory || snmpData?.memory || '-'}</span>
                                </div>
                                <div className="bg-slate-950/40 border border-slate-800/50 p-2.5 rounded-lg text-center opacity-80 hover:opacity-100 hover:border-slate-600/50 transition-all duration-300">
                                    <span className="text-slate-500 block text-[8px] font-bold tracking-wider mb-1">
                                        {vendorMetrics?.resources?.voltage ? 'VOLT' : vendorMetrics?.resources?.temperature ? 'SUHU' : 'DISK'}
                                    </span>
                                    <span className="text-slate-400 font-mono text-[11px] font-semibold">
                                        {vendorMetrics?.resources?.voltage ? `${vendorMetrics.resources.voltage}V` : vendorMetrics?.resources?.temperature ? `${vendorMetrics.resources.temperature}°C` : (snmpData ? snmpData.storage : '-')}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Network & Interface Stats */}
                        <div className={`grid gap-3 ${(selectedDevice.subType === 'nvr' || selectedDevice.label?.toLowerCase().includes('nvr')) ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            <div className="group bg-slate-950/50 border border-slate-800/60 p-3.5 rounded-xl hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300">
                                <span className="text-slate-500 text-[9px] font-bold tracking-wider block mb-1.5 group-hover:text-emerald-500/70 transition-colors">TRAFFIC IN</span>
                                <span className="text-emerald-400 font-mono text-sm font-bold block">{snmpData ? snmpData.networkTraffic?.in : '-'}</span>
                            </div>
                            <div className="group bg-slate-950/50 border border-slate-800/60 p-3.5 rounded-xl hover:border-rose-500/30 hover:bg-rose-500/5 transition-all duration-300">
                                <span className="text-slate-500 text-[9px] font-bold tracking-wider block mb-1.5 group-hover:text-rose-500/70 transition-colors">TRAFFIC OUT</span>
                                <span className="text-rose-400 font-mono text-sm font-bold block">{snmpData ? snmpData.networkTraffic?.out : '-'}</span>
                            </div>
                            {!(selectedDevice.subType === 'nvr' || selectedDevice.label?.toLowerCase().includes('nvr')) && (
                                <div className="group bg-slate-950/50 border border-slate-800/60 p-3.5 rounded-xl hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300">
                                    <span className="text-slate-500 text-[9px] font-bold tracking-wider block mb-1.5 group-hover:text-blue-500/70 transition-colors">UDP PKTS</span>
                                    <span className="text-blue-300 font-mono text-sm font-bold block">{snmpData ? snmpData.udpDatagrams : '-'}</span>
                                </div>
                            )}
                            <div className="group bg-slate-950/50 border border-slate-800/60 p-3.5 rounded-xl hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-300">
                                <span className="text-slate-500 text-[9px] font-bold tracking-wider block mb-1.5 group-hover:text-indigo-500/70 transition-colors">INTERFACES</span>
                                <span className="text-indigo-300 font-mono text-sm font-bold block">{snmpData ? snmpData.totalInterfaces : '-'}</span>
                            </div>
                        </div>

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

                        {/* Vendor Specific Metrics (NVR / Storage / CCTV) */}
                        {(selectedDevice.subType === 'nvr' || selectedDevice.label?.toLowerCase().includes('nvr') || vendorMetrics?.isNvr || vendorMetrics?.category === 'nvr' || nvrSnmpData) && (
                            <div className="mt-5 pt-4 border-t border-slate-700/50 space-y-3">
                                <div className="text-[10px] font-bold text-teal-400 flex items-center justify-between">
                                    <div className="flex items-center gap-2 bg-teal-500/10 px-2 py-1.5 rounded-lg border border-teal-500/20 shadow-sm">
                                        <Camera className="w-3.5 h-3.5" /> <span>{(detectedVendor || 'NVR / CCTV').toUpperCase()} METRICS</span>
                                    </div>
                                    {isLoadingNvrSnmp && (
                                        <div className="flex items-center gap-1.5 text-teal-300 bg-teal-500/10 px-2 py-1 rounded-full">
                                            <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    )}
                                </div>

                                {(nvrSnmpData || vendorMetrics) && (
                                    <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 space-y-2.5 font-medium text-[11px] hover:border-slate-700/80 transition-colors">
                                        {(nvrSnmpData?.info?.model || vendorMetrics?.info?.model) && (
                                            <div className="flex justify-between items-center"><span className="text-slate-500">Model</span><span className="text-slate-200 font-mono font-bold">{nvrSnmpData?.info?.model || vendorMetrics?.info?.model}</span></div>
                                        )}
                                        {(nvrSnmpData?.info?.serialNumber || vendorMetrics?.info?.serialNumber) && (
                                            <div className="flex justify-between items-center"><span className="text-slate-500">Serial Number</span><span className="text-slate-200 font-mono">{nvrSnmpData?.info?.serialNumber || vendorMetrics?.info?.serialNumber}</span></div>
                                        )}
                                        {(nvrSnmpData?.info?.firmware || vendorMetrics?.info?.firmware) && (
                                            <div className="flex justify-between items-center"><span className="text-slate-500">Firmware</span><span className="text-slate-200">{nvrSnmpData?.info?.firmware || vendorMetrics?.info?.firmware}</span></div>
                                        )}
                                        {(nvrSnmpData?.info?.userAccessCount || vendorMetrics?.info?.userAccessCount) && (
                                            <div className="flex justify-between items-center"><span className="text-slate-500">User Access Count</span><span className="text-blue-400 font-bold">{nvrSnmpData?.info?.userAccessCount || vendorMetrics?.info?.userAccessCount}</span></div>
                                        )}
                                        {(nvrSnmpData?.info?.temperature || vendorMetrics?.resources?.temperature) && (
                                            <div className="flex justify-between items-center"><span className="text-slate-500">Temperature</span><span className="text-amber-400 font-bold">{(nvrSnmpData?.info?.temperature || vendorMetrics?.resources?.temperature)}°C</span></div>
                                        )}
                                        {vendorMetrics?.info?.fanStatus && vendorMetrics?.info?.fanStatus !== 'N/A' && (
                                            <div className="flex justify-between items-center"><span className="text-slate-500">Fan Health</span><span className={`font-semibold ${vendorMetrics.info.fanStatus.includes('Normal') ? 'text-emerald-400' : 'text-rose-400'}`}>{vendorMetrics.info.fanStatus}</span></div>
                                        )}
                                        {vendorMetrics?.info?.psuStatus && vendorMetrics?.info?.psuStatus !== 'N/A' && (
                                            <div className="flex justify-between items-center"><span className="text-slate-500">Power Supply</span><span className={`font-semibold ${vendorMetrics.info.psuStatus.includes('Normal') ? 'text-emerald-400' : 'text-rose-400'}`}>{vendorMetrics.info.psuStatus}</span></div>
                                        )}
                                        {vendorMetrics?.info?.raidStatus && vendorMetrics?.info?.raidStatus !== 'N/A' && (
                                            <div className="flex justify-between items-center"><span className="text-slate-500">RAID Status</span><span className={`font-semibold ${vendorMetrics.info.raidStatus.includes('Normal') ? 'text-emerald-400' : 'text-amber-400'}`}>{vendorMetrics.info.raidStatus}</span></div>
                                        )}
                                        {vendorMetrics?.info?.recordingState && vendorMetrics?.info?.recordingState !== 'N/A' && (
                                            <div className="flex justify-between items-center"><span className="text-slate-500">Recording</span><span className={`font-semibold ${vendorMetrics.info.recordingState === 'Recording' ? 'text-emerald-400' : 'text-slate-400'}`}>{vendorMetrics.info.recordingState}</span></div>
                                        )}

                                        {/* Status HDD */}
                                        {((nvrSnmpData?.hdd && nvrSnmpData.hdd.length > 0) || (vendorMetrics?.hdd && vendorMetrics.hdd.length > 0)) && (
                                            <div className="pt-2 mt-2 border-t border-slate-800/60">
                                                <div className="text-[10px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                                                    <HardDrive className="w-3 h-3" /> Status HDD ({(nvrSnmpData?.hdd || vendorMetrics?.hdd || []).length} slot)
                                                </div>
                                                <div className="max-h-24 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                                                    {(nvrSnmpData?.hdd || vendorMetrics?.hdd || []).map((h, i) => (
                                                        <div key={i} className="flex justify-between items-center text-[10px] bg-slate-900/50 p-1.5 rounded">
                                                            <span className="text-slate-400">HDD {i + 1}</span>
                                                            <span className="text-emerald-400">{h.status}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Status Kamera */}
                                        {((nvrSnmpData?.cameras && nvrSnmpData.cameras.length > 0) || (vendorMetrics?.cameras && vendorMetrics.cameras.length > 0)) && (
                                            <div className="pt-2 mt-2 border-t border-slate-800/60">
                                                <div className="text-[10px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                                                    <Camera className="w-3 h-3" /> Status Kamera ({(nvrSnmpData?.cameras || vendorMetrics?.cameras || []).length})
                                                </div>
                                                <div className="grid grid-cols-5 gap-1">
                                                    {(nvrSnmpData?.cameras || vendorMetrics?.cameras || []).map((c, i) => (
                                                        <div key={i} title={`Kamera ${i + 1}: ${c.status}`} className={`h-2 rounded ${c.status === 'Connected' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}