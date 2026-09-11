import React from 'react';
import { BaseEdge, getSmoothStepPath, EdgeLabelRenderer, useReactFlow, useStore } from 'reactflow';

export default function DraggableEdge(props) {
    const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data } = props;
    const { setEdges, screenToFlowPosition } = useReactFlow();
    const zoom = useStore((s) => s.transform[2]);

    let cps = data?.controlPoints || [];
    if (data?.controlPoint && cps.length === 0) {
        cps = [data.controlPoint];
    }

    const updateControlPoints = (newCps) => {
        setEdges((eds) => eds.map(edge => edge.id === id ? { ...edge, data: { ...edge.data, controlPoints: newCps } } : edge));
    };

    let path = '';
    
    // Default smoothstep if no control points
    if (cps.length === 0) {
        const [edgePath, labelX, labelY] = getSmoothStepPath({
            sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition
        });
        path = edgePath;
    } else {
        path = `M ${sourceX},${sourceY}`;
        cps.forEach(cp => {
            path += ` L ${cp.x},${cp.y}`;
        });
        path += ` L ${targetX},${targetY}`;
    }

    // Midpoints for adding new control points
    const points = [{ x: sourceX, y: sourceY }, ...cps, { x: targetX, y: targetY }];
    const midpoints = [];
    for (let i = 0; i < points.length - 1; i++) {
        midpoints.push({
            x: (points[i].x + points[i+1].x) / 2,
            y: (points[i].y + points[i+1].y) / 2,
            index: i
        });
    }

    const handlePathMouseDown = (e) => {
        e.stopPropagation();
        e.preventDefault();

        // Convert screen coordinates to canvas coordinates
        const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        
        // Initialize with 1 point at the click location
        updateControlPoints([flowPos]);

        const startX = e.clientX;
        const startY = e.clientY;
        const initialX = flowPos.x;
        const initialY = flowPos.y;

        const onMouseMove = (moveEvent) => {
            const dx = (moveEvent.clientX - startX) / zoom;
            const dy = (moveEvent.clientY - startY) / zoom;
            
            setEdges((eds) => eds.map(edge => {
                if (edge.id === id) {
                    const currentCps = [...(edge.data?.controlPoints || [])];
                    currentCps[0] = { x: initialX + dx, y: initialY + dy };
                    return { ...edge, data: { ...edge.data, controlPoints: currentCps } };
                }
                return edge;
            }));
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    return (
        <>
            <BaseEdge path={path} markerEnd={markerEnd} style={style} />
            
            {/* Fat path untuk interaksi klik dan drag garis langsung (hanya jika belum ada control point) */}
            {cps.length === 0 && (
                <path
                    d={path}
                    fill="none"
                    strokeOpacity={0}
                    strokeWidth={25}
                    className="react-flow__edge-interaction cursor-grab"
                    onMouseDown={handlePathMouseDown}
                    onClick={(e) => { e.stopPropagation(); }} 
                />
            )}

            <EdgeLabelRenderer>
                {/* Render handles for existing points */}
                {cps.map((cp, idx) => (
                    <HandlePoint
                        key={`cp-${idx}`}
                        x={cp.x} y={cp.y} zoom={zoom}
                        onDragMove={(newX, newY) => {
                            setEdges((eds) => eds.map(edge => {
                                if (edge.id === id) {
                                    const currentCps = [...(edge.data?.controlPoints || [])];
                                    if (currentCps[idx]) {
                                        currentCps[idx] = { x: newX, y: newY };
                                    }
                                    return { ...edge, data: { ...edge.data, controlPoints: currentCps } };
                                }
                                return edge;
                            }));
                        }}
                        onDoubleClick={() => {
                            const newCps = cps.filter((_, i) => i !== idx);
                            updateControlPoints(newCps);
                        }}
                    />
                ))}

                {/* Render 'add' handles at midpoints (hanya muncul jika sudah ada minimal 1 titik) */}
                {cps.length > 0 && midpoints.map((mp, idx) => (
                    <HandlePoint
                        key={`mp-${idx}`}
                        x={mp.x} y={mp.y} zoom={zoom}
                        isAddHandle={true}
                        onDragStart={() => {
                            const newCps = [...cps];
                            newCps.splice(mp.index, 0, { x: mp.x, y: mp.y });
                            updateControlPoints(newCps);
                        }}
                        onDragMove={(newX, newY) => {
                            setEdges((eds) => eds.map(edge => {
                                if (edge.id === id) {
                                    const currentCps = [...(edge.data?.controlPoints || [])];
                                    if (currentCps[mp.index]) {
                                        currentCps[mp.index] = { x: newX, y: newY };
                                    }
                                    return { ...edge, data: { ...edge.data, controlPoints: currentCps } };
                                }
                                return edge;
                            }));
                        }}
                    />
                ))}
            </EdgeLabelRenderer>
        </>
    );
}

function HandlePoint({ x, y, zoom, onDragStart, onDragMove, onDoubleClick, isAddHandle }) {
    const handleMouseDown = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const initialX = x;
        const initialY = y;
        
        if (onDragStart) onDragStart(initialX, initialY);
        
        const onMouseMove = (moveEvent) => {
            const dx = (moveEvent.clientX - startX) / zoom;
            const dy = (moveEvent.clientY - startY) / zoom;
            if (onDragMove) onDragMove(initialX + dx, initialY + dy);
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    return (
        <div
            style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${x}px,${y}px)`,
                pointerEvents: 'all',
                cursor: 'grab',
                zIndex: isAddHandle ? 1 : 10,
            }}
            className="nodrag nopan"
            onMouseDown={handleMouseDown}
            onClick={(e) => e.stopPropagation()} 
            onDoubleClick={(e) => {
                if (onDoubleClick) {
                    e.stopPropagation();
                    onDoubleClick();
                }
            }}
            title={isAddHandle ? "Tarik untuk menambah titik belok" : "Double-click untuk menghapus titik"}
        >
            <div className={`rounded-full border border-slate-700 shadow-sm transition-all hover:scale-125 flex items-center justify-center ${isAddHandle ? 'w-3.5 h-3.5 bg-emerald-500 opacity-40 hover:opacity-100' : 'w-4 h-4 bg-cyan-500 opacity-60 hover:opacity-100'}`}>
            </div>
        </div>
    );
}
