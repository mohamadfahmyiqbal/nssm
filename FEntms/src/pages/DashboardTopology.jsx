import React, { useState, useMemo, useEffect } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

import { nodeTypes } from '../components/nodes/nodeTypes';
import LiveAlertLog from '../components/LiveAlertLog';

import { Layers, LogOut } from 'lucide-react';
import socketService from '../services/socketService';

export default function DashboardTopology() {
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    // Initial fetch API & Socket Listen
    useEffect(() => {
        const fetchInitialTopology = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/topology');
                const result = await response.json();
                
                if (result.success && result.nodes && result.edges) {
                    setNodes(result.nodes);
                    setEdges(result.edges);
                }
            } catch (error) {
                console.error("Gagal mengambil status topologi dari database:", error);
            }
        };

        // Load state pertama kali dari DB
        fetchInitialTopology();

        // Listen update real-time via Socket.IO
        const handleStatusUpdate = (payload) => {
            setNodes((prevNodes) =>
                prevNodes.map((node) => {
                    if (
                        (payload.pid && (node.id === payload.pid || node.data.pid === payload.pid)) ||
                        (payload.ip && node.data.ip === payload.ip) ||
                        (payload.hostname && (node.data.label === payload.hostname || node.data.name === payload.hostname))
                    ) {
                        const snmp = payload.snmpData || {};
                        const nvr = payload.nvrData || {};
                        const nvrInfo = nvr.info || {};

                        return {
                            ...node,
                            data: {
                                ...node.data,
                                status: payload.status ? payload.status.toLowerCase() : node.data.status,
                                latency: payload.latency !== undefined ? payload.latency : node.data.latency,
                                updatedAt: payload.updatedAt || new Date().toISOString(),
                                // Direct metric properties for Node Components
                                cpu: snmp.cpuUsage || snmp.cpu || node.data.cpu,
                                memory: snmp.memoryUsage || snmp.memory || node.data.memory,
                                temperature: snmp.temperature || nvrInfo.temperature || node.data.temperature,
                                ports: snmp.ports && snmp.ports.length > 0 ? snmp.ports : node.data.ports,
                                trafficIn: snmp.trafficIn || node.data.trafficIn,
                                trafficOut: snmp.trafficOut || node.data.trafficOut,
                                firmware: snmp.firmware || nvrInfo.firmware || node.data.firmware,
                                uptime: snmp.uptime || nvrInfo.uptime || node.data.uptime,
                                // Nested objects
                                ...(payload.nvrData ? { nvrData: payload.nvrData } : {}),
                                ...(payload.snmpData ? { snmpData: payload.snmpData } : {})
                            },
                        };
                    }
                    return node;
                })
            );
        };

        socketService.onStatusUpdate(handleStatusUpdate);

        return () => {
            socketService.offStatusUpdate(handleStatusUpdate);
        };
    }, []);

    // Filter Logic berdasarkan tombol tab (ALL NETWORKS, LAN NETWORK, CCTV NETWORK)
    const filteredNodes = useMemo(() => {
        if (activeFilter === 'LAN') {
            return nodes.filter(
                (node) => !node.data.vlan?.includes('CCTV') && node.data.category !== 'cctv'
            );
        }
        if (activeFilter === 'CCTV') {
            return nodes.filter(
                (node) => node.data.vlan?.includes('CCTV') || node.data.category === 'cctv' || node.id.includes('core')
            );
        }
        return nodes;
    }, [activeFilter, nodes]);

    const filteredEdges = useMemo(() => {
        const activeNodeIds = new Set(filteredNodes.map((n) => n.id));
        return edges.filter(
            (edge) => activeNodeIds.has(edge.source) && activeNodeIds.has(edge.target)
        );
    }, [filteredNodes, edges]);

    return (
        <div className="w-full h-screen bg-[#070c14] text-slate-100 flex flex-col font-sans overflow-hidden">

            {/* 1. TOP HEADER & NAVIGATION */}
            <header className="flex items-center justify-between px-6 py-3 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-black tracking-wider text-base">NTMS PORTAL</h1>
                        <p className="text-[10px] text-slate-400 font-mono">Network Topology Management System</p>
                    </div>
                </div>

                {/* Network Filters */}
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 font-mono text-xs">
                    <button
                        onClick={() => setActiveFilter('ALL')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${activeFilter === 'ALL' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                        ALL NETWORKS
                    </button>
                    <button
                        onClick={() => setActiveFilter('LAN')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${activeFilter === 'LAN' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                        LAN NETWORK
                    </button>
                    <button
                        onClick={() => setActiveFilter('CCTV')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${activeFilter === 'CCTV' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                        CCTV NETWORK
                    </button>
                </div>

                {/* Main Navigation Menu */}
                <div className="flex items-center gap-6 font-mono text-xs font-bold">
                    <span className="text-blue-400 border-b-2 border-blue-500 pb-1 cursor-pointer">DASHBOARD</span>
                    <span className="text-slate-400 hover:text-slate-200 cursor-pointer">INVENTORY</span>
                    <span className="text-slate-400 hover:text-slate-200 cursor-pointer">LOCATION MAPPING</span>
                    <span className="text-slate-400 hover:text-slate-200 cursor-pointer">REPORTS & SLA</span>
                </div>

                {/* Info & Logout */}
                <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-400">Cikampek, 14.00.46 WIB</span>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 border border-rose-800/60 text-rose-400 rounded-xl hover:bg-rose-900/60 font-bold">
                        <LogOut className="w-3.5 h-3.5" />
                        <span>LOGOUT</span>
                    </button>
                </div>
            </header>

            {/* 2. STATUS COUNTER BAR */}
            <div className="flex items-center gap-3 px-6 py-2.5 bg-slate-950/40 border-b border-slate-900 font-mono text-xs z-10">
                <span className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 rounded-lg font-bold">UP: 45</span>
                <span className="px-2.5 py-1 bg-amber-950/60 border border-amber-800/60 text-amber-400 rounded-lg font-bold">WARNING: 3</span>
                <span className="px-2.5 py-1 bg-rose-950/60 border border-rose-800/60 text-rose-400 rounded-lg font-bold">DOWN: 1</span>
                <span className="px-2.5 py-1 bg-purple-950/60 border border-purple-800/60 text-purple-400 rounded-lg font-bold">UNKNOWN: 2</span>
            </div>

            {/* 3. TOPOLOGY CANVAS AREA */}
            <div className="flex-1 relative w-full h-full">
                <ReactFlow
                    nodes={filteredNodes}
                    edges={filteredEdges}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-[#070c14]"
                >
                    <Background color="#1e293b" gap={24} size={1} />
                    <Controls className="!bg-slate-900 !border-slate-800 !text-slate-200 fill-slate-200" />
                    <MiniMap nodeColor="#1e293b" maskColor="rgba(7, 12, 20, 0.7)" className="!bg-slate-950 !border-slate-800" />
                </ReactFlow>

                {/* Floating Live Alert Log */}
                <LiveAlertLog />
            </div>

        </div>
    );
}