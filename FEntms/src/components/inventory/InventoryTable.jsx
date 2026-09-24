import React, { useState } from 'react';
import Swal from 'sweetalert2';
import AddDeviceModal from './AddDeviceModal';
import InventoryLocationSidebar from './table/InventoryLocationSidebar';
import InventoryTableHeader from './table/InventoryTableHeader';
import InventoryTableList from './table/InventoryTableList';
import InventoryTablePagination from './table/InventoryTablePagination';
import { useInventoryFilters } from './table/useInventoryFilters';
import { useDevices } from '../../context/DeviceContext';

export default function InventoryTable() {
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
        refreshFloorplans,
        disabledPollingMap,
        toggleDevicePolling
    } = useDevices();

    const {
        selectedFilter,
        setSelectedFilter,
        searchQuery,
        setSearchQuery,
        selectedIds,
        setSelectedIds,
        locationFilters,
        filteredDevices,
        isAllSelected,
        handleSelectAll,
        handleToggleSelect,
        handleBulkDelete
    } = useInventoryFilters({
        devices,
        floorplansList,
        removeMultipleDevices,
        removeDevice
    });

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
            {/* Sidebar Filter Lokasi Denah */}
            <InventoryLocationSidebar
                locationFilters={locationFilters}
                selectedFilter={selectedFilter}
                setSelectedFilter={(loc) => {
                    setSelectedFilter(loc);
                    setSelectedIds([]);
                }}
                devices={devices}
            />

            {/* Main Datatable Container */}
            <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-hidden">
                <div>
                    {/* Header Actions Bar */}
                    <InventoryTableHeader
                        filteredCount={filteredDevices.length}
                        selectedFilter={selectedFilter}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedCount={selectedIds.length}
                        onBulkDelete={handleBulkDelete}
                        onRefreshAll={handleRefreshAll}
                        onAddNewDevice={() => {
                            setEditingDevice(null);
                            setIsModalOpen(true);
                        }}
                    />

                    {/* Table Element */}
                    <InventoryTableList
                        devices={filteredDevices}
                        selectedIds={selectedIds}
                        isAllSelected={isAllSelected}
                        onSelectAll={handleSelectAll}
                        onToggleSelect={handleToggleSelect}
                        disabledPollingMap={disabledPollingMap}
                        onTogglePolling={toggleDevicePolling}
                        onEditDevice={handleEditDevice}
                        onDeleteDevice={handleDeleteDevice}
                    />
                </div>

                {/* Footer Pagination */}
                <InventoryTablePagination
                    totalCount={filteredDevices.length}
                    selectedCount={selectedIds.length}
                />
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