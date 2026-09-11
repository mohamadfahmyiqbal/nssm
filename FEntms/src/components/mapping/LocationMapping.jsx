import React, { useState, useEffect } from 'react';
import { MapPin, Layers, Search, AlertCircle, CheckCircle2, Info, Copy, MousePointer2, Hand } from 'lucide-react';
import { useDevices } from '../../context/DeviceContext';
import ReactFlow, { Background, Controls, MiniMap, SelectionMode } from 'reactflow';

export const locationPinsData = [
    { id: 'sw-core-1', x: 45, y: 30, zone: 'Server Room' },
    { id: 'sw-dist-a', x: 30, y: 50, zone: 'MDF Room' },
    { id: 'sw-dist-b', x: 50, y: 50, zone: 'MDF Room' },
    { id: 'sw-dist-c', x: 70, y: 45, zone: 'Security Control' },
    { id: 'pc-admin-01', x: 20, y: 70, zone: 'Admin Office' },
    { id: 'prn-hrd-01', x: 25, y: 75, zone: 'HRD Area' },
    { id: 'ap-lt1-02', x: 40, y: 65, zone: 'Corridor Utama' },
    { id: 'door-server', x: 47, y: 35, zone: 'Server Room Access' },
    { id: 'absen-lobby', x: 80, y: 80, zone: 'Main Lobby' },
    { id: 'nvr-01', x: 72, y: 52, zone: 'Security Control' },
    { id: 'cam-lobby-01', x: 85, y: 75, zone: 'Lobby Utama' },
    { id: 'cam-park-02', x: 90, y: 25, zone: 'Area Parkir Outdoor' },
];

const BlueprintNode = () => {
    return (
        <div className="relative w-[1000px] h-[750px] bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 opacity-30 bg-center bg-contain bg-no-repeat filter invert grayscale" style={{ backgroundImage: `url('/assets/hero.png')` }}></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px]"></div>
            <div className="absolute bottom-4 left-4 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-[10px] text-slate-400 backdrop-blur-md">
                <span>BLUEPRINT: PLANT FLOORPLAN V2.4 • SCALE 1:500</span>
            </div>
        </div>
    );
};

const PinNode = ({ data }) => {
    const dev = data.dev;
    const isDown = dev.status === 'down';
    const isWarning = dev.status === 'warning';

    let pinColor = 'bg-emerald-500 text-emerald-950 shadow-emerald-500/50';
    if (isDown) pinColor = 'bg-rose-500 text-rose-950 shadow-rose-500/50 animate-ping';
    if (isWarning) pinColor = 'bg-amber-400 text-amber-950 shadow-amber-400/50 animate-pulse';

    const isCamera = dev.type?.toLowerCase() === 'camera' || dev.label?.toLowerCase().includes('cam') || dev.id?.toLowerCase().includes('cam');
    const numbers = dev.label?.match(/\d+/g);
    const camNumber = dev.camNumber || (numbers ? numbers[numbers.length - 1] : 'C');

    return (
        <div className="relative group cursor-pointer" title={dev.label}>
            <div className={`relative flex items-center justify-center w-6 h-6 rounded-full shadow-lg ${pinColor} border-2 border-white/80`}>
                {isCamera ? (
                    <span className="text-[10px] font-black tracking-tighter">{camNumber}</span>
                ) : (
                    <MapPin className="w-3.5 h-3.5 font-bold" />
                )}
            </div>
            {/* Tooltip Label Saat Hover */}
            <div className="absolute left-1/2 bottom-full mb-1.5 transform -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                <div className="bg-slate-950/95 border border-slate-700 text-slate-100 text-[10px] font-mono px-2.5 py-1 rounded-lg shadow-xl whitespace-pre-wrap text-center backdrop-blur-md max-w-[150px]">
                    <span className="font-bold text-purple-400">{dev.label}</span>
                    <span className="block text-slate-400 text-[9px]">{dev.zone}</span>
                </div>
                <div className="w-2 h-2 bg-slate-950 border-r border-b border-slate-700 transform rotate-45 -mt-1"></div>
            </div>
        </div>
    );
};

const nodeTypes = { blueprint: BlueprintNode, pin: PinNode };

export default function LocationMapping() {
    const { devices } = useDevices();
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [filterFloor, setFilterFloor] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const crosshairHRef = React.useRef(null);
    const crosshairVRef = React.useRef(null);
    const containerRef = React.useRef(null);
    const [isSelectMode, setIsSelectMode] = useState(false);

    const updateCrosshair = (clientX, clientY) => {
        if (!containerRef.current || clientX === undefined || clientY === undefined) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        if (crosshairHRef.current) {
            crosshairHRef.current.style.transform = `translateY(${y}px)`;
            crosshairHRef.current.style.opacity = isSelectMode ? '1' : '0';
        }
        if (crosshairVRef.current) {
            crosshairVRef.current.style.transform = `translateX(${x}px)`;
            crosshairVRef.current.style.opacity = isSelectMode ? '1' : '0';
        }
    };

    const handleMouseMove = (e) => {
        if (!e) return;
        const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
        const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
        if (clientX !== undefined && clientY !== undefined) {
            updateCrosshair(clientX, clientY);
        }
    };

    const handleMouseLeave = () => {
        if (crosshairHRef.current) crosshairHRef.current.style.opacity = '0';
        if (crosshairVRef.current) crosshairVRef.current.style.opacity = '0';
    };

    const [layouts, setLayouts] = useState([
        { id: 'ALL', name: 'ALL ZONES' },
        { id: 'Lantai 1', name: 'LANTAI 1 (PABRIK & OFFICE)' },
        { id: 'Lantai 2', name: 'LANTAI 2 (SERVER ROOM)' }
    ]);

    // Base pin jika ada kecocokan ID dengan DB
    const devicePins = [...locationPinsData];
    const existingPinIds = new Set(devicePins.map(p => p.id.toLowerCase()));
    
    let unmappedIndex = 0;
    
    // Tambahkan node dari devices database
    devices.forEach((dev, idx) => {
        const devName = dev.hostname || dev.name;
        const devId = dev.PID || dev.id || `dev-db-${idx}`;
        
        // Cek apakah device ini sudah ada di locationPinsData (cocok ID atau Nama)
        const isMapped = existingPinIds.has(devId.toLowerCase()) || (devName && existingPinIds.has(devName.toLowerCase()));

        if (!isMapped) {
            devicePins.push({
                id: devId,
                x: 5 + (unmappedIndex % 15) * 6,
                y: 90 + Math.floor(unmappedIndex / 15) * 5,
                zone: 'Unmapped Database Device'
            });
            existingPinIds.add(devId.toLowerCase());
            unmappedIndex++;
        }
    });

    // Gabungkan data dengan koordinat pin peta, hanya tampilkan yang ada di DB
    let mappedDevices = devicePins.map((pin) => {
        // Cari device yang cocok dari database
        const matchedInventory = devices.find(
            (d) => (d.name && d.name.toLowerCase() === pin.id.toLowerCase()) || 
                   (d.hostname && d.hostname.toLowerCase() === pin.id.toLowerCase()) ||
                   (d.PID === pin.id) ||
                   (d.id === pin.id)
        );

        if (!matchedInventory) return null; // Jika ada di location mapping statis tapi tidak di DB, sembunyikan

        return {
            ...pin,
            label: matchedInventory.hostname || matchedInventory.name || pin.id,
            status: matchedInventory.status ? matchedInventory.status.toLowerCase() : 'up',
            ip: matchedInventory.ip || matchedInventory.IP || 'N/A',
            location: matchedInventory.location || pin.zone
        };
    }).filter(Boolean);

    if (searchQuery) {
        mappedDevices = mappedDevices.filter(dev => 
            (dev.label && dev.label.toLowerCase().includes(searchQuery.toLowerCase())) || 
            dev.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    const handleDuplicateLayout = () => {
        if (filterFloor === 'ALL') {
            alert("Pilih layout spesifik terlebih dahulu untuk diduplikasi.");
            return;
        }
        
        const currentLayout = layouts.find(l => l.id === filterFloor);
        if (!currentLayout) return;

        const newId = `Lantai ${layouts.length}`;
        const newLayout = {
            id: newId,
            name: `${currentLayout.name} (COPY)`
        };
        setLayouts([...layouts, newLayout]);
        setFilterFloor(newId);
    };

    const flowNodes = [
        {
            id: 'blueprint-bg',
            type: 'blueprint',
            position: { x: 0, y: 0 },
            data: {},
            selectable: false,
            draggable: false,
            zIndex: 0,
            style: { pointerEvents: 'none' }
        },
        ...mappedDevices.map((dev) => ({
            id: dev.id,
            type: 'pin',
            position: { x: (dev.x / 100) * 1000 - 12, y: (dev.y / 100) * 750 - 12 }, // offset by half pin size (24px/2)
            data: { dev },
            selectable: true,
            draggable: true,
            zIndex: 10
        }))
    ];

    return (
        <div className="w-full h-[calc(100vh-60px)] bg-[#070c14] text-slate-100 flex flex-col font-sans overflow-hidden">
            {/* Sub-Header Kontrol Mapping */}
            <div className="flex items-center justify-between px-6 py-3 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600/20 border border-purple-500/40 rounded-xl text-purple-400">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-black tracking-wider text-sm text-slate-100">FACILITY FLOORPLAN MAPPING</h2>
                        <p className="text-[10px] text-slate-400 font-mono">Real-time physical device coordinates on blueprint</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Pencarian Perangkat */}
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Cari perangkat..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-xl pl-9 pr-4 py-2 font-mono focus:outline-none focus:border-purple-500 w-56 transition-colors"
                        />
                    </div>

                    <div className="h-6 w-px bg-slate-700/50 mx-1"></div>

                    <button
                        onClick={() => setIsSelectMode(!isSelectMode)}
                        className={`flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-xl border transition-all duration-300 ${isSelectMode
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                            : 'bg-slate-800/50 text-slate-300 border-slate-700/50 hover:bg-slate-700 hover:text-white'
                            }`}
                        title={isSelectMode ? "Kembali ke Mode Geser Kanvas" : "Ubah ke Mode Seleksi Area"}
                    >
                        {isSelectMode ? <MousePointer2 className="w-4 h-4" /> : <Hand className="w-4 h-4" />}
                        <span className="hidden xl:inline">{isSelectMode ? 'Mode Seleksi' : 'Mode Kanvas'}</span>
                    </button>

                    <div className="h-6 w-px bg-slate-700/50 mx-1"></div>

                    {/* Filter Lantai / Zona */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto max-w-md custom-scrollbar">
                            {layouts.map(layout => (
                                <button
                                    key={layout.id}
                                    onClick={() => setFilterFloor(layout.id)}
                                    className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${filterFloor === layout.id ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {layout.name}
                                </button>
                            ))}
                        </div>
                        
                        {/* Tombol Duplikasi */}
                        <button
                            onClick={handleDuplicateLayout}
                            title="Duplicate Current Layout"
                            className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 px-3 py-2 rounded-xl border border-purple-500/40 transition-colors flex items-center justify-center gap-2 shrink-0"
                        >
                            <Copy className="w-4 h-4" />
                            <span className="text-xs font-bold font-mono">COPY</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Area Utama Canvas Denah & Pin */}
            <div 
                ref={containerRef}
                className={`flex-1 relative flex bg-[#04070c] overflow-hidden ${isSelectMode ? 'cursor-crosshair' : 'cursor-grab'}`}
                onMouseMoveCapture={handleMouseMove}
                onDragOverCapture={(e) => {
                    e.preventDefault();
                    handleMouseMove(e);
                }}
                onMouseLeave={handleMouseLeave}
            >
                {/* Crosshair Horizontal */}
                <div 
                    ref={crosshairHRef}
                    className="pointer-events-none absolute left-0 right-0 top-0 h-[1px] bg-cyan-400 shadow-[0_0_8px_#22d3ee] z-[9999] transition-none"
                    style={{ opacity: 0 }}
                />
                {/* Crosshair Vertical */}
                <div 
                    ref={crosshairVRef}
                    className="pointer-events-none absolute top-0 bottom-0 left-0 w-[1px] bg-cyan-400 shadow-[0_0_8px_#22d3ee] z-[9999] transition-none"
                    style={{ opacity: 0 }}
                />

                <ReactFlow
                    nodes={flowNodes}
                    nodeTypes={nodeTypes}
                    onNodeClick={(e, node) => {
                        if (node.data.dev) setSelectedDevice(node.data.dev);
                    }}
                    onNodeDrag={(e) => handleMouseMove(e)}
                    onPaneMouseMove={(e) => handleMouseMove(e)}
                    panOnDrag={!isSelectMode}
                    selectionOnDrag={isSelectMode}
                    selectionMode={SelectionMode.Partial}
                    multiSelectionKeyCode="Shift"
                    fitView
                    minZoom={0.2}
                    maxZoom={4}
                    className="w-full h-full"
                >
                    <Background variant="lines" color="#64748b" gap={24} lineWidth={1} className="opacity-50" />
                    <Controls showInteractive={false} className="!bg-slate-900 !border-slate-800 !text-slate-200 fill-slate-200" />
                    <MiniMap nodeColor="#1e293b" maskColor="rgba(7, 12, 20, 0.7)" className="!bg-slate-950 !border-slate-800" />
                </ReactFlow>

                {/* Panel Detail Samping Saat Perangkat Dipilih */}
                {selectedDevice && (
                    <div className="absolute right-6 top-6 bottom-6 z-30 w-80 bg-slate-950/95 border border-purple-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md font-mono text-xs text-slate-300 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                                <div className="flex items-center gap-2 text-purple-400 font-bold">
                                    <Info className="w-4 h-4" />
                                    <span>DEVICE LOCATION DETAILS</span>
                                </div>
                                <button
                                    onClick={() => setSelectedDevice(null)}
                                    className="text-slate-400 hover:text-slate-200 text-sm font-bold"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-3 text-[11px]">
                                <div>
                                    <span className="text-slate-500 block text-[10px]">DEVICE NAME</span>
                                    <span className="font-bold text-slate-100 text-sm">{selectedDevice.label}</span>
                                </div>

                                <div className="bg-purple-950/30 border border-purple-900/50 p-3 rounded-xl space-y-1">
                                    <span className="text-purple-400 block text-[10px] font-bold">TITIK KOORDINAT FISIK:</span>
                                    <p className="text-slate-200 font-semibold">{selectedDevice.location || selectedDevice.zone}</p>
                                    <p className="text-[10px] text-slate-400">Mapping Zone: X: {selectedDevice.x}%, Y: {selectedDevice.y}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-800 pt-3">
                            <button
                                onClick={() => alert(`Mengarahkan ke live kamera / log untuk ${selectedDevice.label}`)}
                                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-600/30"
                            >
                                INSPECT HARDWARE
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}