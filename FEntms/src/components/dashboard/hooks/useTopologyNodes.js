import { useMemo, useState, useEffect, useCallback } from 'react';
import { initialEdges } from '../../../data/topologyData';
import { showToast } from '../../../utils/swal';
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';

export const useTopologyNodes = (devices = [], activeFilter = 'ALL', nvrSnmpData = null, selectedDevice = null) => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    // Helper untuk membuat struktur node dari data device
    const buildDeviceNode = useCallback((dev, position = { x: 100, y: 100 }, parentNode = undefined) => {
        const devName = dev.hostname || dev.name || dev.label;
        const devId = String(dev.PID || dev.id || `dev-${Date.now()}`);

        const isSwitch = dev.type?.toLowerCase() === 'switch' || (devName && (devName.toLowerCase().includes('sw-') || devName.toLowerCase().includes('switch')));

        let calcSubType = dev.type?.toLowerCase();
        if (!calcSubType || calcSubType === 'server' || calcSubType === 'cctv') {
            if (devName && devName.toLowerCase().includes('nvr')) calcSubType = 'nvr';
            else if (devName && devName.toLowerCase().includes('cam')) calcSubType = 'camera';
            else if (devName && devName.toLowerCase().includes('gather')) calcSubType = 'gathering';
            else calcSubType = calcSubType || 'server';
        }

        const isCctv = calcSubType === 'camera' || calcSubType === 'nvr' || (dev.vendor?.toLowerCase().includes('cctv'));

        const node = {
            id: devId,
            type: isSwitch ? 'customDevice' : 'endpointDevice',
            position: { x: position.x || 0, y: position.y || 0 },
            data: {
                id: devId,
                label: devName || devId,
                subType: calcSubType,
                status: dev.status ? dev.status.toLowerCase() : 'up',
                ip: dev.ip || dev.IP || '192.168.1.1',
                category: isCctv ? 'cctv' : 'lan',
                location: dev.location || 'DB Live Device',
                floor: dev.floor || 'Unmapped',
                layer: isSwitch ? 'ACCESS' : undefined,
                cpu: dev.snmpData?.cpu || dev.snmpData?.cpuUsage || dev.cpu || 'N/A',
                memory: dev.snmpData?.memory || dev.snmpData?.memoryUsage || dev.memory || 'N/A',
                vlan: isCctv ? 'CCTV' : 'LAN',
                manufacturer: dev.info?.manufacturer || dev.manufacturer || dev.snmpData?.sysName,
                model: dev.info?.model || dev.model || dev.snmpData?.model || dev.snmpData?.sysDescr,
                alarmSummary: dev.info?.alarmSummary || dev.alarmSummary,
                temperature: dev.info?.temperature || dev.temperature || dev.snmpData?.temperature,
                fanStatus: dev.info?.fanStatus || dev.fanStatus || dev.snmpData?.fanStatus,
                psuStatus: dev.info?.psuStatus || dev.psuStatus || dev.snmpData?.psuStatus,
                raidStatus: dev.info?.raidStatus || dev.raidStatus,
                recordingState: dev.info?.recordingState || dev.recordingState,
                firmware: dev.snmpData?.firmware || dev.snmpData?.sysDescr,
                uptime: dev.snmpData?.uptime,
                trafficIn: dev.snmpData?.trafficIn || dev.snmpData?.networkTraffic?.in,
                trafficOut: dev.snmpData?.trafficOut || dev.snmpData?.networkTraffic?.out,
                networkTraffic: {
                    in: dev.snmpData?.trafficIn || dev.snmpData?.networkTraffic?.in || '0 MB',
                    out: dev.snmpData?.trafficOut || dev.snmpData?.networkTraffic?.out || '0 MB'
                },
                port: dev.PORT || dev.port || '-',
                ports: dev.snmpData?.ports || undefined,
                vendor: dev.vendor || dev.VENDOR || undefined,
                mac: dev.mac || dev.MAC || '-'
            }
        };

        if (parentNode) {
            node.parentNode = parentNode;
            node.extent = 'parent';
        }

        return node;
    }, []);

    // Filter daftar device global
    const filteredDevices = useMemo(() => {
        if (activeFilter === 'LAN') {
            return devices.filter(d => {
                const name = (d.hostname || d.name || '').toLowerCase();
                const type = (d.type || '').toLowerCase();
                return type !== 'cctv' && !name.includes('cam') && !name.includes('nvr');
            });
        }
        if (activeFilter === 'CCTV') {
            return devices.filter(d => {
                const name = (d.hostname || d.name || '').toLowerCase();
                const type = (d.type || '').toLowerCase();
                return type === 'cctv' || name.includes('cam') || name.includes('nvr') || name.includes('core');
            });
        }
        return devices;
    }, [devices, activeFilter]);

    const defaultEdges = useMemo(() => {
        return initialEdges || [];
    }, []);

    // Live Telemetry Sync: saat polling di DeviceContext mengupdate status/telemetri, sinkronkan ke node yang ada di canvas
    useEffect(() => {
        if (devices.length === 0) return;

        setNodes((currentNodes) => {
            if (currentNodes.length === 0) return currentNodes;

            let hasChanged = false;
            const updated = currentNodes.map((n) => {
                if (n.type === 'customGroup') return n;

                const devId = n.id || n.data?.id;

                const liveDev = devices.find(d => 
                    String(d.PID || d.id) === String(devId)
                );

                if (!liveDev) return n;

                const newStatus = liveDev.status ? liveDev.status.toLowerCase() : n.data.status;
                const newCpu = liveDev.snmpData?.cpu || liveDev.snmpData?.cpuUsage || n.data.cpu;
                const newMem = liveDev.snmpData?.memory || liveDev.snmpData?.memoryUsage || n.data.memory;
                const newTemp = liveDev.snmpData?.temperature || n.data.temperature;

                const liveHost = liveDev.hostname || liveDev.name || liveDev.label;
                const liveIp = liveDev.ip || liveDev.IP;

                if (
                    n.data.status !== newStatus || 
                    n.data.cpu !== newCpu || 
                    n.data.memory !== newMem ||
                    n.data.temperature !== newTemp ||
                    (liveHost && n.data.label !== liveHost) ||
                    (liveIp && n.data.ip !== liveIp)
                ) {
                    hasChanged = true;
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            label: liveHost || n.data.label,
                            ip: liveIp || n.data.ip,
                            status: newStatus,
                            cpu: newCpu,
                            memory: newMem,
                            temperature: newTemp,
                            trafficIn: liveDev.snmpData?.trafficIn || n.data.trafficIn,
                            trafficOut: liveDev.snmpData?.trafficOut || n.data.trafficOut,
                        }
                    };
                }

                return n;
            });

            return hasChanged ? updated : currentNodes;
        });
    }, [devices]);

    // Grouping functions
    const handleGroup = useCallback(() => {
        setNodes((nds) => {
            const selectedNodes = nds.filter(n => n.selected && n.type !== 'customGroup');
            if (selectedNodes.length < 2) {
                showToast('warning', 'Pilih minimal 2 perangkat untuk di-group');
                return nds;
            }

            const padding = 60;
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            selectedNodes.forEach(n => {
                const absoluteX = n.parentNode ? n.position.x + (nds.find(p => p.id === n.parentNode)?.position.x || 0) : n.position.x;
                const absoluteY = n.parentNode ? n.position.y + (nds.find(p => p.id === n.parentNode)?.position.y || 0) : n.position.y;
                if (absoluteX < minX) minX = absoluteX;
                if (absoluteY < minY) minY = absoluteY;

                const w = n.type === 'customDevice' ? 210 : 180;
                const h = n.type === 'customDevice' ? 140 : 80;
                if (absoluteX + w > maxX) maxX = absoluteX + w;
                if (absoluteY + h > maxY) maxY = absoluteY + h;
            });

            const groupId = `group-${Date.now()}`;
            const groupWidth = (maxX - minX) + padding * 2;
            const groupHeight = (maxY - minY) + padding * 2;
            const groupX = minX - padding;
            const groupY = minY - padding;

            const newGroup = {
                id: groupId,
                type: 'customGroup',
                position: { x: groupX, y: groupY },
                style: { width: groupWidth, height: groupHeight },
                data: { label: 'Group' },
            };

            const nextNodes = nds.map(n => {
                if (n.selected && n.type !== 'customGroup') {
                    const absoluteX = n.parentNode ? n.position.x + (nds.find(p => p.id === n.parentNode)?.position.x || 0) : n.position.x;
                    const absoluteY = n.parentNode ? n.position.y + (nds.find(p => p.id === n.parentNode)?.position.y || 0) : n.position.y;
                    return {
                        ...n,
                        parentNode: groupId,
                        extent: 'parent',
                        position: { x: absoluteX - groupX, y: absoluteY - groupY },
                        selected: false,
                    };
                }
                return n;
            });

            showToast('success', 'Group berhasil dibuat!');
            return [newGroup, ...nextNodes];
        });
    }, []);

    const handleUngroup = useCallback(() => {
        setNodes((nds) => {
            const selectedGroups = nds.filter(n => n.selected && n.type === 'customGroup');
            const selectedNodesInGroup = nds.filter(n => n.selected && n.parentNode);

            if (selectedGroups.length === 0 && selectedNodesInGroup.length === 0) {
                showToast('warning', 'Pilih grup atau perangkat dalam grup untuk di-ungroup');
                return nds;
            }

            const groupsToRemove = new Set(selectedGroups.map(g => g.id));

            let finalNodes = nds.filter(n => !groupsToRemove.has(n.id)).map(n => {
                if (groupsToRemove.has(n.parentNode) || (n.selected && n.parentNode)) {
                    const groupNode = nds.find(g => g.id === n.parentNode);
                    if (groupNode) {
                        const { parentNode, extent, ...rest } = n;
                        return {
                            ...rest,
                            position: {
                                x: n.position.x + groupNode.position.x,
                                y: n.position.y + groupNode.position.y,
                            },
                        };
                    }
                }
                return n;
            });

            const validParentIds = new Set(finalNodes.filter(n => n.type === 'customGroup').map(n => n.id));
            finalNodes = finalNodes.map(n => {
                if (n.parentNode && !validParentIds.has(n.parentNode)) {
                    const { parentNode, extent, ...rest } = n;
                    return rest;
                }
                return n;
            });

            showToast('success', 'Ungroup berhasil!');
            return finalNodes;
        });
    }, []);

    const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

    return {
        nodes,
        setNodes,
        edges,
        setEdges,
        defaultEdges,
        filteredDevices,
        buildDeviceNode,
        handleGroup,
        handleUngroup,
        onNodesChange,
        onEdgesChange
    };
};
