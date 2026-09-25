import React, { useState, useMemo } from 'react';
import { Server, Search, ChevronDown, Check } from 'lucide-react';

export default function WorkOrderDeviceSelect({
    devices = [],
    inventoryDevices = [],
    unitCycleTimeMinutes = 5,
    onChange
}) {
    const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(false);
    const [deviceSearch, setDeviceSearch] = useState('');

    // Format list perangkat dari Master Inventory
    const formattedInventoryDevices = useMemo(() => {
        return (inventoryDevices || []).map((dev, idx) => {
            const devName = dev.name || dev.hostname || dev.NAME || dev.HOSTNAME || `Device-${dev.id || dev.PID || idx}`;
            const devIp = dev.ip || dev.IP || '';
            const devLoc = dev.location || dev.floor || dev.LOCATION || '';
            const devVendor = dev.vendor || dev.VENDOR || '';
            const devVal = devIp ? `${devName} (${devIp})` : devName;

            return {
                id: dev.id || dev.PID || `dev-${idx}`,
                name: devName,
                ip: devIp,
                location: devLoc,
                vendor: devVendor,
                value: devVal
            };
        });
    }, [inventoryDevices]);

    // Filter list perangkat berdasarkan live search
    const filteredInventoryList = useMemo(() => {
        if (!deviceSearch.trim()) return formattedInventoryDevices;
        const q = deviceSearch.toLowerCase();
        return formattedInventoryDevices.filter(d =>
            d.name.toLowerCase().includes(q) ||
            d.ip.toLowerCase().includes(q) ||
            d.location.toLowerCase().includes(q) ||
            d.vendor.toLowerCase().includes(q)
        );
    }, [formattedInventoryDevices, deviceSearch]);

    // Update devices & hitung target duration
    const updateDevicesWithRecalc = (newDevicesList) => {
        const unitCycle = Number(unitCycleTimeMinutes) || 5;
        const count = newDevicesList.length;
        const newTargetMins = Math.max(1, count) * unitCycle;
        onChange(newDevicesList, newTargetMins);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label className="block text-slate-400 font-medium">
                    Perangkat / Target Device yang Ditangani (Multi-Select Inventory)
                </label>
                <div className="flex items-center gap-2">
                    {devices.length > 0 && (
                        <button
                            type="button"
                            onClick={() => updateDevicesWithRecalc([])}
                            className="text-[10px] text-rose-400 hover:underline font-mono"
                        >
                            Hapus Semua
                        </button>
                    )}
                    <span className="text-[10px] text-cyan-400 font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                        {devices.length} Terpilih
                    </span>
                </div>
            </div>

            {/* MultiSelect Dropdown Trigger & Popover Box */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsDeviceDropdownOpen(!isDeviceDropdownOpen)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-left flex items-center justify-between text-xs text-slate-200 focus:outline-none focus:border-blue-500 shadow-inner group"
                >
                    <div className="flex items-center gap-2 truncate flex-1 mr-2">
                        <Server className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        {devices.length === 0 ? (
                            <span className="text-slate-500">-- Pilih Perangkat (Multi-Select) --</span>
                        ) : (
                            <span className="text-slate-200 font-medium truncate">
                                {devices.slice(0, 3).join(', ')}
                                {devices.length > 3 ? ` +${devices.length - 3} lainnya` : ''}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-slate-200">
                        <ChevronDown className={`w-4 h-4 transition-transform ${isDeviceDropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} />
                    </div>
                </button>

                {/* Dropdown Menu */}
                {isDeviceDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-100">
                        {/* Search input inside dropdown */}
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari hostname, IP, lokasi, vendor..."
                                value={deviceSearch}
                                onChange={(e) => setDeviceSearch(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                                autoFocus
                            />
                            {deviceSearch && (
                                <button
                                    type="button"
                                    onClick={() => setDeviceSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Action Bar */}
                        <div className="flex items-center justify-between px-1 text-[11px] text-slate-400 font-mono border-b border-slate-800 pb-1.5">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const allFilteredVals = filteredInventoryList.map(d => d.value);
                                        const merged = Array.from(new Set([...devices, ...allFilteredVals]));
                                        updateDevicesWithRecalc(merged);
                                    }}
                                    className="text-blue-400 hover:text-blue-300 font-bold"
                                >
                                    Pilih Semua Hasil
                                </button>
                                <span>•</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const allFilteredVals = new Set(filteredInventoryList.map(d => d.value));
                                        updateDevicesWithRecalc(devices.filter(val => !allFilteredVals.has(val)));
                                    }}
                                    className="text-slate-400 hover:text-slate-200"
                                >
                                    Batal Pilihan
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsDeviceDropdownOpen(false)}
                                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold"
                            >
                                Selesai
                            </button>
                        </div>

                        {/* Scrollable Checkbox List */}
                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {filteredInventoryList.length === 0 ? (
                                <div className="py-4 text-center text-slate-500 text-xs font-mono">
                                    Tidak ada perangkat yang cocok.
                                    {deviceSearch && (
                                        <div className="mt-1.5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const val = deviceSearch.trim();
                                                    if (val && !devices.includes(val)) {
                                                        updateDevicesWithRecalc([...devices, val]);
                                                        setDeviceSearch('');
                                                    }
                                                }}
                                                className="text-blue-400 hover:underline font-bold"
                                            >
                                                + Tambahkan "{deviceSearch}" sebagai perangkat baru
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                filteredInventoryList.map((dev) => {
                                    const isSelected = devices.includes(dev.value);

                                    return (
                                        <label
                                            key={dev.id}
                                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'bg-blue-950/60 border border-blue-500/40 text-blue-200'
                                                    : 'hover:bg-slate-800/80 text-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {
                                                        if (isSelected) {
                                                            updateDevicesWithRecalc(devices.filter(v => v !== dev.value));
                                                        } else {
                                                            updateDevicesWithRecalc([...devices, dev.value]);
                                                        }
                                                    }}
                                                    className="w-3.5 h-3.5 rounded border-slate-700 text-blue-600 focus:ring-0 bg-slate-950"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-bold text-xs truncate">
                                                        {dev.name}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 font-mono truncate">
                                                        {dev.ip} {dev.location ? `• ${dev.location}` : ''} {dev.vendor ? `• ${dev.vendor}` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                                            )}
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Selected Devices Chips List */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 min-h-[38px] flex flex-wrap gap-1.5 mt-2">
                {devices.length === 0 ? (
                    <span className="text-[11px] text-slate-600 italic">Belum ada perangkat yang dipilih.</span>
                ) : (
                    devices.map((dev, idx) => (
                        <span
                            key={idx}
                            className="px-2.5 py-1 rounded-md bg-blue-950/80 border border-blue-500/40 text-blue-200 text-[11px] font-mono flex items-center gap-1.5 shadow-sm group"
                        >
                            <Server className="w-3 h-3 text-cyan-400" />
                            <span>{dev}</span>
                            <button
                                type="button"
                                onClick={() => {
                                    updateDevicesWithRecalc(devices.filter((_, i) => i !== idx));
                                }}
                                className="text-slate-400 hover:text-rose-400 ml-1 font-bold group-hover:opacity-100"
                                title="Hapus perangkat"
                            >
                                ×
                            </button>
                        </span>
                    ))
                )}
            </div>
        </div>
    );
}
