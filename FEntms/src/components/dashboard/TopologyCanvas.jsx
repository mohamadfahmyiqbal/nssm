import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, addEdge, SelectionMode, ConnectionMode } from 'reactflow';
import { nodeTypes } from '../nodes/nodeTypes';
import LiveAlertLog from '../dashboard/LiveAlertLog';
import TopologyLegend from './TopologyLegend';
import TopologyHeader from './TopologyHeader';
import DeviceDetailPanel from './DeviceDetailPanel';
import UnmappedDevicesLegend from '../mapping/canvas/UnmappedDevicesLegend';
import { useDevices } from '../../context/DeviceContext';
import { showConfirm, showToast } from '../../utils/swal';

import { useTopologySnmp } from './hooks/useTopologySnmp';
import { useTopologyNodes } from './hooks/useTopologyNodes';
import { useTopologyLayout } from './hooks/useTopologyLayout';

import DraggableEdge from '../edges/DraggableEdge';

const edgeTypes = {
    draggable: DraggableEdge,
    default: DraggableEdge,
    smoothstep: DraggableEdge,
    step: DraggableEdge,
    straight: DraggableEdge
};

export default function TopologyCanvas({ selectedNetwork, activeFilter, onNavigateToIncidents }) {
    const currentFilter = activeFilter || selectedNetwork || 'ALL';
    const { devices } = useDevices();
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [rfInstance, setRfInstance] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [connectionType, setConnectionType] = useState('UTP');
    const [isSelectMode, setIsSelectMode] = useState(false);
    
    const crosshairHRef = useRef(null);
    const crosshairVRef = useRef(null);
    const containerRef = useRef(null);

    // Refs untuk Garis Bantu Perataan Sisi Card (Alignment Guidelines)
    const guideTopRef = useRef(null);
    const guideBottomRef = useRef(null);
    const guideLeftRef = useRef(null);
    const guideRightRef = useRef(null);
    const guideCenterHRef = useRef(null);
    const guideCenterVRef = useRef(null);

    // Nodes & Edges Hook
    const {
        nodes, setNodes,
        edges, setEdges,
        buildDeviceNode,
        handleGroup, handleUngroup,
        onNodesChange, onEdgesChange
    } = useTopologyNodes(devices, currentFilter, null, selectedDevice);

    // Layout Hook (API Multi-Drawing & Settings)
    const {
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
    } = useTopologyLayout({
        nodes,
        setNodes,
        edges,
        setEdges,
        devices,
        buildDeviceNode,
        rfInstance
    });

    // SNMP Polling Hook
    const { snmpData, nvrSnmpData, vendorMetrics, isLoadingSnmp, isLoadingNvrSnmp } = useTopologySnmp(selectedDevice, setNodes);

    // Sinkronkan metrik hardware langsung ke node terpilih di canvas
    useEffect(() => {
        if (!selectedDevice || (!vendorMetrics && !nvrSnmpData)) return;
        const info = vendorMetrics?.info || nvrSnmpData?.info;
        const res = vendorMetrics?.resources || {};
        if (!info && !vendorMetrics?.resources) return;

        setNodes(nds => nds.map(n => {
            if (n.id === selectedDevice.id || n.data?.ip === selectedDevice.ip) {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        status: 'up',
                        manufacturer: info?.manufacturer || n.data.manufacturer,
                        model: info?.model || n.data.model,
                        firmware: info?.firmware || n.data.firmware,
                        uptime: info?.uptime || n.data.uptime,
                        cpu: (res.cpuUsage !== undefined && res.cpuUsage !== null && res.cpuUsage !== '-') ? res.cpuUsage : n.data.cpu,
                        memory: (res.memoryUsage !== undefined && res.memoryUsage !== null && res.memoryUsage !== '-') ? res.memoryUsage : n.data.memory,
                        temperature: info?.temperature || res.temperature || n.data.temperature,
                        trafficIn: res.trafficIn || n.data.trafficIn,
                        trafficOut: res.trafficOut || n.data.trafficOut,
                        networkTraffic: {
                            in: res.trafficIn || n.data.networkTraffic?.in || '0 MB',
                            out: res.trafficOut || n.data.networkTraffic?.out || '0 MB'
                        },
                        alarmSummary: info?.alarmSummary || n.data.alarmSummary,
                        fanStatus: info?.fanStatus || n.data.fanStatus,
                        psuStatus: info?.psuStatus || n.data.psuStatus,
                        raidStatus: info?.raidStatus || n.data.raidStatus,
                        recordingState: info?.recordingState || n.data.recordingState,
                        ports: vendorMetrics?.ports || n.data.ports
                    }
                };
            }
            return n;
        }));
    }, [vendorMetrics, nvrSnmpData, selectedDevice, setNodes]);

    // Jalur koneksi (edges) yang terhubung ke device yang sedang dipilih/diklik
    const highlightedEdges = useMemo(() => {
        if (!selectedDevice) return edges;

        const targetIds = new Set([
            selectedDevice.id,
            selectedDevice.PID,
            selectedDevice.pid,
            selectedDevice.ip,
            selectedDevice.hostname,
            selectedDevice.label,
            selectedDevice.name
        ].filter(Boolean).map(String));

        // Tambahkan juga id node yang cocok dari list nodes
        nodes.forEach(n => {
            if (
                targetIds.has(String(n.id)) ||
                (n.data?.id && targetIds.has(String(n.data.id))) ||
                (n.data?.ip && targetIds.has(String(n.data.ip))) ||
                (n.data?.label && targetIds.has(String(n.data.label)))
            ) {
                targetIds.add(String(n.id));
            }
        });

        return edges.map(edge => {
            const isConnected = targetIds.has(String(edge.source)) || targetIds.has(String(edge.target));
            return {
                ...edge,
                data: {
                    ...edge.data,
                    isConnectedSelected: isConnected
                },
                zIndex: isConnected ? 150 : (edge.zIndex || 0)
            };
        });
    }, [edges, selectedDevice, nodes]);

    // Mouse / Keyboard / Drag Handlers
    const updateCrosshair = (clientX, clientY) => {
        if (!containerRef.current || clientX === undefined || clientY === undefined) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if (crosshairHRef.current) {
            crosshairHRef.current.style.transform = `translateY(${y}px)`;
            crosshairHRef.current.style.opacity = '1';
        }
        if (crosshairVRef.current) {
            crosshairVRef.current.style.transform = `translateX(${x}px)`;
            crosshairVRef.current.style.opacity = '1';
        }
    };

    // Kalkulasi posisi 4 sisi card yang sedang di-drag
    const updateNodeAlignmentGuides = (node) => {
        if (!rfInstance || !containerRef.current || !node || !node.position) return;
        const rect = containerRef.current.getBoundingClientRect();

        const domNode = document.querySelector(`[data-id="${node.id}"]`);
        const width = domNode ? domNode.offsetWidth : (node.width || (node.type === 'customDevice' ? 210 : 180));
        const height = domNode ? domNode.offsetHeight : (node.height || (node.type === 'customDevice' ? 140 : 80));

        const leftFlow = node.position.x;
        const topFlow = node.position.y;
        const rightFlow = node.position.x + width;
        const bottomFlow = node.position.y + height;
        const centerXFlow = node.position.x + width / 2;
        const centerYFlow = node.position.y + height / 2;

        const tlScreen = rfInstance.flowToScreenPosition({ x: leftFlow, y: topFlow });
        const brScreen = rfInstance.flowToScreenPosition({ x: rightFlow, y: bottomFlow });
        const centerScreen = rfInstance.flowToScreenPosition({ x: centerXFlow, y: centerYFlow });

        const topY = tlScreen.y - rect.top;
        const leftX = tlScreen.x - rect.left;
        const bottomY = brScreen.y - rect.top;
        const rightX = brScreen.x - rect.left;
        const centerX = centerScreen.x - rect.left;
        const centerY = centerScreen.y - rect.top;

        if (guideTopRef.current) {
            guideTopRef.current.style.transform = `translateY(${topY}px)`;
            guideTopRef.current.style.opacity = '1';
        }
        if (guideBottomRef.current) {
            guideBottomRef.current.style.transform = `translateY(${bottomY}px)`;
            guideBottomRef.current.style.opacity = '1';
        }
        if (guideLeftRef.current) {
            guideLeftRef.current.style.transform = `translateX(${leftX}px)`;
            guideLeftRef.current.style.opacity = '1';
        }
        if (guideRightRef.current) {
            guideRightRef.current.style.transform = `translateX(${rightX}px)`;
            guideRightRef.current.style.opacity = '1';
        }
        if (guideCenterHRef.current) {
            guideCenterHRef.current.style.transform = `translateY(${centerY}px)`;
            guideCenterHRef.current.style.opacity = '0.5';
        }
        if (guideCenterVRef.current) {
            guideCenterVRef.current.style.transform = `translateX(${centerX}px)`;
            guideCenterVRef.current.style.opacity = '0.5';
        }
    };

    const hideNodeAlignmentGuides = () => {
        if (guideTopRef.current) guideTopRef.current.style.opacity = '0';
        if (guideBottomRef.current) guideBottomRef.current.style.opacity = '0';
        if (guideLeftRef.current) guideLeftRef.current.style.opacity = '0';
        if (guideRightRef.current) guideRightRef.current.style.opacity = '0';
        if (guideCenterHRef.current) guideCenterHRef.current.style.opacity = '0';
        if (guideCenterVRef.current) guideCenterVRef.current.style.opacity = '0';
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
        hideNodeAlignmentGuides();
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Shift' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                setIsSelectMode(true);
            }
        };
        const handleKeyUp = (e) => {
            if (e.key === 'Shift') setIsSelectMode(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.trim().length > 1) {
            const q = query.toLowerCase();
            const results = nodes.filter(n => 
                n.data?.label?.toLowerCase().includes(q) || 
                n.data?.ip?.toLowerCase().includes(q) ||
                n.data?.mac?.toLowerCase().includes(q)
            );
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };

    const handleSelectSearchResult = (node) => {
        setSearchQuery('');
        setSearchResults([]);
        setSelectedDevice(node.data);
        if (rfInstance) {
            rfInstance.setCenter(node.position.x, node.position.y, { zoom: 1.2, duration: 800 });
        }
    };

    const onConnect = (connection) => {
        let strokeColor = '#3b82f6';
        let strokeDasharray = 'none';
        if (connectionType === 'FO') strokeColor = '#ef4444';
        else if (connectionType === 'Wireless') { strokeColor = '#a855f7'; strokeDasharray = '5,5'; }

        setEdges((eds) => addEdge({
            ...connection,
            id: `e-${connection.source}-${connection.target}-${Date.now()}`,
            animated: true,
            type: 'draggable',
            style: { stroke: strokeColor, strokeWidth: 2, strokeDasharray }
        }, eds));
    };

    const onEdgeClick = (event, edge) => {
        // Interaksi klik edge dikelola langsung di komponen DraggableEdge
    };

    const notifKey = selectedDevice ? (selectedDevice.label || selectedDevice.hostname || selectedDevice.name || selectedDevice.id) : null;

    const onDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        handleMouseMove(e);
    };

    const onDrop = (e) => {
        e.preventDefault();
        const deviceId = e.dataTransfer.getData('application/reactflow');
        if (!deviceId || !rfInstance) return;

        const dev = devices.find(d => String(d.id) === deviceId || String(d.PID) === deviceId);
        if (!dev) return;

        const position = rfInstance.screenToFlowPosition({
            x: e.clientX,
            y: e.clientY,
        });

        const newNode = buildDeviceNode(dev, position);
        setNodes((nds) => [...nds, newNode]);
    };

    const handleRemoveNode = (deviceId) => {
        showConfirm('Keluarkan dari Canvas?', 'Perangkat akan dihapus dari canvas dan dikembalikan ke daftar Unmapped Devices.', 'Ya, Keluarkan').then((result) => {
            if (result.isConfirmed) {
                const targetNode = nodes.find(n => n.id === deviceId || n.data?.id === deviceId || n.data?.ip === deviceId);
                const targetId = targetNode ? targetNode.id : deviceId;
                const targetIp = targetNode?.data?.ip;
                const targetLabel = targetNode?.data?.label;

                setSavedLayoutConfig(prev => {
                    if (!prev || !prev.nodes) return prev;
                    const newNodes = { ...prev.nodes };
                    delete newNodes[targetId];
                    delete newNodes[deviceId];
                    return { ...prev, nodes: newNodes };
                });
                
                setNodes((nds) => nds.filter((n) => n.id !== targetId && n.id !== deviceId));
                setEdges((eds) => eds.filter((e) => e.source !== targetId && e.target !== targetId && e.source !== deviceId && e.target !== deviceId));
                setSelectedDevice(null);
                showToast('success', 'Perangkat berhasil dikeluarkan dari canvas. Klik "Simpan Layout" untuk menyimpan perubahan.');
            }
        });
    };

    const handleRemoveSelected = () => {
        const selectedNodes = nodes.filter(n => n.selected);
        if (selectedNodes.length === 0) {
            showToast('warning', 'Pilih perangkat yang ingin dikeluarkan');
            return;
        }

        showConfirm('Keluarkan dari Canvas?', `Sebanyak ${selectedNodes.length} perangkat akan dihapus dari canvas dan dikembalikan ke daftar Unmapped Devices.`, 'Ya, Keluarkan').then((result) => {
            if (result.isConfirmed) {
                const selectedIds = new Set(selectedNodes.map(n => n.id));
                const selectedIps = new Set(selectedNodes.map(n => n.data?.ip).filter(Boolean));
                const selectedLabels = new Set(selectedNodes.map(n => n.data?.label).filter(Boolean));

                setSavedLayoutConfig(prev => {
                    if (!prev || !prev.nodes) return prev;
                    const newNodes = { ...prev.nodes };
                    selectedIds.forEach(id => delete newNodes[id]);
                    selectedIps.forEach(ip => delete newNodes[ip]);
                    selectedLabels.forEach(label => delete newNodes[label]);
                    Object.keys(newNodes).forEach(k => {
                        if (selectedIps.has(newNodes[k]?.ip) || selectedLabels.has(newNodes[k]?.label)) {
                            delete newNodes[k];
                        }
                    });
                    return { ...prev, nodes: newNodes };
                });

                setNodes(nds => nds.filter(n => !selectedIds.has(n.id) && (!n.data?.ip || !selectedIps.has(n.data.ip))));
                setEdges(eds => eds.filter(e => !selectedIds.has(e.source) && !selectedIds.has(e.target)));
                
                if (selectedDevice && (selectedIds.has(selectedDevice.id) || selectedIps.has(selectedDevice.ip))) {
                    setSelectedDevice(null);
                }
                showToast('success', `${selectedNodes.length} perangkat dikeluarkan. Klik "Simpan Layout" untuk menyimpan perubahan.`);
            }
        });
    };

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 120px)', position: 'relative' }} className="flex flex-col gap-3">
            <TopologyHeader
                searchQuery={searchQuery}
                handleSearchChange={handleSearchChange}
                searchResults={searchResults}
                handleSelectSearchResult={handleSelectSearchResult}
                handleGroup={handleGroup}
                handleUngroup={handleUngroup}
                isSelectMode={isSelectMode}
                setIsSelectMode={setIsSelectMode}
                connectionType={connectionType}
                setConnectionType={setConnectionType}
                handleResetLayout={handleResetLayout}
                handleSaveLayout={handleSaveLayout}
                handleRemoveSelected={handleRemoveSelected}
                hasSelection={nodes.some(n => n.selected)}
                drawingsList={drawingsList}
                activeDrawing={activeDrawing}
                onSelectDrawing={onSelectDrawing}
                onCreateNewDrawing={handleCreateNewDrawing}
                onDuplicateDrawing={handleDuplicateDrawing}
                onRenameDrawing={handleRenameDrawing}
                onDeleteDrawing={handleDeleteDrawing}
            />

            <div 
                ref={containerRef}
                className="flex-1 relative w-full rounded-xl overflow-hidden border border-slate-800/80 cursor-crosshair"
                onMouseMoveCapture={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onDragOver={onDragOver}
                onDrop={onDrop}
            >
                {/* Crosshair Pointer Sumbu X & Y */}
                <div 
                    ref={crosshairHRef}
                    className="pointer-events-none absolute left-0 right-0 top-0 h-[1px] bg-cyan-400 shadow-[0_0_8px_#22d3ee] z-[9999] transition-none"
                    style={{ opacity: 0 }}
                />
                <div 
                    ref={crosshairVRef}
                    className="pointer-events-none absolute top-0 bottom-0 left-0 w-[1px] bg-cyan-400 shadow-[0_0_8px_#22d3ee] z-[9999] transition-none"
                    style={{ opacity: 0 }}
                />

                {/* Garis Bantu Perataan Panjang di Setiap Sisi Card (Alignment Guidelines) */}
                {/* Sisi Atas Card */}
                <div
                    ref={guideTopRef}
                    className="pointer-events-none absolute left-0 right-0 top-0 h-[1px] bg-amber-400 border-t border-dashed border-amber-300 shadow-[0_0_10px_#f59e0b] z-[9998] transition-none"
                    style={{ opacity: 0 }}
                />
                {/* Sisi Bawah Card */}
                <div
                    ref={guideBottomRef}
                    className="pointer-events-none absolute left-0 right-0 top-0 h-[1px] bg-amber-400 border-t border-dashed border-amber-300 shadow-[0_0_10px_#f59e0b] z-[9998] transition-none"
                    style={{ opacity: 0 }}
                />
                {/* Sisi Kiri Card */}
                <div
                    ref={guideLeftRef}
                    className="pointer-events-none absolute top-0 bottom-0 left-0 w-[1px] bg-amber-400 border-l border-dashed border-amber-300 shadow-[0_0_10px_#f59e0b] z-[9998] transition-none"
                    style={{ opacity: 0 }}
                />
                {/* Sisi Kanan Card */}
                <div
                    ref={guideRightRef}
                    className="pointer-events-none absolute top-0 bottom-0 left-0 w-[1px] bg-amber-400 border-l border-dashed border-amber-300 shadow-[0_0_10px_#f59e0b] z-[9998] transition-none"
                    style={{ opacity: 0 }}
                />
                {/* Sumbu Tengah Horizontal */}
                <div
                    ref={guideCenterHRef}
                    className="pointer-events-none absolute left-0 right-0 top-0 h-[1px] bg-cyan-300/60 border-t border-dotted border-cyan-400/80 shadow-[0_0_8px_#06b6d4] z-[9997] transition-none"
                    style={{ opacity: 0 }}
                />
                {/* Sumbu Tengah Vertikal */}
                <div
                    ref={guideCenterVRef}
                    className="pointer-events-none absolute top-0 bottom-0 left-0 w-[1px] bg-cyan-300/60 border-l border-dotted border-cyan-400/80 shadow-[0_0_8px_#06b6d4] z-[9997] transition-none"
                    style={{ opacity: 0 }}
                />

                <ReactFlow
                    nodes={nodes}
                    edges={highlightedEdges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    connectionMode={ConnectionMode.Loose}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={(e, node) => setSelectedDevice(node.data)}
                    onEdgeClick={onEdgeClick}
                    onNodeDragStart={(e, node) => {
                        if (crosshairHRef.current) crosshairHRef.current.style.opacity = '0';
                        if (crosshairVRef.current) crosshairVRef.current.style.opacity = '0';
                        updateNodeAlignmentGuides(node);
                    }}
                    onNodeDrag={(e, node) => {
                        updateNodeAlignmentGuides(node);
                    }}
                    onNodeDragStop={() => {
                        hideNodeAlignmentGuides();
                    }}
                    onPaneMouseMove={(e) => handleMouseMove(e)}
                    onInit={setRfInstance}
                    fitView
                    onlyRenderVisibleElements={true}
                    panOnDrag={!isSelectMode}
                    selectionOnDrag={isSelectMode}
                    selectionMode={SelectionMode.Partial}
                    multiSelectionKeyCode="Shift"
                    defaultEdgeOptions={{ type: 'draggable' }}
                    snapToGrid={true}
                    snapGrid={[24, 24]}
                    minZoom={0.1}
                    maxZoom={4}
                    className="bg-[#070c14]"
                >
                    <Background variant="lines" color="#334155" gap={24} lineWidth={1} className="opacity-40" />
                    <Controls showInteractive={false} className="!bg-slate-900 !border-slate-800 !text-slate-200 fill-slate-200" />
                    <MiniMap nodeColor="#1e293b" maskColor="rgba(7, 12, 20, 0.7)" className="!bg-slate-950 !border-slate-800" />
                </ReactFlow>

                <DeviceDetailPanel
                    selectedDevice={selectedDevice}
                    setSelectedDevice={setSelectedDevice}
                    snmpData={snmpData}
                    isLoadingSnmp={isLoadingSnmp}
                    nvrSnmpData={nvrSnmpData}
                    isLoadingNvrSnmp={isLoadingNvrSnmp}
                    vendorMetrics={vendorMetrics}
                    pollingOverrides={pollingOverrides}
                    handlePollingOverrideChange={handlePollingOverrideChange}
                    notificationPrefs={notificationPrefs}
                    handleNotificationToggle={handleNotificationToggle}
                    notifKey={notifKey}
                    handleRemoveNode={handleRemoveNode}
                />

                <LiveAlertLog onNavigateToIncidents={onNavigateToIncidents} />
                <TopologyLegend />
                <UnmappedDevicesLegend 
                    className="absolute top-6 right-6"
                    nodes={nodes}
                    onFocusNode={(node) => {
                        if (rfInstance && node.position) {
                            rfInstance.setCenter(node.position.x, node.position.y, { zoom: 1.2, duration: 800 });
                            setSelectedDevice(node.data);
                        }
                    }}
                    currentDevices={nodes.map(n => ({ 
                        id: n.id, 
                        PID: n.data?.id || n.id,
                        label: n.data?.label, 
                        originalLabel: n.data?.label, 
                        ip: n.data?.ip,
                        IP: n.data?.ip
                    }))} 
                />
            </div>
        </div>
    );
}