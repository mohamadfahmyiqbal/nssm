import React from 'react';
import { Server, Search } from 'lucide-react';

export default function DeviceSelectorList({
    devices,
    filteredDevices,
    searchQuery,
    setSearchQuery,
    filterVendor,
    setFilterVendor,
    vendorOptions,
    selectedDevices,
    toggleSelectDevice,
    handleSelectAllFiltered
}) {
    return (
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                        Master Inventory (Multi-Select)
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSelectAllFiltered}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 hover:bg-blue-900/80 border border-blue-800/60 transition-colors"
                    >
                        {selectedDevices.length === filteredDevices.length && filteredDevices.length > 0
                            ? 'Batal Semua'
                            : 'Pilih Semua'}
                    </button>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                        {selectedDevices.length} Terpilih
                    </span>
                </div>
            </div>

            {/* Find Search Filter & Vendor Filter Bar */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Find perangkat: nama, IP, MAC, lokasi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950/70 border border-slate-700/80 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-2 outline-none focus:border-blue-500 font-mono transition-all placeholder:text-slate-500"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-300 font-mono"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Dropdown Filter Vendor */}
                <select
                    value={filterVendor}
                    onChange={(e) => setFilterVendor(e.target.value)}
                    className="bg-slate-950/70 border border-slate-700/80 text-slate-300 text-xs rounded-xl px-2.5 py-2 outline-none focus:border-blue-500 font-mono"
                >
                    <option value="ALL">Semua Vendor</option>
                    {vendorOptions.map(v => (
                        <option key={v} value={v}>{v}</option>
                    ))}
                </select>
            </div>

            {/* Device Scroll List from Inventory with Checkbox */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[520px] custom-scrollbar">
                {filteredDevices.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-500 font-mono">
                        Tidak ada perangkat yang cocok dengan pencarian "{searchQuery}".
                    </div>
                ) : (
                    filteredDevices.map((d, idx) => {
                        const isSelected = selectedDevices.some(item => String(item.id || item.PID) === String(d.id || d.PID));
                        const isDown = d.status === 'DOWN' || d.is_online === 0 || d.is_online === false;
                        
                        return (
                            <div
                                key={`${d.id || d.PID}-${idx}`}
                                onClick={() => toggleSelectDevice(d)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                                    isSelected
                                        ? 'bg-blue-950/40 border-blue-500/80 shadow-md ring-1 ring-blue-500/40'
                                        : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/60'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => {}} // Controlled by card click
                                            className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 bg-slate-900 cursor-pointer"
                                        />
                                        <span className={`w-2 h-2 rounded-full ${isDown ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                                        <span className="text-xs font-bold text-slate-100 truncate max-w-[170px]">
                                            {d.name || d.hostname}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40">
                                        {d.ip || 'No IP'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-[10.5px] text-slate-400 font-mono pl-6">
                                    <span>{d.vendor || 'Generic'} ({d.type || 'Switch'})</span>
                                    <span className="text-slate-500 truncate max-w-[130px]">{d.location || d.floor || 'Unmapped'}</span>
                                </div>

                                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 border-t border-slate-800/60 pt-1.5 pl-6">
                                    <span>MAC/SN: {d.mac || d.sn || '-'}</span>
                                    <span className={isSelected ? 'text-blue-400 font-bold' : 'text-slate-500'}>
                                        {isSelected ? '✓ Terpilih' : '+ Klik untuk pilih'}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
