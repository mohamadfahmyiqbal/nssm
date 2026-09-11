import React from 'react';
import { Bell, BellOff, Eye, EyeOff } from 'lucide-react';

export default function PropertyPanel({
    tool,
    selectedIds,
    setSelectedIds,
    rooms = [],
    devices = [],
    lines = [],
    selectedRoom,
    selectedDevice,
    selectedLine,
    linesCount,
    roomsCount,
    devicesCount,
    setRooms,
    setDevices,
    setLines,
    saveHistory,
    gridSize,
    notificationPrefs = {},
    handleNotificationToggle = () => {}
}) {
    const selectedId = selectedIds?.length === 1 ? selectedIds[0] : null;

    return (
        <div className="w-full lg:w-72 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
            <div>
                <h3 className="font-extrabold text-xs tracking-wider text-slate-200 uppercase border-b border-slate-800 pb-2 mb-3">
                    CANVAS PROPERTIES
                </h3>

                <div className="flex flex-col gap-3 font-mono text-xs">
                    {/* Quick Select Object Dropdown */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-indigo-500/30">
                        <label className="text-[10px] text-indigo-400 font-bold uppercase block mb-1">
                            PILIH ELEMEN (SELECT)
                        </label>
                        <select
                            value={selectedIds?.length === 1 ? selectedIds[0] : ''}
                            onChange={(e) => setSelectedIds?.(e.target.value ? [e.target.value] : [])}
                            className="bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs rounded-lg px-2.5 py-1.5 w-full cursor-pointer outline-none hover:border-indigo-500"
                        >
                            <option value="">-- Pilih Objek Kanvas --</option>

                            {rooms.length > 0 && (
                                <optgroup label="🏢 Ruangan">
                                    {rooms.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            Ruang: {r.label}
                                        </option>
                                    ))}
                                </optgroup>
                            )}

                            {devices.length > 0 && (
                                <optgroup label="🖥️ Perangkat">
                                    {devices.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            [{d.type.toUpperCase()}] {d.label}
                                        </option>
                                    ))}
                                </optgroup>
                            )}

                            {lines.length > 0 && (
                                <optgroup label="🔌 Garis / Kabel">
                                    {lines.map((l, index) => (
                                        <option key={l.id} value={l.id}>
                                            Garis #{index + 1} {l.isCurve ? '(Kurva)' : '(Lurus)'}
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase">Active Tool</span>
                        <div className="font-bold text-amber-400 mt-0.5 uppercase">{tool}</div>
                    </div>

                    {/* Edit Form Ruangan */}
                    {selectedRoom ? (
                        <div className="p-3 bg-slate-950 rounded-xl border border-blue-500/40 space-y-2">
                            <span className="text-[10px] text-blue-400 uppercase font-bold block">Edit Ruangan</span>
                            <div>
                                <label className="text-[10px] text-slate-400">Nama Ruangan:</label>
                                <textarea
                                    value={selectedRoom.label || ''}
                                    onChange={(e) => {
                                        const newLabel = e.target.value;
                                        setRooms((prev) => prev.map((r) => r.id === selectedRoom.id ? { ...r, label: newLabel } : r));
                                    }}
                                    className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white text-xs w-full mt-0.5 resize-y min-h-[40px]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400">Rotasi Teks (Derajat):</label>
                                <input
                                    type="number"
                                    value={selectedRoom.labelRotation || 0}
                                    onChange={(e) => {
                                        const newRot = parseInt(e.target.value) || 0;
                                        setRooms((prev) => prev.map((r) => r.id === selectedRoom.id ? { ...r, labelRotation: newRot } : r));
                                    }}
                                    className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white text-xs w-full mt-0.5"
                                />
                            </div>

                            {/* Koordinat X & Y Ruangan */}
                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900">
                                <div>
                                    <label className="text-[10px] text-slate-400">Posisi X (px):</label>
                                    <input
                                        type="number"
                                        step={gridSize > 1 ? gridSize : 1}
                                        value={selectedRoom.x || 0}
                                        onChange={(e) => {
                                            const newX = parseInt(e.target.value) || 0;
                                            saveHistory();
                                            setRooms((prev) => prev.map((r) => r.id === selectedRoom.id ? { ...r, x: newX } : r));
                                        }}
                                        className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-blue-400 font-bold text-xs w-full mt-0.5"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] text-slate-400">Posisi Y (px):</label>
                                    <input
                                        type="number"
                                        step={gridSize > 1 ? gridSize : 1}
                                        value={selectedRoom.y || 0}
                                        onChange={(e) => {
                                            const newY = parseInt(e.target.value) || 0;
                                            saveHistory();
                                            setRooms((prev) => prev.map((r) => r.id === selectedRoom.id ? { ...r, y: newY } : r));
                                        }}
                                        className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-blue-400 font-bold text-xs w-full mt-0.5"
                                    />
                                </div>
                            </div>

                            {/* Dimensi Lebar & Tinggi */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                    <label className="text-[10px] text-slate-400">Lebar (px):</label>
                                    <input
                                        type="number"
                                        step={gridSize > 1 ? gridSize : 1}
                                        min={1}
                                        value={selectedRoom.width}
                                        onChange={(e) => {
                                            const newWidth = Math.max(1, parseInt(e.target.value) || 1);
                                            saveHistory();
                                            setRooms((prev) => prev.map((r) => r.id === selectedRoom.id ? { ...r, width: newWidth } : r));
                                        }}
                                        className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-emerald-400 font-bold text-xs w-full mt-0.5"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] text-slate-400">Tinggi (px):</label>
                                    <input
                                        type="number"
                                        step={gridSize > 1 ? gridSize : 1}
                                        min={1}
                                        value={selectedRoom.height}
                                        onChange={(e) => {
                                            const newHeight = Math.max(1, parseInt(e.target.value) || 1);
                                            saveHistory();
                                            setRooms((prev) => prev.map((r) => r.id === selectedRoom.id ? { ...r, height: newHeight } : r));
                                        }}
                                        className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-emerald-400 font-bold text-xs w-full mt-0.5"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : selectedDevice ? (
                        /* Edit Form Perangkat */
                        <div className="p-3 bg-slate-950 rounded-xl border border-purple-500/40 space-y-2">
                            <span className="text-[10px] text-purple-400 uppercase font-bold block">Edit Perangkat ({selectedDevice.type.toUpperCase()})</span>
                            <div>
                                <label className="text-[10px] text-slate-400">Nama Perangkat / Label:</label>
                                <textarea
                                    value={selectedDevice.label || ''}
                                    onChange={(e) => {
                                        const newLabel = e.target.value;
                                        setDevices((prev) => prev.map((d) => d.id === selectedDevice.id ? { ...d, label: newLabel, originalLabel: d.originalLabel || d.label } : d));
                                    }}
                                    className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white text-xs w-full mt-0.5 resize-y min-h-[40px]"
                                    placeholder="Contoh: CAM-01&#10;Lobby"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400">Rotasi Teks (Derajat):</label>
                                <input
                                    type="number"
                                    value={selectedDevice.labelRotation || 0}
                                    onChange={(e) => {
                                        const newRot = parseInt(e.target.value) || 0;
                                        setDevices((prev) => prev.map((d) => d.id === selectedDevice.id ? { ...d, labelRotation: newRot } : d));
                                    }}
                                    className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white text-xs w-full mt-0.5"
                                />
                            </div>

                            {selectedDevice.type?.toLowerCase() === 'camera' && (
                                <div>
                                    <label className="text-[10px] text-slate-400">Nomor/Inisial Kamera:</label>
                                    <input
                                        type="text"
                                        value={selectedDevice.camNumber || ''}
                                        onChange={(e) => {
                                            const newVal = e.target.value;
                                            setDevices((prev) => prev.map((d) => d.id === selectedDevice.id ? { ...d, camNumber: newVal } : d));
                                        }}
                                        className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white text-xs w-full mt-0.5"
                                        placeholder="Contoh: 12, C1"
                                    />
                                </div>
                            )}

                            {selectedDevice.type?.toLowerCase() === 'ap' && (
                                <div className="pt-2 border-t border-slate-900 mt-2 mb-2">
                                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                                        <span>Radius Coverage (px):</span>
                                        <span className="text-emerald-400 font-bold">{selectedDevice.coverage || 120} px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="20"
                                        max="1000"
                                        step="10"
                                        value={selectedDevice.coverage || 120}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            saveHistory();
                                            setDevices((prev) => prev.map((d) => d.id === selectedDevice.id ? { ...d, coverage: val } : d));
                                        }}
                                        className="w-full mt-1 accent-emerald-500 cursor-pointer"
                                    />
                                </div>
                            )}

                            {selectedDevice.type?.toLowerCase() !== 'cable' && selectedDevice.type?.toLowerCase() !== 'otb' && (
                                <div>
                                    <label className="text-[10px] text-slate-400">Alamat IP (IP Address):</label>
                                    <input
                                        type="text"
                                        value={selectedDevice.ip || ''}
                                        onChange={(e) => {
                                            const newIp = e.target.value;
                                            setDevices((prev) => prev.map((d) => d.id === selectedDevice.id ? { ...d, ip: newIp } : d));
                                        }}
                                        className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-cyan-400 font-bold font-mono text-xs w-full mt-0.5"
                                        placeholder="Contoh: 192.168.1.100"
                                    />
                                </div>
                            )}

                            {/* Koordinat X & Y Perangkat */}
                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900">
                                <div>
                                    <label className="text-[10px] text-slate-400">Posisi X (px):</label>
                                    <input
                                        type="number"
                                        step={gridSize > 1 ? gridSize : 1}
                                        value={selectedDevice.x || 0}
                                        onChange={(e) => {
                                            const newX = parseInt(e.target.value) || 0;
                                            saveHistory();
                                            setDevices((prev) => prev.map((d) => d.id === selectedDevice.id ? { ...d, x: newX } : d));
                                        }}
                                        className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-purple-400 font-bold text-xs w-full mt-0.5"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] text-slate-400">Posisi Y (px):</label>
                                    <input
                                        type="number"
                                        step={gridSize > 1 ? gridSize : 1}
                                        value={selectedDevice.y || 0}
                                        onChange={(e) => {
                                            const newY = parseInt(e.target.value) || 0;
                                            saveHistory();
                                            setDevices((prev) => prev.map((d) => d.id === selectedDevice.id ? { ...d, y: newY } : d));
                                        }}
                                        className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-purple-400 font-bold text-xs w-full mt-0.5"
                                    />
                                </div>
                            </div>

                            {/* Slider Rotasi (Khusus Kamera) */}
                            {selectedDevice.type === 'camera' && (
                                <div className="pt-2 border-t border-slate-900 mt-2">
                                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                                        <span>Rotasi Arah Sorotan:</span>
                                        <span className="text-purple-400 font-bold">{selectedDevice.rotation || 0}°</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="360"
                                        step="15"
                                        value={selectedDevice.rotation || 0}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            saveHistory();
                                            setDevices((prev) => prev.map((d) => d.id === selectedDevice.id ? { ...d, rotation: val } : d));
                                        }}
                                        className="w-full mt-1 accent-purple-500 cursor-pointer"
                                    />
                                </div>
                            )}

                            {/* Notification Toggle */}
                            {selectedDevice.type?.toLowerCase() !== 'cable' && selectedDevice.type?.toLowerCase() !== 'otb' && (
                                <div className="pt-2 border-t border-slate-900 mt-2">
                                    <div 
                                        className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-800 cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNotificationToggle(selectedDevice.originalLabel || selectedDevice.label);
                                        }}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            {notificationPrefs[selectedDevice.label] !== false && notificationPrefs[selectedDevice.originalLabel || selectedDevice.label] !== false ? (
                                                <Bell className="w-3 h-3 text-emerald-400" />
                                            ) : (
                                                <BellOff className="w-3 h-3 text-rose-400" />
                                            )}
                                            <span className="text-[9px] text-slate-400 font-bold tracking-wider">NOTIFIKASI ALERT</span>
                                        </div>
                                        <button
                                            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                (notificationPrefs[selectedDevice.label] !== false && notificationPrefs[selectedDevice.originalLabel || selectedDevice.label] !== false) ? 'bg-emerald-500' : 'bg-slate-700'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                    (notificationPrefs[selectedDevice.label] !== false && notificationPrefs[selectedDevice.originalLabel || selectedDevice.label] !== false) ? 'translate-x-3' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Hide Icon Toggle */}
                            <div className="pt-2 border-t border-slate-900 mt-2">
                                <div 
                                    className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-800 cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        saveHistory();
                                        setDevices((prev) => prev.map((d) => d.id === selectedDevice.id ? { ...d, hideIcon: !d.hideIcon } : d));
                                    }}
                                >
                                    <div className="flex items-center gap-1.5">
                                        {selectedDevice.hideIcon ? (
                                            <EyeOff className="w-3 h-3 text-sky-400" />
                                        ) : (
                                            <Eye className="w-3 h-3 text-emerald-400" />
                                        )}
                                        <span className="text-[9px] text-slate-400 font-bold tracking-wider">SEMBUNYIKAN IKON PERANGKAT</span>
                                    </div>
                                    <button
                                        className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            selectedDevice.hideIcon ? 'bg-sky-500' : 'bg-slate-700'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                selectedDevice.hideIcon ? 'translate-x-3' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : selectedLine ? (
                        /* Edit Form Garis / Kurva / Wall */
                        <div className="p-3 bg-slate-950 rounded-xl border border-indigo-500/40 space-y-2">
                            <span className="text-[10px] text-indigo-400 uppercase font-bold block">
                                Edit Garis / Dinding {selectedLine.isCurve ? '(Kurva)' : '(Lurus)'}
                            </span>

                            {/* Info & Input Panjang Dinding */}
                            {(() => {
                                const pts = selectedLine.points || [0, 0, 0, 0];
                                const x1 = pts[0], y1 = pts[1];
                                const x2 = pts[pts.length - 2], y2 = pts[pts.length - 1];
                                const currentLen = Math.round(Math.hypot(x2 - x1, y2 - y1));

                                return (
                                    <div className="space-y-2 border-b border-slate-900 pb-2">
                                        <div>
                                            <label className="text-[10px] text-slate-400">Panjang Dinding (px):</label>
                                            <input
                                                type="number"
                                                min={1}
                                                step={gridSize > 1 ? gridSize : 1}
                                                value={currentLen}
                                                onChange={(e) => {
                                                    const targetLen = Math.max(1, parseInt(e.target.value) || 1);
                                                    if (currentLen === 0) return;
                                                    const ratio = targetLen / currentLen;
                                                    const newX2 = Math.round(x1 + (x2 - x1) * ratio);
                                                    const newY2 = Math.round(y1 + (y2 - y1) * ratio);

                                                    saveHistory();
                                                    setLines((prev) => prev.map((l) => {
                                                        if (l.id === selectedLine.id) {
                                                            let newPts = [...l.points];
                                                            newPts[newPts.length - 2] = newX2;
                                                            newPts[newPts.length - 1] = newY2;
                                                            return { ...l, points: newPts };
                                                        }
                                                        return l;
                                                    }));
                                                }}
                                                className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-amber-400 font-bold text-xs w-full mt-0.5"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div>
                                                <label className="text-slate-400">Posisi X1 (Awal):</label>
                                                <input
                                                    type="number"
                                                    step={gridSize > 1 ? gridSize : 1}
                                                    value={x1}
                                                    onChange={(e) => {
                                                        const nx = parseInt(e.target.value) || 0;
                                                        const dx = nx - x1;
                                                        saveHistory();
                                                        setLines((prev) => prev.map((l) => {
                                                            if (l.id === selectedLine.id) {
                                                                return { ...l, points: l.points.map((v, i) => (i % 2 === 0 ? v + dx : v)) };
                                                            }
                                                            return l;
                                                        }));
                                                    }}
                                                    className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-indigo-300 font-bold text-xs w-full mt-0.5"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-slate-400">Posisi Y1 (Awal):</label>
                                                <input
                                                    type="number"
                                                    step={gridSize > 1 ? gridSize : 1}
                                                    value={y1}
                                                    onChange={(e) => {
                                                        const ny = parseInt(e.target.value) || 0;
                                                        const dy = ny - y1;
                                                        saveHistory();
                                                        setLines((prev) => prev.map((l) => {
                                                            if (l.id === selectedLine.id) {
                                                                return { ...l, points: l.points.map((v, i) => (i % 2 !== 0 ? v + dy : v)) };
                                                            }
                                                            return l;
                                                        }));
                                                    }}
                                                    className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-indigo-300 font-bold text-xs w-full mt-0.5"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Toggle Tipe Garis */}
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Tipe Garis:</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <button
                                        onClick={() => {
                                            saveHistory();
                                            setLines((prev) => prev.map((l) => l.id === selectedLine.id ? { ...l, isCurve: false, tension: 0 } : l));
                                        }}
                                        className={`py-1 rounded font-bold text-[10px] border ${!selectedLine.isCurve ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                                    >
                                        Lurus
                                    </button>
                                    <button
                                        onClick={() => {
                                            saveHistory();
                                            setLines((prev) => prev.map((l) => l.id === selectedLine.id ? { ...l, isCurve: true, tension: l.tension || 0.4 } : l));
                                        }}
                                        className={`py-1 rounded font-bold text-[10px] border ${selectedLine.isCurve ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                                    >
                                        Kurva
                                    </button>
                                </div>
                            </div>

                            {/* Slider Kelengkungan / Tension */}
                            {selectedLine.isCurve && (
                                <div className="pt-1">
                                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                                        <span>Kelengkungan (Tension):</span>
                                        <span className="text-indigo-400 font-bold">{Math.round((selectedLine.tension || 0.4) * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="1.0"
                                        step="0.05"
                                        value={selectedLine.tension || 0.4}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setLines((prev) => prev.map((l) => l.id === selectedLine.id ? { ...l, tension: val } : l));
                                        }}
                                        className="w-full mt-1 accent-indigo-500 cursor-pointer"
                                    />
                                </div>
                            )}

                            {/* Warna Garis */}
                            <div className="pt-1">
                                <label className="text-[10px] text-slate-400 block mb-1">Warna Garis:</label>
                                <div className="flex gap-1.5">
                                    {['#38bdf8', '#a855f7', '#f59e0b', '#10b981', '#f43f5e'].map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => {
                                                saveHistory();
                                                setLines((prev) => prev.map((l) => l.id === selectedLine.id ? { ...l, color } : l));
                                            }}
                                            className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform"
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : selectedIds?.length > 1 ? (
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase">Selected Objects</span>
                            <div className="font-bold text-emerald-400 mt-1">
                                {selectedIds.length} elemen terpilih
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                                Anda dapat menggeser, menghapus, atau menduplikasi elemen-elemen ini secara bersamaan.
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase">Selected Object</span>
                            <div className="font-bold text-slate-400 mt-0.5 truncate">
                                Klik objek atau drag untuk memilih
                            </div>
                        </div>
                    )}

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase">Total Elements</span>
                        <div className="text-slate-300 mt-1 space-y-1 text-[11px]">
                            <div>• Garis / Kurva: {linesCount}</div>
                            <div>• Ruangan: {roomsCount}</div>
                            <div>• Perangkat: {devicesCount}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl text-[10px] text-blue-300 font-mono space-y-1">
                <div>🌐 <strong>Network Mapping Active:</strong></div>
                <div>• Gunakan <strong>Curve</strong> untuk membuat jalur kabel melengkung.</div>
                <div>• Klik garis kurva untuk mengubah kelengkungan & warna.</div>
            </div>
        </div>
    );
}