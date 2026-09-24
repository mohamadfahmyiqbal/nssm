import React, { useState, useEffect, useCallback } from 'react';
import { BaseEdge, EdgeLabelRenderer, useReactFlow, useStore } from 'reactflow';
import { showConfirm } from '../../utils/swal';
import {
    getDefaultOrthogonalPoints,
    adaptControlPoints,
    getFullOrthogonalRoute,
    getEdgeSegments,
    buildPathWithBridgesAndCorners,
    registerEdgeRoute,
    unregisterEdgeRoute
} from './edgeRoutingUtils';
import { ControlPointHandle, MidpointHandle } from './EdgeControlHandles';
import EdgeDisconnectButton from './EdgeDisconnectButton';

// Re-export helpers agar kompatibilitas komponen lain tetap terjaga
export {
    getDefaultOrthogonalPoints,
    adaptControlPoints,
    getFullOrthogonalRoute,
    getEdgeSegments,
    buildPathWithBridgesAndCorners,
    registerEdgeRoute,
    unregisterEdgeRoute
};

export default function DraggableEdge(props) {
    const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data, selected } = props;
    const { setEdges, screenToFlowPosition } = useReactFlow();
    const zoom = useStore((s) => s.transform[2]);
    const allEdges = useStore((s) => s.edges);
    const allNodes = useStore((s) => s.nodeInternals ? Array.from(s.nodeInternals.values()) : []);

    const [isHovered, setIsHovered] = useState(false);

    // Titik kontrol kustom yang tersimpan di data edge beserta anchor koordinat dasarnya
    const rawCps = data?.controlPoints || (data?.controlPoint ? [data.controlPoint] : []);
    const sourceAnchor = data?.sourceAnchor || { x: sourceX, y: sourceY };
    const targetAnchor = data?.targetAnchor || { x: targetX, y: targetY };

    const [localCps, setLocalCps] = useState(rawCps);
    const [localSourceAnchor, setLocalSourceAnchor] = useState(sourceAnchor);
    const [localTargetAnchor, setLocalTargetAnchor] = useState(targetAnchor);

    useEffect(() => {
        setLocalCps(rawCps);
        setLocalSourceAnchor(data?.sourceAnchor || { x: sourceX, y: sourceY });
        setLocalTargetAnchor(data?.targetAnchor || { x: targetX, y: targetY });
    }, [JSON.stringify(rawCps), data?.sourceAnchor?.x, data?.sourceAnchor?.y, data?.targetAnchor?.x, data?.targetAnchor?.y]);

    const commitControlPoints = useCallback((newCps) => {
        const curSourceAnchor = { x: sourceX, y: sourceY };
        const curTargetAnchor = { x: targetX, y: targetY };
        setLocalCps(newCps);
        setLocalSourceAnchor(curSourceAnchor);
        setLocalTargetAnchor(curTargetAnchor);
        if (data) {
            data.controlPoints = newCps;
            data.sourceAnchor = curSourceAnchor;
            data.targetAnchor = curTargetAnchor;
        }
        setEdges((eds) => eds.map(edge => edge.id === id ? { 
            ...edge, 
            data: { 
                ...edge.data, 
                controlPoints: newCps,
                sourceAnchor: curSourceAnchor,
                targetAnchor: curTargetAnchor
            } 
        } : edge));
    }, [data, id, setEdges, sourceX, sourceY, targetX, targetY]);

    // Adaptasi titik kontrol kustom terhadap pergeseran posisi node live
    const effectiveCps = adaptControlPoints(
        localCps,
        sourceX,
        sourceY,
        targetX,
        targetY,
        localSourceAnchor,
        localTargetAnchor
    );

    // Titik-titik pembentuk rute garis lengkap yang adaptif terhadap posisi node & titik kontrol
    const currentPoints = getFullOrthogonalRoute(
        sourceX,
        sourceY,
        targetX,
        targetY,
        effectiveCps,
        sourcePosition,
        targetPosition
    );

    // Daftarkan rute visual terkini agar edge lain dapat mendeteksi persilangan dengan koordinat piksel 100% presisi
    useEffect(() => {
        if (id && currentPoints.length >= 2) {
            registerEdgeRoute(id, currentPoints);
        }
    }, [id, currentPoints]);

    useEffect(() => {
        return () => {
            unregisterEdgeRoute(id);
        };
    }, [id]);

    // Simpan juga secara instan pada render phase pertama agar tidak menunggu cycle useEffect selesai
    if (id && currentPoints.length >= 2) {
        registerEdgeRoute(id, currentPoints);
    }

    // SVG path utama dengan corner rounding halus dan jembatan lengkung (Hop Arc)
    const path = buildPathWithBridgesAndCorners(id, currentPoints, allEdges, allNodes, 8, 9);

    // Hitung posisi tengah garis untuk tombol putus koneksi (Disconnect Button)
    const midSegmentIndex = Math.floor((currentPoints.length - 1) / 2);
    const pA = currentPoints[midSegmentIndex] || currentPoints[0];
    const pB = currentPoints[midSegmentIndex + 1] || currentPoints[currentPoints.length - 1];
    const centerEdgeX = (pA.x + pB.x) / 2;
    const centerEdgeY = (pA.y + pB.y) / 2;

    // Trigger putus koneksi via dialog konfirmasi
    const handleDisconnect = (e) => {
        e.stopPropagation();
        e.preventDefault();
        showConfirm('Putus Koneksi?', 'Apakah Anda yakin ingin memutus koneksi antara perangkat ini?', 'Ya, Putuskan')
        .then((result) => {
            if (result.isConfirmed) {
                setEdges((eds) => eds.filter((e) => e.id !== id));
            }
        });
    };

    // Double-click pada garis untuk menambahkan titik kontrol baru
    const handlePathDoubleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();

        const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        if (!flowPos) return;
        const clickX = flowPos.x;
        const clickY = flowPos.y;

        let insertIdx = 0;
        let minDist = Infinity;
        for (let i = 0; i < currentPoints.length - 1; i++) {
            const p1 = currentPoints[i];
            const p2 = currentPoints[i + 1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const l2 = dx * dx + dy * dy;
            let t = l2 === 0 ? 0 : ((clickX - p1.x) * dx + (clickY - p1.y) * dy) / l2;
            t = Math.max(0, Math.min(1, t));
            const projX = p1.x + t * dx;
            const projY = p1.y + t * dy;
            const dist = Math.hypot(clickX - projX, clickY - projY);
            if (dist < minDist) {
                minDist = dist;
                insertIdx = i;
            }
        }

        const basePoints = currentPoints.slice(1, -1).map(p => ({ ...p }));
        basePoints.splice(Math.max(0, insertIdx - 1), 0, { x: clickX, y: clickY });
        commitControlPoints(basePoints);
    };

    // Handler untuk drag langsung pada segmen garis (Direct Segment Drag)
    const handleSegmentDragStart = (e, segIndex) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();

        const startClientX = e.clientX;
        const startClientY = e.clientY;
        const currentZoom = zoom || 1;

        const initialPoints = currentPoints.map(p => ({ ...p }));
        const p1 = initialPoints[segIndex];
        const p2 = initialPoints[segIndex + 1];
        if (!p1 || !p2) return;

        const isHoriz = Math.abs(p1.y - p2.y) < 2;

        const handlePointerMove = (moveEvent) => {
            moveEvent.stopPropagation();
            moveEvent.preventDefault();

            const deltaX = (moveEvent.clientX - startClientX) / currentZoom;
            const deltaY = (moveEvent.clientY - startClientY) / currentZoom;

            const updated = initialPoints.map(p => ({ ...p }));

            if (isHoriz) {
                if (segIndex > 0) updated[segIndex].y = p1.y + deltaY;
                if (segIndex + 1 < updated.length - 1) updated[segIndex + 1].y = p2.y + deltaY;
                if (segIndex === 0) {
                    updated.splice(1, 0, { x: p1.x, y: p1.y + deltaY });
                } else if (segIndex + 1 === updated.length - 1) {
                    updated.splice(updated.length - 1, 0, { x: p2.x, y: p2.y + deltaY });
                }
            } else {
                if (segIndex > 0) updated[segIndex].x = p1.x + deltaX;
                if (segIndex + 1 < updated.length - 1) updated[segIndex + 1].x = p2.x + deltaX;
                if (segIndex === 0) {
                    updated.splice(1, 0, { x: p1.x + deltaX, y: p1.y });
                } else if (segIndex + 1 === updated.length - 1) {
                    updated.splice(updated.length - 1, 0, { x: p2.x + deltaX, y: p2.y });
                }
            }

            const newCps = updated.slice(1, -1);
            setLocalCps(newCps);
        };

        const handlePointerUp = (upEvent) => {
            upEvent.stopPropagation();
            upEvent.preventDefault();

            window.removeEventListener('pointermove', handlePointerMove, true);
            window.removeEventListener('pointerup', handlePointerUp, true);
            window.removeEventListener('pointercancel', handlePointerUp, true);

            const deltaX = (upEvent.clientX - startClientX) / currentZoom;
            const deltaY = (upEvent.clientY - startClientY) / currentZoom;

            const updated = initialPoints.map(p => ({ ...p }));
            if (isHoriz) {
                if (segIndex > 0) updated[segIndex].y = p1.y + deltaY;
                if (segIndex + 1 < updated.length - 1) updated[segIndex + 1].y = p2.y + deltaY;
                if (segIndex === 0) {
                    updated.splice(1, 0, { x: p1.x, y: p1.y + deltaY });
                } else if (segIndex + 1 === updated.length - 1) {
                    updated.splice(updated.length - 1, 0, { x: p2.x, y: p2.y + deltaY });
                }
            } else {
                if (segIndex > 0) updated[segIndex].x = p1.x + deltaX;
                if (segIndex + 1 < updated.length - 1) updated[segIndex + 1].x = p2.x + deltaX;
                if (segIndex === 0) {
                    updated.splice(1, 0, { x: p1.x + deltaX, y: p1.y });
                } else if (segIndex + 1 === updated.length - 1) {
                    updated.splice(updated.length - 1, 0, { x: p2.x + deltaX, y: p2.y });
                }
            }

            const newCps = updated.slice(1, -1);
            commitControlPoints(newCps);
        };

        window.addEventListener('pointermove', handlePointerMove, { capture: true, passive: false });
        window.addEventListener('pointerup', handlePointerUp, { capture: true, passive: false });
        window.addEventListener('pointercancel', handlePointerUp, { capture: true, passive: false });
    };

    // Segmen-segmen interaktif untuk pergeseran garis langsung
    const interactiveSegments = [];
    for (let i = 0; i < currentPoints.length - 1; i++) {
        const p1 = currentPoints[i];
        const p2 = currentPoints[i + 1];
        const isHoriz = Math.abs(p1.y - p2.y) < 2;
        interactiveSegments.push({
            p1,
            p2,
            index: i,
            isHoriz,
            path: `M ${p1.x},${p1.y} L ${p2.x},${p2.y}`,
            midX: (p1.x + p2.x) / 2,
            midY: (p1.y + p2.y) / 2
        });
    }

    const isConnectedSelected = data?.isConnectedSelected;
    const isActive = isHovered || selected;

    return (
        <g 
            className="group/edge-wrapper"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Garis Dasar Berwarna (Base Edge) dengan Gradient & Glow Halus */}
            <BaseEdge 
                path={path} 
                markerEnd={markerEnd} 
                interactionWidth={isConnectedSelected ? 6 : 4}
                style={{
                    ...style,
                    stroke: isConnectedSelected ? '#f43f5e' : (isActive ? '#38bdf8' : (style?.stroke || '#3b82f6')),
                    strokeWidth: isConnectedSelected ? 3.5 : (isActive ? 3 : (style?.strokeWidth || 2)),
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    filter: isConnectedSelected 
                        ? 'drop-shadow(0 0 10px rgba(244, 63, 94, 0.9))' 
                        : (isActive ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.75))' : 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.3))'),
                    animation: isConnectedSelected ? 'edge-pulse-red 0.9s infinite ease-in-out' : undefined,
                    transition: 'stroke 0.2s ease, stroke-width 0.15s ease, filter 0.2s ease'
                }} 
            />
            
            {/* Fat Paths Interaktif per Segmen untuk Direct Drag Garis */}
            {interactiveSegments.map((seg) => (
                <path
                    key={`seg-${seg.index}`}
                    d={seg.path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={24}
                    className="cursor-grab active:cursor-grabbing hover:stroke-cyan-400/20"
                    style={{ pointerEvents: 'stroke', touchAction: 'none' }}
                    onPointerDown={(e) => handleSegmentDragStart(e, seg.index)}
                    onDoubleClick={handlePathDoubleClick}
                    title="Klik & geser untuk memindahkan garis, double-click untuk tambah titik belok"
                />
            ))}

            <EdgeLabelRenderer>
                {/* Tombol Putus Koneksi Floating di Atas Garis */}
                {isActive && (
                    <EdgeDisconnectButton
                        x={centerEdgeX}
                        y={centerEdgeY}
                        onDisconnect={handleDisconnect}
                    />
                )}

                {/* Render Handle Titik Belok yang Tersimpan (Cyan Circle) */}
                {effectiveCps.map((cp, idx) => (
                    <ControlPointHandle
                        key={`cp-${idx}`}
                        pointX={cp.x} 
                        pointY={cp.y}
                        zoom={zoom}
                        onDragLive={(newX, newY) => {
                            const updated = [...effectiveCps];
                            if (updated[idx]) {
                                updated[idx] = { x: newX, y: newY };
                                setLocalCps(updated);
                                setLocalSourceAnchor({ x: sourceX, y: sourceY });
                                setLocalTargetAnchor({ x: targetX, y: targetY });
                            }
                        }}
                        onDragEnd={(newX, newY) => {
                            const updated = [...effectiveCps];
                            if (updated[idx]) {
                                updated[idx] = { x: newX, y: newY };
                                commitControlPoints(updated);
                            }
                        }}
                        onDoubleClick={() => {
                            const newCps = effectiveCps.filter((_, i) => i !== idx);
                            commitControlPoints(newCps);
                        }}
                    />
                ))}

                {/* Render Handle Penambahan Titik di Tengah Segmen saat Hover/Select (Hijau Circle) */}
                {isActive && interactiveSegments.map((seg) => (
                    <MidpointHandle
                        key={`mid-${seg.index}`}
                        pointX={seg.midX}
                        pointY={seg.midY}
                        zoom={zoom}
                        onDragStart={(startPoint) => {
                            const basePoints = effectiveCps.length > 0
                                ? [...effectiveCps]
                                : getDefaultOrthogonalPoints(sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition).slice(1, -1);
                            basePoints.splice(seg.index, 0, startPoint);
                            setLocalCps(basePoints);
                            setLocalSourceAnchor({ x: sourceX, y: sourceY });
                            setLocalTargetAnchor({ x: targetX, y: targetY });
                            return seg.index;
                        }}
                        onDragLive={(insertedIdx, newX, newY) => {
                            setLocalCps(prev => {
                                const next = [...prev];
                                if (next[insertedIdx]) {
                                    next[insertedIdx] = { x: newX, y: newY };
                                }
                                return next;
                            });
                        }}
                        onDragEnd={(insertedIdx, newX, newY) => {
                            setLocalCps(prev => {
                                const next = [...prev];
                                if (next[insertedIdx]) {
                                    next[insertedIdx] = { x: newX, y: newY };
                                }
                                commitControlPoints(next);
                                return next;
                            });
                        }}
                    />
                ))}
            </EdgeLabelRenderer>
        </g>
    );
}
