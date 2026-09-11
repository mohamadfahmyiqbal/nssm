import React from 'react';
import { 
    Network, Search, Combine, Split, MousePointer2, Hand, Share2, 
    RefreshCw, Save, Trash2, Layers, Plus, Copy, Trash, Edit2 
} from 'lucide-react';

export default function TopologyHeader({
    searchQuery,
    handleSearchChange,
    searchResults,
    handleSelectSearchResult,
    handleGroup,
    handleUngroup,
    isSelectMode,
    setIsSelectMode,
    connectionType,
    setConnectionType,
    handleResetLayout,
    handleSaveLayout,
    handleRemoveSelected,
    hasSelection,
    // Multi-Drawing Props
    drawingsList = [],
    activeDrawing = null,
    onSelectDrawing,
    onCreateNewDrawing,
    onDuplicateDrawing,
    onRenameDrawing,
    onDeleteDrawing
}) {
    return (
        <div className="flex flex-col gap-2.5 bg-slate-900/40 p-3.5 rounded-2xl border border-slate-700/50 backdrop-blur-xl shadow-lg relative z-50">
            {/* ROW 1: HEADER INFO & DRAWING MANAGEMENT */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <Network className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-wider text-slate-100 uppercase font-mono flex items-center gap-2">
                            NETWORK TOPOLOGY
                        </h2>
                        <p className="text-[11px] text-slate-400">
                            Visualisasi hirarki jaringan & status node perangkat real-time
                        </p>
                    </div>
                </div>

                {/* MULTI-DRAWING SELECTOR & CONTROLS */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
                        <div className="p-1 bg-indigo-600/20 border border-indigo-500/40 rounded-lg text-indigo-400">
                            <Layers className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-300">DRAWING:</span>
                        <div className="flex items-center gap-1">
                            <select
                                value={activeDrawing?.id || ''}
                                onChange={(e) => onSelectDrawing && onSelectDrawing(Number(e.target.value))}
                                className="bg-slate-900 border border-slate-700 text-amber-400 font-bold font-mono text-xs rounded-lg px-2.5 py-1 cursor-pointer outline-none hover:border-amber-500/60 transition-colors max-w-[220px] truncate"
                            >
                                {drawingsList.map((d, idx) => (
                                    <option key={`${d.id}-${idx}`} value={d.id}>
                                        {d.type === 'MASTER' ? '⭐ [MASTER] ' : '📄 [DETAIL] '} {d.name}
                                    </option>
                                ))}
                            </select>
                            {activeDrawing && onRenameDrawing && (
                                <button
                                    onClick={onRenameDrawing}
                                    className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                                    title="Rename Drawing"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-950/40 border border-slate-800/80 rounded-xl p-1">
                        <button
                            onClick={onCreateNewDrawing}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            title="Tambah Drawing Topologi Baru"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">New Drawing</span>
                        </button>
                        <button
                            onClick={onDuplicateDrawing}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold bg-slate-800/80 text-slate-300 border border-slate-700/60 rounded-lg hover:bg-slate-700 hover:text-white transition-all"
                            title="Duplikat Drawing Aktif"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Copy</span>
                        </button>
                        <button
                            onClick={onDeleteDrawing}
                            disabled={drawingsList.length <= 1}
                            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                                drawingsList.length <= 1 
                                    ? 'bg-slate-800/30 text-slate-600 border border-slate-800/40 cursor-not-allowed'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-600 hover:text-white'
                            }`}
                            title="Hapus Drawing Aktif Ini"
                        >
                            <Trash className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ROW 2: SEARCH & CANVAS CONTROLS */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative">
                    <div className="flex items-center bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-1.5 focus-within:border-blue-500/50 focus-within:bg-slate-900 focus-within:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all duration-300 w-64 backdrop-blur-sm">
                        <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Cari (Nama / IP / MAC)..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="bg-transparent text-xs text-white outline-none w-full font-mono placeholder:text-slate-500"
                        />
                    </div>
                    {searchResults.length > 0 && (
                        <div className="absolute top-full mt-2 left-0 w-full bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                            {searchResults.map((res) => (
                                <div
                                    key={res.id}
                                    className="px-4 py-2 text-xs font-mono text-slate-300 hover:bg-blue-600 hover:text-white cursor-pointer border-b border-slate-800/50 last:border-0 transition-colors"
                                    onClick={() => handleSelectSearchResult(res)}
                                >
                                    <div className="font-bold flex justify-between items-center">
                                        <span>{res.data.label}</span>
                                        {res.data.mac && res.data.mac !== '-' && (
                                            <span className="text-[9px] opacity-75 font-normal">{res.data.mac}</span>
                                        )}
                                    </div>
                                    <div className="text-[10px] opacity-70 mt-0.5">{res.data.ip}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleGroup}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all duration-300 px-3 py-1.5 rounded-xl"
                        title="Group perangkat yang dipilih"
                    >
                        <Combine className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">Group</span>
                    </button>
                    <button
                        onClick={handleUngroup}
                        className="flex items-center gap-1.5 text-xs font-bold text-orange-300 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 hover:border-orange-500/40 transition-all duration-300 px-3 py-1.5 rounded-xl"
                        title="Ungroup grup yang dipilih"
                    >
                        <Split className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">Ungroup</span>
                    </button>

                    {hasSelection && (
                        <button
                            onClick={handleRemoveSelected}
                            className="flex items-center gap-1.5 text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 transition-all duration-300 px-3 py-1.5 rounded-xl"
                            title="Keluarkan perangkat yang dipilih dari canvas"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Keluarkan</span>
                        </button>
                    )}

                    <div className="h-5 w-px bg-slate-700/50 mx-0.5"></div>

                    <button
                        onClick={() => setIsSelectMode(!isSelectMode)}
                        className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-xl border transition-all duration-300 ${isSelectMode
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                            : 'bg-slate-800/50 text-slate-300 border-slate-700/50 hover:bg-slate-700 hover:text-white'
                            }`}
                        title={isSelectMode ? "Kembali ke Mode Geser Kanvas" : "Ubah ke Mode Seleksi Area (Seret untuk memilih banyak perangkat)"}
                    >
                        {isSelectMode ? <MousePointer2 className="w-3.5 h-3.5" /> : <Hand className="w-3.5 h-3.5" />}
                        <span className="hidden xl:inline">{isSelectMode ? 'Mode Seleksi' : 'Mode Kanvas'}</span>
                    </button>

                    <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">Koneksi:</span>
                        <select
                            value={connectionType}
                            onChange={(e) => setConnectionType(e.target.value)}
                            className="bg-slate-900 border border-slate-700/80 text-slate-200 outline-none rounded p-0.5 ml-1 font-bold cursor-pointer hover:bg-slate-800 transition-colors text-xs"
                        >
                            <option value="UTP" className="text-blue-400">UTP (Biru)</option>
                            <option value="FO" className="text-red-400">FO (Merah)</option>
                            <option value="Wireless" className="text-purple-400">Wireless (Ungu)</option>
                        </select>
                    </div>

                    <div className="h-5 w-px bg-slate-700/50 mx-0.5"></div>

                    <button
                        onClick={handleResetLayout}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-300 bg-slate-800/80 hover:bg-slate-700 transition-all duration-300 px-3 py-1.5 rounded-xl border border-slate-600/50 hover:text-white"
                        title="Kosongkan canvas drawing ini"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                    </button>
                    <button
                        onClick={handleSaveLayout}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 px-3.5 py-1.5 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] border border-indigo-400/20"
                        title="Simpan perubahan drawing ini ke database"
                    >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Drawing</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
