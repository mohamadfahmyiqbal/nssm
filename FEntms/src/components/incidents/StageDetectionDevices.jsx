import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Server, Search, ChevronDown, ChevronRight } from 'lucide-react';

export default function StageDetectionDevices({
    reportForm,
    setReportForm,
    selectedDevices,
    toggleSelectDevice,
    setSelectedDevices,
    devices = [],
    onNext
}) {
    const [deviceSearch, setDeviceSearch] = useState('');
    const [deviceVendorFilter, setDeviceVendorFilter] = useState('ALL');
    const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(false);
    const deviceDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (deviceDropdownRef.current && !deviceDropdownRef.current.contains(e.target)) {
                setIsDeviceDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const vendorOptions = useMemo(() => {
        const set = new Set();
        devices.forEach(d => {
            if (d.vendor) set.add(d.vendor);
        });
        return Array.from(set);
    }, [devices]);

    const filteredMasterDevices = useMemo(() => {
        return devices.filter(d => {
            const matchesVendor = deviceVendorFilter === 'ALL' || (d.vendor && d.vendor.toUpperCase() === deviceVendorFilter.toUpperCase());
            if (!matchesVendor) return false;

            if (!deviceSearch.trim()) return true;
            const q = deviceSearch.toLowerCase();
            return (
                (d.name && d.name.toLowerCase().includes(q)) ||
                (d.hostname && d.hostname.toLowerCase().includes(q)) ||
                (d.ip && d.ip.toLowerCase().includes(q)) ||
                (d.vendor && d.vendor.toLowerCase().includes(q)) ||
                (d.location && d.location.toLowerCase().includes(q)) ||
                (d.floor && d.floor.toLowerCase().includes(q))
            );
        });
    }, [devices, deviceSearch, deviceVendorFilter]);

    return (
        <div className="space-y-3.5 p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/70">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-xs font-bold text-rose-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5" />
                    Tahap 1: Deteksi & Pilihan Perangkat Terdampak (Multiple Select)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                    {selectedDevices.length} Terpilih
                </span>
            </div>

            {/* Bootstrap-Style Multiselect Device Selector */}
            <div className="space-y-2 p-3 bg-slate-900/80 border border-slate-800 rounded-xl relative" ref={deviceDropdownRef}>
                <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                        <Server className="w-3.5 h-3.5 text-blue-400" />
                        <span>Pilih Perangkat Terdampak (Multiselect):</span>
                    </label>
                    <span className="text-[10px] text-blue-400 font-mono font-bold">
                        {selectedDevices.length > 0 ? `${selectedDevices.length} Perangkat Terpilih` : 'None Selected'}
                    </span>
                </div>

                {/* Trigger Button */}
                <div 
                    onClick={() => setIsDeviceDropdownOpen(!isDeviceDropdownOpen)}
                    className={`w-full min-h-[38px] bg-slate-950 border rounded-lg px-3 py-1.5 flex items-center justify-between cursor-pointer transition-all shadow-sm ${
                        isDeviceDropdownOpen 
                            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-blue-500/10' 
                            : 'border-slate-700 hover:border-slate-600'
                    }`}
                >
                    <div className="flex flex-wrap items-center gap-1.5 flex-1 pr-2">
                        {selectedDevices.length === 0 ? (
                            <span className="text-xs text-slate-500 font-mono">-- Pilih Perangkat (Bisa Lebih Dari 1) --</span>
                        ) : (
                            selectedDevices.map((d, idx) => {
                                const isDown = d.status === 'DOWN' || d.is_online === 0 || d.is_online === false;
                                return (
                                    <span
                                        key={`${d.id || d.PID}-${idx}`}
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${isDown ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                        <span>{d.name || d.hostname}</span>
                                        <span className="text-[9px] text-cyan-300 font-normal">({d.ip || '-'})</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleSelectDevice(d)}
                                            className="text-blue-400 hover:text-rose-400 font-bold ml-0.5 leading-none"
                                        >
                                            ×
                                        </button>
                                    </span>
                                );
                            })
                        )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isDeviceDropdownOpen ? 'rotate-180 text-blue-400' : ''}`} />
                </div>

                {/* Dropdown Popup Menu */}
                {isDeviceDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="p-2.5 border-b border-slate-800 bg-slate-950/80 space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama, IP, MAC, lokasi..."
                                        value={deviceSearch}
                                        onChange={(e) => setDeviceSearch(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-xs outline-none focus:border-blue-500 font-mono"
                                        autoFocus
                                    />
                                </div>
                                <select
                                    value={deviceVendorFilter}
                                    onChange={(e) => setDeviceVendorFilter(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1 outline-none font-mono"
                                >
                                    <option value="ALL">Semua Vendor</option>
                                    {vendorOptions.map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
                                <button
                                    type="button"
                                    onClick={() => {
                                        filteredMasterDevices.forEach(d => {
                                            const exists = selectedDevices.some(item => String(item.id || item.PID) === String(d.id || d.PID));
                                            if (!exists) toggleSelectDevice(d);
                                        });
                                    }}
                                    className="text-blue-400 hover:text-blue-300 font-bold"
                                >
                                    Select All Filtered ({filteredMasterDevices.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedDevices([])}
                                    className="text-slate-400 hover:text-slate-200"
                                >
                                    Deselect All
                                </button>
                            </div>
                        </div>

                        {/* Options List */}
                        <div className="max-h-56 overflow-y-auto custom-scrollbar p-1 divide-y divide-slate-800/40">
                            {filteredMasterDevices.length === 0 ? (
                                <div className="p-3 text-center text-xs text-slate-500 italic font-mono">
                                    Tidak ada perangkat yang cocok dengan pencarian.
                                </div>
                            ) : (
                                filteredMasterDevices.map((d, idx) => {
                                    const isSelected = selectedDevices.some(item => String(item.id || item.PID) === String(d.id || d.PID));
                                    const isDown = d.status === 'DOWN' || d.is_online === 0 || d.is_online === false;

                                    return (
                                        <label
                                            key={`${d.id || d.PID}-${idx}`}
                                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs font-mono select-none ${
                                                isSelected
                                                    ? 'bg-blue-950/50 text-blue-200 font-bold'
                                                    : 'hover:bg-slate-800/60 text-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectDevice(d)}
                                                    className="w-4 h-4 rounded border-slate-700 text-blue-500 bg-slate-950 focus:ring-blue-500 cursor-pointer accent-blue-500"
                                                />
                                                <span className={`w-2 h-2 rounded-full ${isDown ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                                                <div>
                                                    <span>{d.name || d.hostname}</span>
                                                    <span className="text-[10px] text-cyan-400 font-normal ml-2">IP: {d.ip || '-'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-normal">
                                                <span>{d.vendor || 'Generic'}</span>
                                                <span className="hidden sm:inline">[{d.location || d.floor || '-'}]</span>
                                            </div>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Info Umum & Lokasi Gangguan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-1">
                <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Hostname / Label Perangkat:</label>
                    <input
                        type="text"
                        placeholder="Contoh: PC-KASIR-01, PRINTER-HRD, CCTV-PARKIR-03..."
                        value={reportForm.hostname || ''}
                        onChange={(e) => setReportForm({ ...reportForm, hostname: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 font-bold rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-slate-400 block mb-1">IP Address / Port / VLAN (Opsional):</label>
                    <input
                        type="text"
                        placeholder="Contoh: 192.168.10.45 atau Non-IP..."
                        value={reportForm.ip || ''}
                        onChange={(e) => setReportForm({ ...reportForm, ip: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-cyan-400 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Waktu Kejadian Ditemukan:</label>
                    <input
                        type="text"
                        value={reportForm.discoveredTime || ''}
                        onChange={(e) => setReportForm({ ...reportForm, discoveredTime: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Sumber Informasi / Pelaporan:</label>
                    <select
                        value={reportForm.sourceInfo || 'Laporan User'}
                        onChange={(e) => setReportForm({ ...reportForm, sourceInfo: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                    >
                        <option value="Laporan User">Laporan User / PIC Unit (Telepon/Helpdesk)</option>
                        <option value="Pengecekan Rutin">Pengecekan Rutin / Walkthrough Lapangan</option>
                        <option value="Sistem Monitoring (SNMP/Alert)">Sistem Pemantauan Otomatis (SNMP/Alert)</option>
                        <option value="Insiden Vendor">Laporan Vendor Eksternal / ISP</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Lokasi Fisik / Ruangan / Gedung:</label>
                    <input
                        type="text"
                        placeholder="Contoh: Gedung A Lt. 3 / Ruang Keuangan..."
                        value={reportForm.location || ''}
                        onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Nama Pelapor / Unit Kerja:</label>
                    <input
                        type="text"
                        placeholder="Contoh: Bpk. Ahmad (Dept. Finance)..."
                        value={reportForm.reporter || ''}
                        onChange={(e) => setReportForm({ ...reportForm, reporter: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button
                    type="button"
                    onClick={onNext}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-bold"
                >
                    <span>Lanjut ke Triage & Dampak</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
