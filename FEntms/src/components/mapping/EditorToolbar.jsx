import React from 'react';
import {
    Square, PenTool, Video, Server, Wifi, Monitor, Edit2,
    Download, MousePointer, Trash2, Undo, Hand, Spline, Database, RotateCcw, Plus, Layers, Copy, ArrowUp, ArrowDown, Footprints, Eye, EyeOff, Search, Router, Box, Network, Shield, Zap, Battery, ArrowRightLeft, ChevronDown, HardDrive
} from 'lucide-react';

export default function EditorToolbar({
    tool,
    setTool,
    gridSnap = 20,
    setGridSnap,
    showRoomLabels = true,
    setShowRoomLabels,
    history,
    selectedIds,
    floorplansList = [],
    activeFloorplan,
    onSelectFloorplan,
    onCreateNewDrawing,
    onDeleteDrawing,
    onDuplicateDrawing,
    onRenameDrawing,
    onUndo,
    onDelete,
    onDuplicate,
    onBringToFront,
    onSendToBack,
    onExport,
    onSaveDB,
    isSavingDB,
    onResetCanvas,
    devices = [],
    rooms = [],
    setSelectedIds,
    onSelectSearchResult
}) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = React.useState(false);

    const deviceOptions = [
        { value: 'server', label: 'Server', icon: Server, color: 'text-amber-400' },
        { value: 'switch', label: 'Switch', icon: Server, color: 'text-cyan-400' },
        { value: 'ap', label: 'Access Point (AP)', icon: Wifi, color: 'text-emerald-400' },
        { value: 'camera', label: 'CCTV', icon: Video, color: 'text-purple-400' },
        { value: 'pc', label: 'PC', icon: Monitor, color: 'text-pink-400' },
        { value: 'firewall', label: 'Firewall', icon: Shield, color: 'text-orange-400' },
        { value: 'modem', label: 'Modem', icon: Router, color: 'text-red-400' },
        { value: 'otb', label: 'OTB', icon: Box, color: 'text-zinc-400' },
        { value: 'cable', label: 'Cable Mgt', icon: Network, color: 'text-yellow-400' },
        { value: 'ups', label: 'UPS', icon: Zap, color: 'text-yellow-500' },
        { value: 'ups-battery', label: 'UPS Battery', icon: Battery, color: 'text-lime-500' },
        { value: 'ats', label: 'ATS', icon: ArrowRightLeft, color: 'text-sky-500' },
        { value: 'nas', label: 'NAS', icon: HardDrive, color: 'text-indigo-400' },
    ];
    const isDeviceSelected = deviceOptions.some(d => d.value === tool);
    const selectedDeviceOpt = deviceOptions.find(d => d.value === tool);

    const searchResults = React.useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        
        const matchedDevices = devices.filter(d => (d.label || d.id).toLowerCase().includes(q));
        const matchedRooms = rooms.filter(r => (r.label || r.id).toLowerCase().includes(q));
        
        return [...matchedDevices, ...matchedRooms].slice(0, 8); // Batasi 8 hasil
    }, [searchQuery, devices, rooms]);

    const handleSelectResult = (id) => {
        if (onSelectSearchResult) {
            onSelectSearchResult(id);
        } else if (setSelectedIds) {
            setSelectedIds([id]);
        }
        setSearchQuery('');
        setShowSuggestions(false);
    };
    return (
        <div className="flex flex-col gap-2 mb-3 bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 shadow-xl">
            {/* SELECTOR DRAWING & GRID SNAP */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-2 gap-2">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-600/20 border border-indigo-500/40 rounded-lg text-indigo-400">
                            <Layers className="w-4 h-4" />
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-300">DRAWING:</span>
                        <div className="flex items-center gap-1">
                            <select
                                value={activeFloorplan?.id || ''}
                                onChange={(e) => onSelectFloorplan(Number(e.target.value))}
                                className="bg-slate-900 border border-slate-700 text-amber-400 font-bold font-mono text-xs rounded-lg px-3 py-1 cursor-pointer outline-none hover:border-amber-500/60"
                            >
                                {floorplansList.map((fp, idx) => (
                                    <option key={`${fp.id}-${idx}`} value={fp.id}>
                                        {fp.type === 'MASTER' ? '⭐ [MASTER] ' : '📄 [DETAIL] '} {fp.name}
                                    </option>
                                ))}
                            </select>
                            {activeFloorplan && (
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

                    <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
                        <span className="font-mono text-xs font-bold text-slate-400">SNAP:</span>
                        <select
                            value={gridSnap}
                            onChange={(e) => setGridSnap?.(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-700 text-emerald-400 font-bold font-mono text-xs rounded-lg px-2.5 py-1 cursor-pointer outline-none hover:border-emerald-500/60"
                            title="Presisi / Ukuran Snap Grid Kanvas"
                        >
                            <option value={1}>Off (1px)</option>
                            <option value={5}>5px (Sangat Halus)</option>
                            <option value={10}>10px (Halus)</option>
                            <option value={20}>20px (Standar)</option>
                            <option value={50}>50px (Besar)</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2 font-mono">
                    {/* FITUR FIND / SEARCH */}
                    <div className="relative">
                        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 focus-within:border-purple-500 transition-colors">
                            <Search className="w-3.5 h-3.5 text-slate-500 mr-2" />
                            <input
                                type="text"
                                placeholder="Find device/room..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                className="bg-transparent border-none text-xs text-slate-200 outline-none w-36 placeholder-slate-600"
                            />
                        </div>

                        {/* Dropdown Hasil Pencarian */}
                        {showSuggestions && searchQuery && searchResults.length > 0 && (
                            <div className="absolute top-full mt-1 left-0 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                                {searchResults.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleSelectResult(item.id)}
                                        className="px-3 py-2 text-xs text-slate-300 hover:bg-purple-600/30 hover:text-white cursor-pointer border-b border-slate-800 last:border-none flex items-center justify-between"
                                    >
                                        <span className="font-bold">{item.label || item.id}</span>
                                        <span className="text-[9px] text-slate-500">{item.type || 'room'}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {showSuggestions && searchQuery && searchResults.length === 0 && (
                            <div className="absolute top-full mt-1 left-0 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 px-3 py-2 text-xs text-slate-500 text-center">
                                Not found
                            </div>
                        )}
                    </div>

                    <span className="text-slate-700 font-bold px-1">|</span>

                    <button
                        onClick={onCreateNewDrawing}
                        className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all text-[11px]"
                        title="Tambah Denah/Drawing Baru"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Drawing</span>
                    </button>

                    <button
                        onClick={onDuplicateDrawing}
                        className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition-all text-[11px]"
                        title="Duplikat Drawing Aktif"
                    >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Drawing</span>
                    </button>

                    <button
                        onClick={onDeleteDrawing}
                        className="flex items-center gap-1 px-2 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/50 text-rose-300 rounded-lg font-bold transition-all text-[11px]"
                        title="Hapus Drawing Aktif Ini"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Plan</span>
                    </button>
                </div>
            </div>

            {/* TOOLBAR GAMBAR & AKSI */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1 font-mono">
                    <button
                        onClick={() => setTool(tool === 'select' ? 'pan' : 'select')}
                        className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border transition-all duration-300 ${tool === 'select'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                            : 'bg-slate-800/50 text-slate-300 border-slate-700/50 hover:bg-slate-700 hover:text-white'
                            }`}
                        title={tool === 'select' ? "Kembali ke Mode Geser Kanvas" : "Ubah ke Mode Seleksi Area"}
                    >
                        {tool === 'select' ? <MousePointer className="w-3.5 h-3.5" /> : <Hand className="w-3.5 h-3.5" />}
                        <span className="hidden xl:inline">{tool === 'select' ? 'Mode Seleksi' : 'Mode Kanvas'}</span>
                    </button>

                    <button
                        onClick={() => setTool('wall')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${tool === 'wall' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Wall</span>
                    </button>

                    <button
                        onClick={() => setTool('curve')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${tool === 'curve' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400 hover:text-indigo-300'}`}
                        title="Gambar Garis Melengkung / Kurva Kabel"
                    >
                        <Spline className="w-3.5 h-3.5" />
                        <span>Curve</span>
                    </button>

                    <button
                        onClick={() => setTool('fo')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${tool === 'fo' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-orange-400 hover:text-orange-300'}`}
                        title="Gambar Kabel FO"
                    >
                        <Spline className="w-3.5 h-3.5" />
                        <span>FO</span>
                    </button>

                    <button
                        onClick={() => setTool('utp')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${tool === 'utp' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-sky-400 hover:text-sky-300'}`}
                        title="Gambar Kabel UTP"
                    >
                        <Spline className="w-3.5 h-3.5" />
                        <span>UTP</span>
                    </button>

                    <button
                        onClick={() => setTool('room')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${tool === 'room' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                        <Square className="w-3.5 h-3.5" />
                        <span>Room</span>
                    </button>

                    <button
                        onClick={() => setTool('stairs')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${tool === 'stairs' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-orange-400 hover:text-orange-300'}`}
                        title="Tambah Tangga / Stairs"
                    >
                        <Footprints className="w-3.5 h-3.5" />
                        <span>Stairs</span>
                    </button>

                    <span className="text-slate-700 font-bold px-1">|</span>

                    {/* Perangkat Custom Dropdown */}
                    <div className="flex items-center gap-2 border-l border-slate-800 pl-2 relative">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Device:</span>
                        <div 
                            className={`flex items-center gap-2 bg-slate-900 border font-bold font-mono text-xs rounded-lg px-2.5 py-1.5 cursor-pointer transition-all ${
                                isDeviceSelected
                                ? 'text-white border-blue-500/60 shadow-[0_0_10px_rgba(59,130,246,0.15)] bg-blue-900/20'
                                : 'border-slate-700 text-slate-400 hover:border-slate-500'
                            }`}
                            onClick={() => setIsDeviceDropdownOpen(!isDeviceDropdownOpen)}
                        >
                            {selectedDeviceOpt ? (
                                <>
                                    <selectedDeviceOpt.icon className={`w-3.5 h-3.5 ${selectedDeviceOpt.color}`} />
                                    <span>{selectedDeviceOpt.label}</span>
                                </>
                            ) : (
                                <span>-- Pilih Perangkat --</span>
                            )}
                            <ChevronDown className="w-3.5 h-3.5 ml-1" />
                        </div>

                        {/* Dropdown Menu */}
                        {isDeviceDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsDeviceDropdownOpen(false)}></div>
                                <div className="absolute top-full left-12 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                                    {deviceOptions.map((opt) => (
                                        <div
                                            key={opt.value}
                                            onClick={() => {
                                                setTool(opt.value);
                                                setIsDeviceDropdownOpen(false);
                                            }}
                                            className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold text-slate-300 hover:bg-slate-800 cursor-pointer border-b border-slate-800/50 last:border-none"
                                        >
                                            <opt.icon className={`w-3.5 h-3.5 ${opt.color}`} />
                                            <span className={tool === opt.value ? 'text-white' : ''}>{opt.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={onSaveDB}
                        disabled={isSavingDB}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono font-bold transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50"
                    >
                        <Database className="w-3.5 h-3.5" />
                        <span>{isSavingDB ? 'Saving...' : 'Save DB'}</span>
                    </button>

                    <span className="text-slate-700 font-bold px-0.5">|</span>

                    <button
                        onClick={onResetCanvas}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-950/80 text-rose-400 border border-slate-700/50 rounded-lg font-mono font-bold transition-all"
                        title="Kosongkan Kanvas Aktif Ini"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                    </button>

                    <button
                        onClick={() => setShowRoomLabels?.(!showRoomLabels)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold transition-all ${showRoomLabels ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
                        title={showRoomLabels ? "Sembunyikan Nama & Ukuran Ruangan" : "Tampilkan Nama & Ukuran Ruangan"}
                    >
                        {showRoomLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>Labels</span>
                    </button>

                    <button
                        onClick={onUndo}
                        disabled={history.length === 0}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold transition-colors ${history.length > 0 ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-900 text-slate-600 cursor-not-allowed'}`}
                    >
                        <Undo className="w-3.5 h-3.5" />
                        <span>Undo</span>
                    </button>

                    <button
                        onClick={onDuplicate}
                        disabled={!selectedIds || selectedIds.length === 0}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold transition-all ${selectedIds?.length > 0 ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-900 text-slate-600 cursor-not-allowed'}`}
                        title="Duplikat Objek Terpilih"
                    >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Duplicate</span>
                    </button>

                    <button
                        onClick={onBringToFront}
                        disabled={!selectedIds || selectedIds.length === 0}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-mono font-bold transition-all ${selectedIds?.length > 0 ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700' : 'bg-slate-900 text-slate-600 cursor-not-allowed'}`}
                        title="Pindahkan Objek ke Lapisan Terdepan (Bring to Front)"
                    >
                        <ArrowUp className="w-3.5 h-3.5" />
                        <span>Front</span>
                    </button>

                    <button
                        onClick={onSendToBack}
                        disabled={!selectedIds || selectedIds.length === 0}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-mono font-bold transition-all ${selectedIds?.length > 0 ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700' : 'bg-slate-900 text-slate-600 cursor-not-allowed'}`}
                        title="Pindahkan Objek ke Lapisan Terbelakang (Send to Back)"
                    >
                        <ArrowDown className="w-3.5 h-3.5" />
                        <span>Back</span>
                    </button>

                    <button
                        onClick={onDelete}
                        disabled={!selectedIds || selectedIds.length === 0}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold transition-colors ${selectedIds?.length > 0 ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30' : 'bg-slate-900 text-slate-600 cursor-not-allowed'}`}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                    </button>

                    <button
                        onClick={onExport}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-mono font-bold"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>PNG</span>
                    </button>
                </div>
            </div>
        </div>
    );
}