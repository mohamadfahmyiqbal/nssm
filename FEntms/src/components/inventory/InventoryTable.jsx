import React, { useState, useMemo } from 'react';
import { Plus, RotateCw, Wrench, Trash2, MapPin, CheckSquare, Square, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import AddDeviceModal from './AddDeviceModal';
import { useDevices } from '../../context/DeviceContext';

export default function InventoryTable() {
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState(null);
    const {
        devices,
        addDevice,
        removeDevice,
        removeMultipleDevices,
        updateDevice,
        refreshDevices,
        floorplansList,
        refreshFloorplans
    } = useDevices();

    // Kategori sidebar diambil dari daftar denah/drawing resmi Location Mapping (+ All & Unmapped)
    const locationFilters = useMemo(() => {
        const list = ['All'];
        if (floorplansList && floorplansList.length > 0) {
            floorplansList.forEach((fp) => {
                if (fp.name && !list.includes(fp.name)) {
                    list.push(fp.name);
                }
            });
        }
        devices.forEach((dev) => {
            if (dev.floor && dev.floor !== 'Unmapped' && !list.includes(dev.floor)) {
                list.push(dev.floor);
            }
        });
        if (!list.includes('Unmapped')) {
            list.push('Unmapped');
        }
        return list;
    }, [devices, floorplansList]);

    const filteredDevices = devices.filter((dev) => {
        let passFilter = true;
        if (selectedFilter !== 'All') {
            if (selectedFilter === 'Unmapped') {
                passFilter = !dev.floor || dev.floor === 'Unmapped';
            } else {
                passFilter = (
                    dev.floor === selectedFilter ||
                    dev.floor?.toLowerCase().includes(selectedFilter.toLowerCase()) ||
                    dev.location?.toLowerCase().includes(selectedFilter.toLowerCase())
                );
            }
        }
        
        if (passFilter && searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            passFilter = (
                dev.name?.toLowerCase().includes(query) ||
                dev.ip?.toLowerCase().includes(query) ||
                dev.mac?.toLowerCase().includes(query) ||
                dev.vendor?.toLowerCase().includes(query)
            );
        }
        
        return passFilter;
    });

    const isAllSelected =
        filteredDevices.length > 0 &&
        filteredDevices.every((dev) => selectedIds.includes(dev.PID || dev.id));

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = filteredDevices.map((d) => d.PID || d.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleToggleSelect = (idOrPid) => {
        setSelectedIds((prev) =>
            prev.includes(idOrPid) ? prev.filter((id) => id !== idOrPid) : [...prev, idOrPid]
        );
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        const count = selectedIds.length;
        const idsToDelete = [...selectedIds];
        Swal.fire({
            title: `Hapus ${count} Perangkat Terpilih?`,
            text: `${count} perangkat terpilih akan dihapus permanen dari Inventory & Database!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            cancelButtonColor: '#334155',
            confirmButtonText: `Hapus ${count} Perangkat`,
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#f8fafc',
        }).then(async (result) => {
            if (result.isConfirmed) {
                if (removeMultipleDevices) {
                    await removeMultipleDevices(idsToDelete);
                } else {
                    await Promise.all(idsToDelete.map((id) => removeDevice(id)));
                }
                setSelectedIds([]);
                Swal.fire({
                    title: 'Terhapus!',
                    text: `${count} perangkat berhasil dihapus.`,
                    icon: 'success',
                    background: '#0f172a',
                    color: '#f8fafc',
                    timer: 1500,
                });
            }
        });
    };

    const handleSaveNewDevice = (deviceData) => {
        if (editingDevice) {
            const devIdOrPid = editingDevice.PID || editingDevice.id;
            updateDevice(devIdOrPid, deviceData);
            Swal.fire({
                title: 'Diperbarui!',
                text: `Data perangkat "${deviceData.hostname}" berhasil diperbarui.`,
                icon: 'success',
                background: '#0f172a',
                color: '#f8fafc',
                timer: 1500,
            });
        } else {
            addDevice(deviceData);
        }
        setIsModalOpen(false);
        setEditingDevice(null);
    };

    const handleDeleteDevice = (dev) => {
        const devIdOrPid = dev.PID || dev.id;
        Swal.fire({
            title: `Hapus Perangkat?`,
            text: `Perangkat "${dev.name}" (${dev.ip}) akan dihapus dari Inventory & Database!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#f8fafc',
        }).then((result) => {
            if (result.isConfirmed) {
                removeDevice(devIdOrPid);
                setSelectedIds((prev) => prev.filter((id) => id !== devIdOrPid));
                Swal.fire({
                    title: 'Terhapus!',
                    text: `Perangkat "${dev.name}" berhasil dihapus.`,
                    icon: 'success',
                    background: '#0f172a',
                    color: '#f8fafc',
                    timer: 1500,
                });
            }
        });
    };

    const handleEditDevice = (dev) => {
        setEditingDevice(dev);
        setIsModalOpen(true);
    };

    const handleRefreshAll = () => {
        refreshDevices();
        if (refreshFloorplans) refreshFloorplans();
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4 h-[640px]">
            {/* Sidebar Filter Lokasi Dinamis dari Location Mapping */}
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
                        onClick={() => {
                            setSelectedFilter(loc);
                            setSelectedIds([]);
                        }}
                        className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${selectedFilter === loc
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

            {/* Main Datatable Container */}
            <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-hidden">
                <div>
                    {/* Header Actions Bar */}
                    <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="font-extrabold text-sm tracking-wide text-slate-100 whitespace-nowrap">Live Device Inventory</h2>
                            <span className="bg-blue-500/20 text-blue-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-blue-500/30 whitespace-nowrap">
                                {filteredDevices.length} items ({selectedFilter})
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

                            {selectedIds.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg shadow-rose-600/30 transition-all font-mono"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus {selectedIds.length} Terpilih</span>
                                </button>
                            )}

                            <button
                                onClick={handleRefreshAll}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs transition-all"
                                title="Refresh Data & Denah"
                            >
                                <RotateCw className="w-3.5 h-3.5" />
                            </button>

                            <button
                                onClick={() => {
                                    setEditingDevice(null);
                                    setIsModalOpen(true);
                                }}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                <span>TAMBAH PERANGKAT BARU</span>
                            </button>
                        </div>
                    </div>

                    {/* Table Element */}
                    <div className="overflow-x-auto max-h-[480px]">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px] sticky top-0 bg-slate-900 z-10">
                                    <th className="pb-3 px-3 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer accent-blue-600"
                                            title="Select All / Unselect All"
                                        />
                                    </th>
                                    <th className="pb-3 px-3">Device Name</th>
                                    <th className="pb-3 px-3">IP Address</th>
                                    <th className="pb-3 px-3">MAC Address</th>
                                    <th className="pb-3 px-3">Vendor</th>
                                    <th className="pb-3 px-3">Floor / Denah</th>
                                    <th className="pb-3 px-3">Titik Lokasi Denah</th>
                                    <th className="pb-3 px-3 text-center">SNMP</th>
                                    <th className="pb-3 px-3">Status</th>
                                    <th className="pb-3 px-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-sans">
                                {filteredDevices.map((dev, idx) => {
                                    const devIdOrPid = dev.PID || dev.id;
                                    const isChecked = selectedIds.includes(devIdOrPid);
                                    const isSnmpEnabled = dev.snmpVersion && dev.snmpVersion !== 'none' && dev.snmpVersion !== '';

                                    return (
                                        <tr
                                            key={`${devIdOrPid}-${idx}`}
                                            className={`transition-colors ${isChecked ? 'bg-blue-950/30 border-l-2 border-blue-500' : 'hover:bg-slate-800/40'}`}
                                        >
                                            <td className="py-3 px-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleToggleSelect(devIdOrPid)}
                                                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer accent-blue-600"
                                                />
                                            </td>
                                            <td className="py-3 px-3 font-bold text-slate-200">{dev.name}</td>
                                            <td className="py-3 px-3 font-mono text-slate-400">{dev.ip}</td>
                                            <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{dev.mac || '-'}</td>
                                            <td className="py-3 px-3 text-slate-300">{dev.vendor}</td>
                                            <td className="py-3 px-3 font-medium text-emerald-400 font-mono">
                                                {dev.floor || 'Unmapped'}
                                            </td>
                                            <td className="py-3 px-3 text-slate-300">
                                                <span className="inline-flex items-center gap-1 text-[11px]">
                                                    <MapPin className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                                    <span>{dev.location || 'Belum ditentukan'}</span>
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                {isSnmpEnabled ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                                        ON ({dev.snmpVersion})
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-500 border border-slate-700">
                                                        OFF
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${dev.status === 'UP'
                                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                                            : dev.status === 'WARNING'
                                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                                        }`}
                                                >
                                                    ● {dev.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <div className="flex items-center justify-end gap-1 text-slate-400">
                                                    <button
                                                        onClick={() => handleEditDevice(dev)}
                                                        className="p-1.5 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                                                        title="Edit Perangkat"
                                                    >
                                                        <Wrench className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteDevice(dev)}
                                                        className="p-1.5 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                                                        title="Hapus Perangkat"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Pagination */}
                <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-800/80 pt-3 font-mono">
                    <span>(Total: {filteredDevices.length} Devices {selectedIds.length > 0 ? `| ${selectedIds.length} Selected` : ''})</span>
                    <div className="flex items-center gap-1">
                        <button className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold">1</button>
                    </div>
                </div>
            </div>

            {/* Modal Dialog */}
            <AddDeviceModal
                isOpen={isModalOpen}
                device={editingDevice}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingDevice(null);
                }}
                onSave={handleSaveNewDevice}
            />
        </div>
    );
}