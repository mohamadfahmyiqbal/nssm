import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';

export const useInventoryFilters = ({
    devices = [],
    floorplansList = [],
    removeMultipleDevices,
    removeDevice
}) => {
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

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

    const filteredDevices = useMemo(() => {
        return devices.filter((dev) => {
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
    }, [devices, selectedFilter, searchQuery]);

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

    return {
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
    };
};
