import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api, {
    getAllFloorplansFromDB,
    getFloorplanByIdFromDB,
    saveFloorplanToDB,
    deleteFloorplanFromDB,
    updateDeviceInDB
} from '../../../services/api';
import { useDevices } from '../../../context/DeviceContext';

export default function useFloorplanData(stageRef) {
    const [floorplansList, setFloorplansList] = useState([]);
    const [activeFloorplan, setActiveFloorplan] = useState(null);

    const [lines, setLines] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [devices, setDevices] = useState([]);

    const [selectedIds, setSelectedIds] = useState([]);
    const [history, setHistory] = useState([]);
    const [isSavingDB, setIsSavingDB] = useState(false);

    const { syncFloorplanDevices, refreshDevices } = useDevices();

    const [notificationPrefs, setNotificationPrefs] = useState({});

    useEffect(() => {
        const fetchPrefs = async () => {
            try {
                const res = await api.get('/settings/notification_preferences');
                if (res.data?.data?.value) {
                    setNotificationPrefs(res.data.data.value);
                }
            } catch (e) {}
        };
        fetchPrefs();
    }, []);

    const handleNotificationToggle = async (targetIdOrPid) => {
        if (!targetIdOrPid) return;
        try {
            const currentPref = notificationPrefs[targetIdOrPid] !== false; // default true
            const newPrefs = { ...notificationPrefs, [targetIdOrPid]: !currentPref };
            setNotificationPrefs(newPrefs);
            
            await api.post('/settings', {
                key: 'notification_preferences',
                value: newPrefs
            });
        } catch (error) {
            console.error('Failed to update notification preferences', error);
        }
    };

    const refreshFloorplanList = async (targetId = null) => {
        try {
            const listRes = await getAllFloorplansFromDB();
            if (listRes.success && listRes.data.length > 0) {
                setFloorplansList(listRes.data);
                const selected = targetId
                    ? listRes.data.find(f => f.id === targetId) || listRes.data[0]
                    : listRes.data[0];

                loadFloorplanDetail(selected.id);
            }
        } catch (err) {
            console.log('Backend belum terhubung.');
        }
    };

    const loadFloorplanDetail = async (id) => {
        try {
            const res = await getFloorplanByIdFromDB(id);
            if (res.success && res.data) {
                setActiveFloorplan(res.data);
                setLines(res.data.lines || []);
                setRooms(res.data.rooms || []);
                const fpDevs = res.data.devices || [];
                setDevices(fpDevs);
                setSelectedIds([]);
                setHistory([]);

                // Sync ke Inventory saat detail denah dimuat
                if (syncFloorplanDevices && fpDevs.length > 0) {
                    syncFloorplanDevices(res.data.name, fpDevs, res.data.rooms || []);
                }
            }
        } catch (err) {
            console.error('Gagal memuat detail denah:', err);
        }
    };

    useEffect(() => {
        refreshFloorplanList();
    }, []);

    const saveHistory = () => {
        setHistory((prev) => {
            const newHistory = [
                ...prev,
                {
                    lines: JSON.parse(JSON.stringify(lines)),
                    rooms: JSON.parse(JSON.stringify(rooms)),
                    devices: JSON.parse(JSON.stringify(devices)),
                }
            ];
            // Batasi maksimum history 20 step agar RAM tidak bengkak
            if (newHistory.length > 20) {
                return newHistory.slice(newHistory.length - 20);
            }
            return newHistory;
        });
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];
        setLines(lastState.lines);
        setRooms(lastState.rooms);
        setDevices(lastState.devices);
        setHistory((prev) => prev.slice(0, prev.length - 1));
        setSelectedIds([]);
    };

    const handleDeleteSelected = () => {
        if (selectedIds.length === 0) return;
        saveHistory();
        setLines((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
        setRooms((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
        setDevices((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
        setSelectedIds([]);
    };

    const handleDuplicateSelected = () => {
        if (selectedIds.length === 0) return;
        saveHistory();

        const newSelectedIds = [];
        const newRooms = [];
        const newDevices = [];
        const newLines = [];

        selectedIds.forEach((id) => {
            if (id.startsWith('room-')) {
                const roomToCopy = rooms.find((r) => r.id === id);
                if (roomToCopy) {
                    const newId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                    const duplicatedRoom = {
                        ...roomToCopy,
                        id: newId,
                        x: roomToCopy.x + 20,
                        y: roomToCopy.y + 20,
                        label: ''
                    };
                    newRooms.push(duplicatedRoom);
                    newSelectedIds.push(newId);
                }
            } else if (id.startsWith('dev-')) {
                const devToCopy = devices.find((d) => d.id === id);
                if (devToCopy) {
                    const newId = `dev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                    const duplicatedDev = {
                        ...devToCopy,
                        id: newId,
                        x: devToCopy.x + 20,
                        y: devToCopy.y + 20,
                        label: ''
                    };
                    newDevices.push(duplicatedDev);
                    newSelectedIds.push(newId);
                }
            } else if (id.startsWith('line-')) {
                const lineToCopy = lines.find((l) => l.id === id);
                if (lineToCopy) {
                    const newId = `line-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                    const offsetPoints = lineToCopy.points.map((val, idx) => val + (idx % 2 === 0 ? 20 : 20));
                    const duplicatedLine = {
                        ...lineToCopy,
                        id: newId,
                        points: offsetPoints
                    };
                    newLines.push(duplicatedLine);
                    newSelectedIds.push(newId);
                }
            }
        });

        if (newRooms.length > 0) setRooms((prev) => [...prev, ...newRooms]);
        if (newDevices.length > 0) {
            setDevices((prev) => {
                const updatedDevs = [...prev, ...newDevices];
                if (syncFloorplanDevices && activeFloorplan) {
                    syncFloorplanDevices(activeFloorplan.name, updatedDevs);
                }
                return updatedDevs;
            });
        }
        if (newLines.length > 0) setLines((prev) => [...prev, ...newLines]);
        setSelectedIds(newSelectedIds);
    };

    const handleBringToFront = () => {
        if (selectedIds.length === 0) return;
        saveHistory();
        setRooms((prev) => {
            const selected = prev.filter((r) => selectedIds.includes(r.id));
            const unselected = prev.filter((r) => !selectedIds.includes(r.id));
            return [...unselected, ...selected];
        });
        setDevices((prev) => {
            const selected = prev.filter((d) => selectedIds.includes(d.id));
            const unselected = prev.filter((d) => !selectedIds.includes(d.id));
            return [...unselected, ...selected];
        });
        setLines((prev) => {
            const selected = prev.filter((l) => selectedIds.includes(l.id));
            const unselected = prev.filter((l) => !selectedIds.includes(l.id));
            return [...unselected, ...selected];
        });
    };

    const handleSendToBack = () => {
        if (selectedIds.length === 0) return;
        saveHistory();
        setRooms((prev) => {
            const selected = prev.filter((r) => selectedIds.includes(r.id));
            const unselected = prev.filter((r) => !selectedIds.includes(r.id));
            return [...selected, ...unselected];
        });
        setDevices((prev) => {
            const selected = prev.filter((d) => selectedIds.includes(d.id));
            const unselected = prev.filter((d) => !selectedIds.includes(d.id));
            return [...selected, ...unselected];
        });
        setLines((prev) => {
            const selected = prev.filter((l) => selectedIds.includes(l.id));
            const unselected = prev.filter((l) => !selectedIds.includes(l.id));
            return [...selected, ...unselected];
        });
    };

    const handleResetCanvas = (resetZoomCallback) => {
        Swal.fire({
            title: 'Kosongkan Canvas?',
            text: 'Seluruh elemen pada denah aktif ini akan dibersihkan.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Reset Canvas',
            background: '#0f172a',
            color: '#f8fafc',
        }).then((result) => {
            if (result.isConfirmed) {
                saveHistory();
                setLines([]);
                setRooms([]);
                setDevices([]);
                setSelectedIds([]);
                if (resetZoomCallback) resetZoomCallback();
            }
        });
    };

    const handleSaveToDatabase = async () => {
        if (!activeFloorplan) return;
        setIsSavingDB(true);
        try {
            const cleanDevicesForPayload = devices.map(d => {
                const { originalLabel, ...rest } = d;
                return rest;
            });

            const payload = {
                id: activeFloorplan.id,
                name: activeFloorplan.name,
                type: activeFloorplan.type,
                lines,
                rooms,
                devices: cleanDevicesForPayload
            };

            const res = await saveFloorplanToDB(payload);
            if (res.success) {
                setDevices(prev => prev.map(d => {
                    const { originalLabel, ...rest } = d;
                    return rest;
                }));

                if (refreshDevices) {
                    await refreshDevices();
                }

                Swal.fire({
                    title: 'Tersimpan & Terhubung!',
                    text: `Denah "${activeFloorplan.name}" dan lokasi perangkat pada Inventory berhasil diperbarui.`,
                    icon: 'success',
                    background: '#0f172a',
                    color: '#f8fafc',
                    timer: 1800
                });
                refreshFloorplanList(activeFloorplan.id);
            }
        } catch (error) {
            Swal.fire({
                title: 'Gagal!',
                text: error.message || 'Terjadi kesalahan.',
                icon: 'error',
                background: '#0f172a',
                color: '#f8fafc'
            });
        } finally {
            setIsSavingDB(false);
        }
    };

    const handleCreateNewDrawing = () => {
        Swal.fire({
            title: 'Buat Drawing / Denah Baru',
            html: `
                <input id="swal-input-name" class="swal2-input" placeholder="Nama Denah (misal: Lantai 2 Server Room)" style="background:#1e293b; color:#fff; border:1px solid #475569;">
                <select id="swal-input-type" class="swal2-input" style="background:#1e293b; color:#fff; border:1px solid #475569;">
                    <option value="DETAIL">DETAIL PLAN (Denah Ruangan / Lantai)</option>
                    <option value="MASTER">MASTER PLAN (Denah Utama Site)</option>
                </select>
            `,
            showCancelButton: true,
            confirmButtonText: 'Buat Drawing',
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#334155',
            background: '#0f172a',
            color: '#f8fafc',
            preConfirm: () => {
                const name = document.getElementById('swal-input-name').value;
                const type = document.getElementById('swal-input-type').value;
                if (!name) {
                    Swal.showValidationMessage('Nama denah wajib diisi!');
                }
                return { name, type };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await saveFloorplanToDB({
                        name: result.value.name,
                        type: result.value.type,
                        lines: [],
                        rooms: [],
                        devices: []
                    });
                    if (res.success) {
                        refreshFloorplanList(res.data.id);
                    }
                } catch (err) {
                    Swal.fire('Error', 'Gagal membuat drawing baru', 'error');
                }
            }
        });
    };

    const handleDeleteDrawing = () => {
        if (!activeFloorplan) return;

        Swal.fire({
            title: `Hapus "${activeFloorplan.name}"?`,
            text: 'Denah ini akan dihapus secara permanen!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Ya, Hapus',
            background: '#0f172a',
            color: '#f8fafc'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await deleteFloorplanFromDB(activeFloorplan.id);
                    if (res.success) {
                        refreshFloorplanList();
                    }
                } catch (err) {
                    Swal.fire('Error', 'Gagal menghapus denah', 'error');
                }
            }
        });
    };

    const handleDuplicateDrawing = () => {
        if (!activeFloorplan) return;
        Swal.fire({
            title: `Duplikat "${activeFloorplan.name}"?`,
            text: 'Ini akan membuat salinan denah beserta seluruh isinya.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Ya, Duplikat',
            background: '#0f172a',
            color: '#f8fafc'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Reset ID untuk perangkat agar tidak duplikat dengan id lama
                    const cleanDevices = devices.map(d => {
                        return { ...d, id: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` };
                    });
                    const cleanRooms = rooms.map(r => {
                        return { ...r, id: `room-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` };
                    });
                    const cleanLines = lines.map(l => {
                        return { ...l, id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` };
                    });

                    const res = await saveFloorplanToDB({
                        name: `${activeFloorplan.name} (Copy)`,
                        type: 'DETAIL',
                        lines: cleanLines,
                        rooms: cleanRooms,
                        devices: cleanDevices
                    });
                    if (res.success) {
                        refreshFloorplanList(res.data.id);
                        Swal.fire('Berhasil', 'Drawing berhasil diduplikat', 'success');
                    }
                } catch (err) {
                    Swal.fire('Error', 'Gagal menduplikat drawing', 'error');
                }
            }
        });
    };

    const handleRenameDrawing = () => {
        if (!activeFloorplan) return;
        Swal.fire({
            title: 'Rename Drawing',
            input: 'text',
            inputValue: activeFloorplan.name,
            inputPlaceholder: 'Masukkan nama baru',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Simpan',
            background: '#0f172a',
            color: '#f8fafc',
            preConfirm: (newName) => {
                if (!newName || newName.trim() === '') {
                    Swal.showValidationMessage('Nama tidak boleh kosong');
                }
                return newName.trim();
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await saveFloorplanToDB({
                        id: activeFloorplan.id,
                        name: result.value,
                        type: activeFloorplan.type,
                        lines,
                        rooms,
                        devices
                    });
                    if (res.success) {
                        refreshFloorplanList(activeFloorplan.id);
                        Swal.fire('Berhasil', 'Nama drawing berhasil diubah', 'success');
                    }
                } catch (err) {
                    Swal.fire('Error', 'Gagal mengubah nama drawing', 'error');
                }
            }
        });
    };

    return {
        floorplansList,
        activeFloorplan,
        loadFloorplanDetail,
        handleCreateNewDrawing,
        handleDeleteDrawing,
        handleDuplicateDrawing,
        handleRenameDrawing,
        lines, setLines,
        rooms, setRooms,
        devices, setDevices,
        selectedIds, setSelectedIds,
        history, isSavingDB,
        saveHistory, handleUndo, handleDeleteSelected, handleDuplicateSelected,
        handleBringToFront, handleSendToBack,
        handleResetCanvas, handleSaveToDatabase,
        notificationPrefs, handleNotificationToggle,
        syncFloorplanDevices, refreshDevices
    };
}