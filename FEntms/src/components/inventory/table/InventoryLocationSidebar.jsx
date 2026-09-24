import React from 'react';

export default function InventoryLocationSidebar({
    locationFilters = [],
    selectedFilter,
    setSelectedFilter,
    devices = []
}) {
    return (
        <div className="w-full lg:w-60 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Lokasi Denah / Drawing</h3>
                <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    {Math.max(0, locationFilters.length - 2)} Plans
                </span>
            </div>
            {locationFilters.map((loc, idx) => (
                <button
                    key={`${loc}-${idx}`}
                    onClick={() => setSelectedFilter(loc)}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                        selectedFilter === loc
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-bold'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                >
                    <span className="truncate">{loc}</span>
                    {loc !== 'All' && loc !== 'Unmapped' && (
                        <span className="text-[10px] text-slate-500 font-mono">
                            ({devices.filter((d) => d.floor === loc || d.floor?.includes(loc)).length})
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
