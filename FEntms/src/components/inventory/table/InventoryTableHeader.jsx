import React from 'react';
import { Search, Trash2, RotateCw, Plus } from 'lucide-react';

export default function InventoryTableHeader({
    filteredCount = 0,
    selectedFilter = 'All',
    searchQuery = '',
    setSearchQuery,
    selectedCount = 0,
    onBulkDelete,
    onRefreshAll,
    onAddNewDevice
}) {
    return (
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm tracking-wide text-slate-100 whitespace-nowrap">
                    Live Device Inventory
                </h2>
                <span className="bg-blue-500/20 text-blue-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-blue-500/30 whitespace-nowrap">
                    {filteredCount} items ({selectedFilter})
                </span>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Cari device, IP, atau vendor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                </div>

                {selectedCount > 0 && (
                    <button
                        onClick={onBulkDelete}
                        className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg shadow-rose-600/30 transition-all font-mono"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus {selectedCount} Terpilih</span>
                    </button>
                )}

                <button
                    onClick={onRefreshAll}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs transition-all"
                    title="Refresh Data & Denah"
                >
                    <RotateCw className="w-3.5 h-3.5" />
                </button>

                <button
                    onClick={onAddNewDevice}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    <span>TAMBAH PERANGKAT BARU</span>
                </button>
            </div>
        </div>
    );
}
