import { useState, useEffect, useCallback, useRef } from 'react';
import Swal from 'sweetalert2';
import api, {
    getAllTopologyDrawingsFromDB,
    getTopologyDrawingByIdFromDB,
    saveTopologyDrawingToDB,
    deleteTopologyDrawingFromDB
} from '../../../services/api';
import { showToast, showAlert, showConfirm } from '../../../utils/swal';

export const useTopologyLayout = ({
    nodes,
    setNodes,
    edges,
    setEdges,
    devices = [],
    buildDeviceNode,
    rfInstance
}) => {
    const [drawingsList, setDrawingsList] = useState([]);
    const [activeDrawing, setActiveDrawing] = useState(null);
    const [savedLayoutConfig, setSavedLayoutConfig] = useState(null);
    const [pollingOverrides, setPollingOverrides] = useState({});
    const [notificationPrefs, setNotificationPrefs] = useState({});
    const [isLoadingDrawing, setIsLoadingDrawing] = useState(false);
    
    const initialLoadedRef = useRef(false);

    // Initial Preferences
    useEffect(() => {
        const fetchInitialConfig = async () => {
            try {
                const [resPolling, resNotification] = await Promise.all([
                    api.get('/settings/polling_methods').catch(() => ({ data: { data: { value: {} } } })),
                    api.get('/settings/notification_preferences').catch(() => ({ data: { data: { value: {} } } }))
                ]);
                setPollingOverrides(resPolling.data?.data?.value || {});
                setNotificationPrefs(resNotification.data?.data?.value || {});
            } catch (err) {
                console.error('Failed to load initial settings:', err.message);
            }
        };

        fetchInitialConfig();
    }, []);

    // Load detail 1 drawing dan sinkronkan ke canvas
    const loadDrawingDetail = useCallback(async (id) => {
        if (!id) return;
        setIsLoadingDrawing(true);
        try {
            const res = await getTopologyDrawingByIdFromDB(id);
            if (res.success && res.data) {
                const current = res.data;
                setActiveDrawing(current);

                const rawNodes = current.nodes || {};
                const rawEdges = current.edges || [];

                const groupNodes = [];
                const deviceNodes = [];

                Object.keys(rawNodes).forEach((key) => {
                    const nodeData = rawNodes[key];
                    if (!nodeData || typeof nodeData !== 'object') return;

                    if (nodeData.isGroup || key.startsWith('group-')) {
                        groupNodes.push({
                            id: key,
                            type: 'customGroup',
                            position: { x: nodeData.x || 0, y: nodeData.y || 0 },
                            style: { width: nodeData.width || 300, height: nodeData.height || 200 },
                            data: { label: nodeData.label || 'Group' },
                            selected: false
                        });
                    } else {
                        const cleanKey = String(key).trim().toLowerCase();

                        const dev = devices.find(d => {
                            const dPid = String(d.PID || d.id || '').trim().toLowerCase();
                            return dPid && dPid === cleanKey;
                        }) || {
                            id: key,
                            PID: key,
                            name: nodeData.label || key,
                            hostname: nodeData.label || key,
                            ip: nodeData.ip || '192.168.1.1',
                            status: 'up'
                        };

                        if (buildDeviceNode) {
                            const devNode = buildDeviceNode(dev, { x: nodeData.x, y: nodeData.y }, nodeData.parentNode);
                            devNode.id = String(key);
                            if (devNode.data) devNode.data.id = String(key);
                            deviceNodes.push(devNode);
                        }
                    }
                });

                const combinedNodes = [...groupNodes, ...deviceNodes];
                
                // Pastikan parent node valid
                const validGroupIds = new Set(groupNodes.map(g => g.id));
                const finalNodes = combinedNodes.map(n => {
                    if (n.parentNode && !validGroupIds.has(n.parentNode)) {
                        const { parentNode, extent, ...rest } = n;
                        return rest;
                    }
                    return n;
                });

                setNodes(finalNodes);
                setEdges(Array.isArray(rawEdges) ? rawEdges : []);
                setSavedLayoutConfig({ nodes: rawNodes, edges: rawEdges });

                if (rfInstance) {
                    setTimeout(() => {
                        rfInstance.fitView({ padding: 0.2, duration: 600 });
                    }, 200);
                }
            }
        } catch (err) {
            console.error('Gagal memuat detail drawing:', err);
            showToast('error', 'Gagal memuat drawing topologi');
        } finally {
            setIsLoadingDrawing(false);
        }
    }, [devices, buildDeviceNode, setNodes, setEdges, rfInstance]);

    // Refresh daftar drawing dari database
    const refreshDrawingsList = useCallback(async (targetId = null) => {
        try {
            const listRes = await getAllTopologyDrawingsFromDB();
            if (listRes.success && listRes.data.length > 0) {
                setDrawingsList(listRes.data);
                const selected = targetId
                    ? listRes.data.find(d => d.id === targetId) || listRes.data[0]
                    : listRes.data[0];

                await loadDrawingDetail(selected.id);
            } else {
                setDrawingsList([]);
                setNodes([]);
                setEdges([]);
                setSavedLayoutConfig({ nodes: {}, edges: [] });
            }
        } catch (err) {
            console.error('Gagal mengambil daftar drawing topology:', err.message);
            setSavedLayoutConfig({ nodes: {}, edges: [] });
        }
    }, [loadDrawingDetail, setNodes, setEdges]);

    // Initial load list drawings
    useEffect(() => {
        if (!initialLoadedRef.current) {
            initialLoadedRef.current = true;
            refreshDrawingsList();
        }
    }, [refreshDrawingsList]);

    // Pilih Drawing dari Selector
    const onSelectDrawing = (id) => {
        if (!id || activeDrawing?.id === id) return;
        loadDrawingDetail(id);
    };

    // Simpan Drawing Aktif (Nodes + Edges) ke DB
    const handleSaveLayout = async () => {
        try {
            const layoutToSave = {};
            nodes.forEach((n) => {
                const saveData = { 
                    x: n.position.x,
                    y: n.position.y,
                    ip: n.data?.ip,
                    label: n.data?.label
                };
                if (n.parentNode) saveData.parentNode = n.parentNode;
                if (n.type === 'customGroup') {
                    saveData.isGroup = true;
                    saveData.width = n.style?.width;
                    saveData.height = n.style?.height;
                }
                layoutToSave[n.id] = saveData;
            });

            if (!activeDrawing) {
                showToast('warning', 'Tidak ada drawing aktif.');
                return;
            }

            const res = await saveTopologyDrawingToDB({
                id: activeDrawing.id,
                name: activeDrawing.name,
                type: activeDrawing.type || 'DETAIL',
                description: activeDrawing.description,
                nodes: layoutToSave,
                edges: edges
            });

            if (res.success) {
                setSavedLayoutConfig({
                    nodes: layoutToSave,
                    edges: edges
                });
                showToast('success', `Drawing "${activeDrawing.name}" berhasil disimpan!`);
                setDrawingsList(prev => prev.map(d => d.id === activeDrawing.id ? { ...d, updatedAt: new Date().toISOString() } : d));
            }
        } catch (err) {
            console.error('Failed to save layout:', err);
            showAlert('Gagal', 'Terjadi kesalahan saat menyimpan layout ke database.', 'error');
        }
    };

    // Buat Drawing Baru
    const handleCreateNewDrawing = () => {
        Swal.fire({
            title: 'Buat Drawing Topologi Baru',
            html: `
                <input id="swal-topo-name" class="swal2-input" placeholder="Nama Drawing (misal: Core Topology, LAN Fl 1)" style="background:#1e293b; color:#fff; border:1px solid #475569;">
                <select id="swal-topo-type" class="swal2-input" style="background:#1e293b; color:#fff; border:1px solid #475569;">
                    <option value="DETAIL">DETAIL TOPOLOGY (Skema Sektoral / Lantai)</option>
                    <option value="MASTER">MASTER TOPOLOGY (Topologi Utama)</option>
                </select>
            `,
            showCancelButton: true,
            confirmButtonText: 'Buat Drawing',
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#334155',
            background: '#0f172a',
            color: '#f8fafc',
            preConfirm: () => {
                const name = document.getElementById('swal-topo-name')?.value;
                const type = document.getElementById('swal-topo-type')?.value;
                if (!name || name.trim() === '') {
                    Swal.showValidationMessage('Nama drawing wajib diisi!');
                    return false;
                }
                return { name: name.trim(), type };
            }
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                try {
                    const res = await saveTopologyDrawingToDB({
                        name: result.value.name,
                        type: result.value.type,
                        nodes: {},
                        edges: []
                    });
                    if (res.success && res.data) {
                        setEdges([]);
                        setNodes([]);
                        setSavedLayoutConfig({ nodes: {}, edges: [] });
                        await refreshDrawingsList(res.data.id);
                        showToast('success', `Drawing "${result.value.name}" berhasil dibuat!`);
                    }
                } catch (err) {
                    Swal.fire('Error', 'Gagal membuat drawing baru', 'error');
                }
            }
        });
    };

    // Duplikat Drawing Aktif
    const handleDuplicateDrawing = () => {
        if (!activeDrawing) return;
        Swal.fire({
            title: `Duplikat "${activeDrawing.name}"?`,
            text: 'Ini akan membuat salinan drawing topologi beserta seluruh layout node dan koneksinya.',
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
                    const layoutToSave = {};
                    nodes.forEach((n) => {
                        layoutToSave[n.id] = {
                            x: n.position.x,
                            y: n.position.y,
                            ip: n.data?.ip,
                            label: n.data?.label,
                            ...(n.parentNode ? { parentNode: n.parentNode } : {}),
                            ...(n.type === 'customGroup' ? { isGroup: true, width: n.style?.width, height: n.style?.height } : {})
                        };
                    });

                    const res = await saveTopologyDrawingToDB({
                        name: `${activeDrawing.name} (Copy)`,
                        type: 'DETAIL',
                        description: activeDrawing.description,
                        nodes: layoutToSave,
                        edges: edges
                    });

                    if (res.success && res.data) {
                        await refreshDrawingsList(res.data.id);
                        Swal.fire('Berhasil', 'Drawing topologi berhasil diduplikat', 'success');
                    }
                } catch (err) {
                    Swal.fire('Error', 'Gagal menduplikat drawing', 'error');
                }
            }
        });
    };

    // Rename Drawing Aktif
    const handleRenameDrawing = () => {
        if (!activeDrawing) return;
        Swal.fire({
            title: 'Rename Drawing Topologi',
            input: 'text',
            inputValue: activeDrawing.name,
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
                    return false;
                }
                return newName.trim();
            }
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                try {
                    const layoutToSave = {};
                    nodes.forEach((n) => {
                        layoutToSave[n.id] = {
                            x: n.position.x,
                            y: n.position.y,
                            ip: n.data?.ip,
                            label: n.data?.label,
                            ...(n.parentNode ? { parentNode: n.parentNode } : {}),
                            ...(n.type === 'customGroup' ? { isGroup: true, width: n.style?.width, height: n.style?.height } : {})
                        };
                    });

                    const res = await saveTopologyDrawingToDB({
                        id: activeDrawing.id,
                        name: result.value,
                        type: activeDrawing.type,
                        description: activeDrawing.description,
                        nodes: layoutToSave,
                        edges: edges
                    });
                    if (res.success) {
                        setActiveDrawing(prev => ({ ...prev, name: result.value }));
                        setDrawingsList(prev => prev.map(d => d.id === activeDrawing.id ? { ...d, name: result.value } : d));
                        showToast('success', 'Nama drawing berhasil diubah');
                    }
                } catch (err) {
                    Swal.fire('Error', 'Gagal mengubah nama drawing', 'error');
                }
            }
        });
    };

    // Hapus Drawing Aktif
    const handleDeleteDrawing = () => {
        if (!activeDrawing) return;

        if (drawingsList.length <= 1) {
            Swal.fire('Peringatan', 'Minimal harus ada 1 drawing topologi.', 'warning');
            return;
        }

        Swal.fire({
            title: `Hapus "${activeDrawing.name}"?`,
            text: 'Drawing topologi beserta skema koneksinya akan dihapus permanen!',
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
                    const res = await deleteTopologyDrawingFromDB(activeDrawing.id);
                    if (res.success) {
                        await refreshDrawingsList();
                        showToast('success', 'Drawing topologi berhasil dihapus');
                    }
                } catch (err) {
                    Swal.fire('Error', 'Gagal menghapus drawing topologi', 'error');
                }
            }
        });
    };

    // Kosongkan Canvas Drawing Aktif
    const handleResetLayout = () => {
        showConfirm('Kosongkan Canvas Drawing?', 'Seluruh perangkat dan koneksi pada drawing aktif ini akan dihapus dari canvas. Anda dapat memasukkannya kembali melalui panel Unmapped Devices.', 'Ya, Kosongkan').then((result) => {
            if (result.isConfirmed) {
                setEdges([]);
                setNodes([]);
                setSavedLayoutConfig({ nodes: {}, edges: [] });

                setTimeout(() => {
                    if (rfInstance) rfInstance.fitView({ padding: 0.2, duration: 800 });
                }, 100);
            }
        });
    };

    const handlePollingOverrideChange = async (ip, pid, method) => {
        const keyToUse = ip || pid;
        if (!keyToUse) return;

        const updatedOverrides = { ...pollingOverrides };
        if (method === 'auto') {
            delete updatedOverrides[keyToUse];
        } else {
            updatedOverrides[keyToUse] = method;
        }

        setPollingOverrides(updatedOverrides);

        try {
            await api.post('/settings', {
                key: 'polling_methods',
                value: updatedOverrides
            });
            showToast('success', 'Metode polling berhasil diperbarui!');
        } catch (err) {
            console.error('Failed to update polling method:', err);
            showToast('error', 'Gagal memperbarui metode polling');
        }
    };

    const handleNotificationToggle = async (pid) => {
        if (!pid) return;
        try {
            setNotificationPrefs(prev => {
                const currentPref = prev[pid] !== false;
                const newPrefs = { ...prev, [pid]: !currentPref };
                
                api.post('/settings', {
                    key: 'notification_preferences',
                    value: newPrefs
                }).then(() => {
                    showToast('success', 'Pengaturan notifikasi disimpan');
                }).catch(err => {
                    console.error('Failed to update notification preferences', err);
                    showToast('error', 'Gagal menyimpan pengaturan notifikasi');
                });
                
                return newPrefs;
            });
        } catch (error) {
            console.error('Error in handleNotificationToggle', error);
        }
    };

    return {
        drawingsList,
        activeDrawing,
        isLoadingDrawing,
        onSelectDrawing,
        handleCreateNewDrawing,
        handleDuplicateDrawing,
        handleRenameDrawing,
        handleDeleteDrawing,
        savedLayoutConfig,
        pollingOverrides,
        notificationPrefs,
        handleSaveLayout,
        handleResetLayout,
        handlePollingOverrideChange,
        handleNotificationToggle,
        setSavedLayoutConfig
    };
};
