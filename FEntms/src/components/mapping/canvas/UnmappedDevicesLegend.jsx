import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, MapPinOff, Search, LocateFixed } from 'lucide-react';
import { useDevices } from '../../../context/DeviceContext';

export default function UnmappedDevicesLegend({ currentDevices = [], nodes = [], onFocusNode, className = '' }) {
    const { devices: allDevices } = useDevices();
    const [isOpen, setIsOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Mapping status helper (berbasis ID unik & PID)
    const mappedDeviceMap = useMemo(() => {
        const map = new Map();
        nodes.forEach(n => {
            const nodeId = String(n.id || '').trim().toLowerCase();
            const dataId = String(n.data?.id || '').trim().toLowerCase();
            const label = String(n.data?.label || '').trim().toLowerCase();

            if (nodeId) map.set(nodeId, n);
            if (dataId) map.set(dataId, n);
            if (label && !map.has(label)) map.set(label, n);
        });
        return map;
    }, [nodes]);

    // Pisahkan perangkat yang belum dan sudah ada di canvas
    const { unmappedDevices, mappedDevices } = useMemo(() => {
        const unmapped = [];
        const mapped = [];

        (allDevices || []).forEach(d => {
            const devPid = String(d.PID || '').trim().toLowerCase();
            const devId = String(d.id || '').trim().toLowerCase();
            const devName = String(d.name || d.hostname || '').trim().toLowerCase();

            // Prioritaskan pencocokan via PID/ID unik
            const matchedNode = (devPid && mappedDeviceMap.get(devPid)) ||
                                (devId && mappedDeviceMap.get(devId)) ||
                                (devName && mappedDeviceMap.get(devName));

            if (matchedNode) {
                mapped.push({ ...d, canvasNode: matchedNode });
            } else {
                unmapped.push(d);
            }
        });

        return { unmappedDevices: unmapped, mappedDevices: mapped };
    }, [allDevices, mappedDeviceMap]);

    const filterHelper = (list) => {
        if (!searchQuery.trim()) return list;
        const q = searchQuery.toLowerCase().trim();
        const cleanQ = q.replace(/[:-]/g, '');

        return list.filter(d => {
            const devName = (d.name || d.hostname || d.label || '').toLowerCase();
            const devIp = (d.ip || d.IP || '').toLowerCase();
            const devMac = (d.mac || d.MAC || '').toLowerCase();
            const cleanMac = devMac.replace(/[:-]/g, '');
            const devPid = (d.PID || d.id || '').toLowerCase();
            const devVendor = (d.vendor || d.VENDOR || '').toLowerCase();
            const devLoc = (d.location || '').toLowerCase();

            return (
                devName.includes(q) ||
                devIp.includes(q) ||
                devPid.includes(q) ||
                devVendor.includes(q) ||
                devLoc.includes(q) ||
                (devMac && devMac.includes(q)) ||
                (cleanMac && cleanQ.length >= 2 && cleanMac.includes(cleanQ))
            );
        });
    };

    const filteredUnmapped = filterHelper(unmappedDevices);
    const filteredMapped = searchQuery.trim() ? filterHelper(mappedDevices) : [];

    return (
        <div className={`z-20 bg-slate-950/90 border border-amber-500/30 rounded-xl shadow-2xl backdrop-blur-md w-72 flex flex-col max-h-[460px] ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center p-3 text-left hover:bg-slate-900/50 transition-colors border-b border-amber-500/20"
            >
                <div className="flex items-center gap-2">
                    <MapPinOff className="w-4 h-4 text-amber-500" />
                    <div>
                        <span className="text-[10px] text-amber-500 uppercase font-bold block">Unmapped Devices</span>
                        <span className="text-[9px] text-slate-400">({unmappedDevices.length} belum di kanvas)</span>
                    </div>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            
            {isOpen && (
                <>
                    <div className="p-2 border-b border-amber-500/20 bg-slate-900/40">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari nama, IP, MAC..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-md py-1.5 pl-7 pr-2 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500/50 font-sans"
                            />
                        </div>
                    </div>

                    <div className="p-2 overflow-y-auto custom-scrollbar flex flex-col gap-1.5">
                        {/* UNMAPPED DEVICES (DRAGGABLE) */}
                        {filteredUnmapped.map(dev => (
                            <div 
                                key={dev.id || dev.PID} 
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('application/reactflow', dev.id || dev.PID);
                                    e.dataTransfer.effectAllowed = 'move';
                                }}
                                className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/60 p-2 rounded-lg flex flex-col gap-1 cursor-grab active:cursor-grabbing transition-all hover:shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                                title="Tarik dan lepas ke kanvas untuk memetakan"
                            >
                                <div className="flex justify-between items-start">
                                    <span className="text-[11px] font-bold text-slate-200 truncate">{dev.name || dev.hostname}</span>
                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold uppercase ml-1 shrink-0">
                                        {dev.type || 'device'}
                                    </span>
                                </div>
                                <div className="text-[9px] font-mono flex justify-between items-center">
                                    <span><span className="text-slate-500">IP: </span><span className="text-cyan-400 font-semibold">{dev.ip}</span></span>
                                    {dev.mac && dev.mac !== '-' && <span className="text-slate-400 text-[8px]">{dev.mac}</span>}
                                </div>
                                <div className="text-[9px] text-slate-500 truncate mt-0.5">
                                    {dev.floor || 'Unmapped'} {dev.location ? `• ${dev.location}` : ''}
                                </div>
                            </div>
                        ))}

                        {/* MAPPED DEVICES FOUND IN SEARCH */}
                        {filteredMapped.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-800">
                                <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <LocateFixed className="w-3 h-3" /> Sudah di Kanvas:
                                </div>
                                {filteredMapped.map(dev => (
                                    <div
                                        key={`mapped-${dev.id || dev.PID}`}
                                        onClick={() => onFocusNode && dev.canvasNode && onFocusNode(dev.canvasNode)}
                                        className="bg-emerald-950/20 border border-emerald-500/30 hover:bg-emerald-900/30 p-2 rounded-lg flex flex-col gap-1 cursor-pointer transition-all hover:shadow-[0_0_10px_rgba(16,185,129,0.2)] mb-1"
                                        title="Klik untuk menyorot posisi perangkat di kanvas"
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className="text-[11px] font-bold text-emerald-300 truncate">{dev.name || dev.hostname}</span>
                                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase shrink-0">
                                                DI KANVAS
                                            </span>
                                        </div>
                                        <div className="text-[9px] font-mono text-slate-400">
                                            IP: <span className="text-cyan-400">{dev.ip}</span> (Klik untuk Sorot)
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {filteredUnmapped.length === 0 && filteredMapped.length === 0 && (
                            <div className="p-4 text-center text-[10px] text-slate-500 italic">
                                {unmappedDevices.length === 0 
                                    ? "Semua perangkat telah terpasang di kanvas." 
                                    : "Perangkat tidak ditemukan dalam pencarian."}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
