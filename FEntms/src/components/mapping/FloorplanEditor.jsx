import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Transformer, Circle } from 'react-konva';

import EditorToolbar from './EditorToolbar';
import PropertyPanel from './PropertyPanel';
import GridLayer from './canvas/GridLayer';
import RoomGroup from './canvas/RoomGroup';
import DeviceNode from './canvas/DeviceNode';
import BlueprintBackground from './canvas/BlueprintBackground';
import ZoomControls from './canvas/ZoomControls';
import Minimap from './canvas/Minimap';

// Custom Hooks
import useCanvasTransform from './hooks/useCanvasTransform';
import useFloorplanData from './hooks/useFloorplanData';

export default function FloorplanEditor() {
    const [tool, setTool] = useState('select');
    const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });

    const containerRef = useRef(null);
    const stageRef = useRef(null);
    const transformerRef = useRef(null);
    const isDrawing = useRef(false);
    const selectionBoxRef = useRef({ visible: false, x1: 0, y1: 0, x2: 0, y2: 0 });
    const crosshairHRef = useRef(null);
    const crosshairVRef = useRef(null);
    const selectionRectRef = useRef(null);
    const mousePosRef = useRef(null);
    const requestRef = useRef(null);

    const [gridSnap, setGridSnap] = useState(20);
    const [showRoomLabels, setShowRoomLabels] = useState(true);
    const GRID_SIZE = gridSnap;

    const {
        stageScale, stagePos, setStagePos,
        setIsMiddleDragging, isPanningActive,
        handleWheel, handleZoomIn, handleZoomOut, handleResetZoom,
        getRelativePointerPosition, snapToGrid
    } = useCanvasTransform(stageRef, tool, GRID_SIZE);

    const {
        floorplansList, activeFloorplan, loadFloorplanDetail,
        handleCreateNewDrawing, handleDeleteDrawing, handleDuplicateDrawing, handleRenameDrawing,
        lines, setLines, rooms, setRooms, devices, setDevices,
        selectedIds, setSelectedIds, history, isSavingDB,
        saveHistory, handleUndo, handleDeleteSelected, handleDuplicateSelected,
        handleBringToFront, handleSendToBack,
        handleResetCanvas, handleSaveToDatabase, handleExportImage,
        notificationPrefs, handleNotificationToggle,
        syncFloorplanDevices
    } = useFloorplanData(stageRef);

    useEffect(() => {
        if (selectedIds?.length > 0 && transformerRef.current && stageRef.current) {
            const selectedNodes = selectedIds.map(id => stageRef.current.findOne('#' + id)).filter(Boolean);
            transformerRef.current.nodes(selectedNodes);
            transformerRef.current.getLayer().batchDraw();
        } else if (transformerRef.current) {
            transformerRef.current.nodes([]);
        }
    }, [selectedIds, rooms, devices, lines]);

    useEffect(() => {
        const panCanvas = () => {
            if (isDrawing.current && mousePosRef.current && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const mx = mousePosRef.current.x - rect.left;
                const my = mousePosRef.current.y - rect.top;
                
                const PAN_MARGIN = 50;
                const PAN_SPEED = 8;

                let dx = 0;
                let dy = 0;

                if (mx > 0 && mx < PAN_MARGIN) dx = PAN_SPEED;
                else if (mx < rect.width && mx > rect.width - PAN_MARGIN) dx = -PAN_SPEED;
                
                if (my > 0 && my < PAN_MARGIN) dy = PAN_SPEED;
                else if (my < rect.height && my > rect.height - PAN_MARGIN) dy = -PAN_SPEED;

                if (dx !== 0 || dy !== 0) {
                    setStagePos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                }
            }
            requestRef.current = requestAnimationFrame(panCanvas);
        };
        requestRef.current = requestAnimationFrame(panCanvas);
        return () => cancelAnimationFrame(requestRef.current);
    }, [setStagePos]);

    useEffect(() => {
        if (tool !== 'fo' && tool !== 'utp') {
            isDrawing.current = false;
        }
    }, [tool]);

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight || 600,
                });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const handleMouseDown = (e) => {
        if (e.evt.button === 1) {
            e.evt.preventDefault();
            setIsMiddleDragging(true);
            return;
        }

        if (isPanningActive) return;

        if (tool === 'select') {
            const isClickOnEmpty = e.target === e.target.getStage() || e.target.name() === 'blueprint-bg' || e.target.name() === 'grid-layer';
            if (isClickOnEmpty) {
                if (!e.evt.shiftKey) setSelectedIds([]);
                const stage = e.target.getStage();
                const pos = stage.getRelativePointerPosition();
                if (pos) {
                    selectionBoxRef.current = {
                        visible: true,
                        x1: pos.x,
                        y1: pos.y,
                        x2: pos.x,
                        y2: pos.y
                    };
                    if (selectionRectRef.current) {
                        selectionRectRef.current.visible(true);
                        selectionRectRef.current.width(0);
                        selectionRectRef.current.height(0);
                        selectionRectRef.current.x(pos.x);
                        selectionRectRef.current.y(pos.y);
                        selectionRectRef.current.getLayer().batchDraw();
                    }
                }
            }
            return;
        }

        const stage = e.target.getStage();
        const relativePointer = getRelativePointerPosition(stage);
        const point = snapToGrid(relativePointer);
        saveHistory();

        if (tool === 'wall') {
            isDrawing.current = true;
            setLines([...lines, { id: `line-${Date.now()}`, points: [point.x, point.y, point.x, point.y], isCurve: false, tension: 0 }]);
        } else if (tool === 'curve') {
            isDrawing.current = true;
            setLines([...lines, { id: `line-${Date.now()}`, points: [point.x, point.y, point.x, point.y, point.x, point.y], isCurve: true, tension: 0.4, color: '#a855f7' }]);
        } else if (tool === 'fo' || tool === 'utp') {
            if (!isDrawing.current) {
                isDrawing.current = true;
                const color = tool === 'fo' ? '#f59e0b' : '#38bdf8';
                setLines([...lines, { id: `line-${Date.now()}`, points: [point.x, point.y, point.x, point.y, point.x, point.y], isCurve: false, tension: 0, color }]);
            } else {
                const lastLine = lines[lines.length - 1];
                const pts = lastLine.points;
                const len = pts.length;
                const anchorX = pts[len - 6];
                const anchorY = pts[len - 5];
                
                if (Math.abs(anchorX - point.x) < 5 && Math.abs(anchorY - point.y) < 5) {
                    isDrawing.current = false;
                    setLines((prev) => {
                        const newLast = { ...prev[prev.length - 1] };
                        newLast.points = newLast.points.slice(0, len - 4);
                        if (newLast.points.length <= 2) return prev.slice(0, prev.length - 1);
                        return [...prev.slice(0, prev.length - 1), newLast];
                    });
                } else {
                    setLines((prev) => {
                        const newLast = { ...prev[prev.length - 1] };
                        newLast.points = [...newLast.points, point.x, point.y, point.x, point.y];
                        return [...prev.slice(0, prev.length - 1), newLast];
                    });
                }
            }
        } else if (tool === 'room') {
            setRooms([...rooms, { id: `room-${Date.now()}`, x: point.x, y: point.y, width: 160, height: 100, label: 'RUANG BARU' }]);
            setTool('select');
        } else if (tool === 'stairs') {
            setRooms([...rooms, { id: `room-${Date.now()}`, x: point.x, y: point.y, width: 120, height: 80, label: 'TANGGA', isStairs: true, type: 'stairs' }]);
            setTool('select');
        } else if (['camera', 'switch', 'server', 'ap', 'pc', 'modem', 'otb', 'cable', 'firewall', 'ups', 'ups-battery', 'ats', 'nas'].includes(tool)) {
            const labels = { camera: 'CAM-01', switch: 'SW-01', server: 'SRV-01', ap: 'AP-01', pc: 'PC-01', modem: 'MDM-01', otb: 'OTB-01', cable: 'CBL-01', firewall: 'FW-01', ups: 'UPS-01', 'ups-battery': 'BAT-01', ats: 'ATS-01', nas: 'NAS-01' };
            const prefix = (labels[tool] || 'DEV-01').split('-')[0];
            const countSameType = devices.filter(d => d.type === tool).length + 1;
            const autoLabel = `${prefix}-${String(countSameType).padStart(2, '0')}`;
            const newDevId = `P-${prefix}-${Date.now().toString().slice(-4)}`;
            const newDevice = { 
                id: newDevId, 
                PID: newDevId, 
                x: point.x, 
                y: point.y, 
                type: tool, 
                label: autoLabel, 
                ip: '192.168.1.100',
                status: 'UP'
            };
            const updated = [...devices, newDevice];
            setDevices(updated);
            if (syncFloorplanDevices && activeFloorplan) {
                syncFloorplanDevices(activeFloorplan.name, updated, rooms);
            }
            setTool('select');
        }
    };

    const handleMouseMove = (e) => {
        mousePosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
        if (isPanningActive) return;

        if (selectionBoxRef.current.visible && tool === 'select') {
            const stage = e.target.getStage();
            const pos = stage.getRelativePointerPosition();
            if (pos) {
                selectionBoxRef.current.x2 = pos.x;
                selectionBoxRef.current.y2 = pos.y;
                
                if (selectionRectRef.current) {
                    const sb = selectionBoxRef.current;
                    selectionRectRef.current.setAttrs({
                        x: Math.min(sb.x1, sb.x2),
                        y: Math.min(sb.y1, sb.y2),
                        width: Math.abs(sb.x1 - sb.x2),
                        height: Math.abs(sb.y1 - sb.y2),
                    });
                    selectionRectRef.current.getLayer().batchDraw();
                }
            }
            return;
        }

        if (!isDrawing.current) return;
        const stage = e.target.getStage();
        const relativePointer = getRelativePointerPosition(stage);
        const point = snapToGrid(relativePointer);

        if (tool === 'wall') {
            setLines((prev) => {
                const lastLine = { ...prev[prev.length - 1] };
                lastLine.points = [lastLine.points[0], lastLine.points[1], point.x, point.y];
                return [...prev.slice(0, prev.length - 1), lastLine];
            });
        } else if (tool === 'curve') {
            setLines((prev) => {
                const lastLine = { ...prev[prev.length - 1] };
                const [x1, y1] = [lastLine.points[0], lastLine.points[1]];
                const [x2, y2] = [point.x, point.y];
                const cx = (x1 + x2) / 2 - (y2 - y1) * 0.25;
                const cy = (y1 + y2) / 2 + (x2 - x1) * 0.25;

                lastLine.points = [x1, y1, cx, cy, x2, y2];
                return [...prev.slice(0, prev.length - 1), lastLine];
            });
        } else if (tool === 'fo' || tool === 'utp') {
            setLines((prev) => {
                const lastLine = { ...prev[prev.length - 1] };
                const pts = [...lastLine.points];
                const len = pts.length;
                const anchorX = pts[len - 6];
                const anchorY = pts[len - 5];
                
                // L-shape orthogonal routing: Horizontal then Vertical
                pts[len - 4] = point.x;
                pts[len - 3] = anchorY;
                pts[len - 2] = point.x;
                pts[len - 1] = point.y;
                
                lastLine.points = pts;
                return [...prev.slice(0, prev.length - 1), lastLine];
            });
        }
    };

    const handleMouseUp = (e) => {
        if (selectionBoxRef.current.visible && tool === 'select') {
            selectionBoxRef.current.visible = false;
            if (selectionRectRef.current) {
                selectionRectRef.current.visible(false);
                selectionRectRef.current.getLayer().batchDraw();
            }
            
            const box = {
                x: Math.min(selectionBoxRef.current.x1, selectionBoxRef.current.x2),
                y: Math.min(selectionBoxRef.current.y1, selectionBoxRef.current.y2),
                width: Math.abs(selectionBoxRef.current.x1 - selectionBoxRef.current.x2),
                height: Math.abs(selectionBoxRef.current.y1 - selectionBoxRef.current.y2)
            };

            if (box.width > 10 && box.height > 10) {
                const newSelections = [];
                rooms.forEach(r => {
                    if (r.x < box.x + box.width && r.x + r.width > box.x && r.y < box.y + box.height && r.y + r.height > box.y) {
                        newSelections.push(r.id);
                    }
                });
                devices.forEach(d => {
                    const devSize = 24;
                    const dx = d.x - devSize/2;
                    const dy = d.y - devSize/2;
                    if (dx < box.x + box.width && dx + devSize > box.x && dy < box.y + box.height && dy + devSize > box.y) {
                        newSelections.push(d.id);
                    }
                });
                lines.forEach(l => {
                    const minX = Math.min(l.points[0], l.points[l.points.length-2]);
                    const maxX = Math.max(l.points[0], l.points[l.points.length-2]);
                    const minY = Math.min(l.points[1], l.points[l.points.length-1]);
                    const maxY = Math.max(l.points[1], l.points[l.points.length-1]);
                    if (minX < box.x + box.width && maxX > box.x && minY < box.y + box.height && maxY > box.y) {
                        newSelections.push(l.id);
                    }
                });

                if (newSelections.length > 0) {
                    setSelectedIds((prev) => e.evt.shiftKey ? [...new Set([...prev, ...newSelections])] : newSelections);
                }
            }
        }
        if (e.evt.button === 1) setIsMiddleDragging(false);
        if (tool !== 'fo' && tool !== 'utp') {
            isDrawing.current = false;
        }
    };

    const handleSelectSearchResult = (id) => {
        setSelectedIds([id]);
        const item = devices.find(d => d.id === id) || rooms.find(r => r.id === id);
        if (item) {
            setStagePos({
                x: (dimensions.width / 2) - (item.x * stageScale),
                y: (dimensions.height / 2) - (item.y * stageScale)
            });
        }
    };

    const firstSelectedId = selectedIds?.length === 1 ? selectedIds[0] : null;
    const selectedRoom = firstSelectedId ? rooms.find((r) => r.id === firstSelectedId) : null;
    const selectedDevice = firstSelectedId ? devices.find((d) => d.id === firstSelectedId) : null;
    const selectedLine = firstSelectedId ? lines.find((l) => l.id === firstSelectedId) : null;

    return (
        <div className="flex flex-col lg:flex-row gap-4 min-h-[680px] font-sans text-xs text-slate-200">
            <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col shadow-2xl">
                <EditorToolbar
                    tool={tool}
                    setTool={setTool}
                    gridSnap={gridSnap}
                    setGridSnap={setGridSnap}
                    showRoomLabels={showRoomLabels}
                    setShowRoomLabels={setShowRoomLabels}
                    history={history}
                    selectedIds={selectedIds}
                    floorplansList={floorplansList}
                    activeFloorplan={activeFloorplan}
                    onSelectFloorplan={loadFloorplanDetail}
                    onCreateNewDrawing={handleCreateNewDrawing}
                    onDeleteDrawing={handleDeleteDrawing}
                    onDuplicateDrawing={handleDuplicateDrawing}
                    onRenameDrawing={handleRenameDrawing}
                    onUndo={handleUndo}
                    onDelete={handleDeleteSelected}
                    onDuplicate={handleDuplicateSelected}
                    onBringToFront={handleBringToFront}
                    onSendToBack={handleSendToBack}
                    onExport={handleExportImage}
                    onSaveDB={handleSaveToDatabase}
                    isSavingDB={isSavingDB}
                    onResetCanvas={() => handleResetCanvas(handleResetZoom)}
                    devices={devices}
                    rooms={rooms}
                    setSelectedIds={setSelectedIds}
                    onSelectSearchResult={handleSelectSearchResult}
                />

                <div 
                    ref={containerRef} 
                    className={`flex-1 w-full min-h-[580px] bg-[#0d131f] rounded-xl border border-slate-800 overflow-hidden relative ${tool === 'select' ? 'cursor-crosshair' : ''}`}
                    onMouseMoveCapture={(e) => {
                        if (tool !== 'select') return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        if (crosshairHRef.current) {
                            crosshairHRef.current.style.transform = `translateY(${y}px)`;
                            crosshairHRef.current.style.opacity = '1';
                        }
                        if (crosshairVRef.current) {
                            crosshairVRef.current.style.transform = `translateX(${x}px)`;
                            crosshairVRef.current.style.opacity = '1';
                        }
                    }}
                    onDragOverCapture={(e) => {
                        e.preventDefault();
                        if (tool !== 'select') return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        if (crosshairHRef.current) {
                            crosshairHRef.current.style.transform = `translateY(${y}px)`;
                            crosshairHRef.current.style.opacity = '1';
                        }
                        if (crosshairVRef.current) {
                            crosshairVRef.current.style.transform = `translateX(${x}px)`;
                            crosshairVRef.current.style.opacity = '1';
                        }
                    }}
                    onMouseLeave={() => {
                        if (crosshairHRef.current) crosshairHRef.current.style.opacity = '0';
                        if (crosshairVRef.current) crosshairVRef.current.style.opacity = '0';
                    }}
                >
                    {/* Crosshair Horizontal */}
                    <div 
                        ref={crosshairHRef}
                        className="pointer-events-none absolute left-0 right-0 top-0 h-[1px] bg-cyan-400 shadow-[0_0_8px_#22d3ee] z-[9999] transition-none"
                        style={{ opacity: 0 }}
                    />
                    {/* Crosshair Vertical */}
                    <div 
                        ref={crosshairVRef}
                        className="pointer-events-none absolute top-0 bottom-0 left-0 w-[1px] bg-cyan-400 shadow-[0_0_8px_#22d3ee] z-[9999] transition-none"
                        style={{ opacity: 0 }}
                    />

                    <ZoomControls
                        stageScale={stageScale}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onResetZoom={handleResetZoom}
                    />

                    <Minimap
                        dimensions={dimensions}
                        stagePos={stagePos}
                        stageScale={stageScale}
                        rooms={rooms}
                        devices={devices}
                        lines={lines}
                        onViewportDrag={setStagePos}
                    />

                    <Stage
                        width={dimensions.width}
                        height={dimensions.height}
                        x={stagePos.x}
                        y={stagePos.y}
                        scaleX={stageScale}
                        scaleY={stageScale}
                        onWheel={handleWheel}
                        draggable={isPanningActive}
                        onDragMove={(e) => {
                            const stage = e.target.getStage();
                            const ptr = stage?.getPointerPosition();
                            if (ptr) {
                                if (crosshairHRef.current) {
                                    crosshairHRef.current.style.transform = `translateY(${ptr.y}px)`;
                                    crosshairHRef.current.style.opacity = '1';
                                }
                                if (crosshairVRef.current) {
                                    crosshairVRef.current.style.transform = `translateX(${ptr.x}px)`;
                                    crosshairVRef.current.style.opacity = '1';
                                }
                            }
                        }}
                        onDragEnd={(e) => {
                            if (e.target === stageRef.current) setStagePos({ x: e.target.x(), y: e.target.y() });
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        ref={stageRef}
                        className={isPanningActive ? 'cursor-grab active:cursor-grabbing' : ''}
                    >
                        <Layer>
                            <BlueprintBackground width={dimensions.width} height={dimensions.height} />
                        </Layer>

                        <GridLayer dimensions={dimensions} gridSize={GRID_SIZE} />

                        <Layer>
                            {rooms.map((room) => (
                                <RoomGroup
                                    key={room.id}
                                    room={room}
                                    tool={tool}
                                    selectedIds={selectedIds}
                                    onSelect={setSelectedIds}
                                    onSaveHistory={saveHistory}
                                    onTransform={(id, x, y, width, height) => {
                                        setRooms((prev) => prev.map((r) => r.id === id ? { ...r, x, y, width, height } : r));
                                    }}
                                    onLabelDragEnd={(id, labelX, labelY) => {
                                        setRooms((prev) => prev.map((r) => r.id === id ? { ...r, labelX, labelY } : r));
                                    }}
                                    snapToGrid={snapToGrid}
                                    gridSize={GRID_SIZE}
                                    showRoomLabels={showRoomLabels}
                                />
                            ))}

                            {devices.map((device) => (
                                <DeviceNode
                                    key={device.id}
                                    device={device}
                                    tool={tool}
                                    selectedIds={selectedIds}
                                    onSelect={setSelectedIds}
                                    onSaveHistory={saveHistory}
                                    snapToGrid={snapToGrid}
                                    onDragEnd={(id, x, y) => {
                                        setDevices((prev) => prev.map((d) => d.id === id ? { ...d, x, y } : d));
                                    }}
                                />
                            ))}

                            {lines.map((line) => {
                                const isSelected = selectedIds?.includes(line.id);
                                return (
                                <React.Fragment key={line.id}>
                                <Line
                                    id={line.id}
                                    points={line.points}
                                    stroke={isSelected ? '#f43f5e' : (line.color || (line.isCurve ? '#a855f7' : '#38bdf8'))}
                                    strokeWidth={isSelected ? 5 : 3}
                                    tension={line.isCurve ? (line.tension || 0.4) : 0}
                                    opacity={0.6}
                                    hitStrokeWidth={15}
                                    lineCap="round"
                                    lineJoin="round"
                                    draggable={tool === 'select'}
                                    dragBoundFunc={function (pos) {
                                        const stage = this.getStage();
                                        if (!stage) return pos;
                                        const transform = stage.getAbsoluteTransform().copy().invert();
                                        const localPos = transform.point(pos);
                                        const snappedLocal = snapToGrid(localPos);
                                        return stage.getAbsoluteTransform().point(snappedLocal);
                                    }}
                                    onDragStart={saveHistory}
                                    onTransformEnd={(e) => {
                                        saveHistory();
                                        const node = e.target;
                                        const scaleX = node.scaleX();
                                        const scaleY = node.scaleY();

                                        const newPoints = line.points.map((val, idx) => (idx % 2 === 0 ? val * scaleX : val * scaleY));

                                        node.scaleX(1);
                                        node.scaleY(1);

                                        setLines((prev) => prev.map((l) => l.id === line.id ? { ...l, points: newPoints } : l));
                                    }}
                                    onDragEnd={(e) => {
                                        const node = e.target;
                                        const dx = node.x();
                                        const dy = node.y();

                                        setLines((prev) => prev.map((l) => {
                                            if (l.id === line.id) {
                                                const newPoints = l.points.map((val, idx) => (idx % 2 === 0 ? val + dx : val + dy));
                                                return { ...l, points: newPoints };
                                            }
                                            return l;
                                        }));
                                        node.x(0);
                                        node.y(0);
                                    }}
                                    onClick={(e) => {
                                        e.cancelBubble = true;
                                        if (e.evt.shiftKey) {
                                            setSelectedIds(prev => prev.includes(line.id) ? prev.filter(id => id !== line.id) : [...prev, line.id]);
                                        } else {
                                            setSelectedIds([line.id]);
                                        }
                                    }}
                                    onDblClick={(e) => {
                                        if (tool === 'select' && isSelected) {
                                            const stage = e.target.getStage();
                                            const pos = getRelativePointerPosition(stage);
                                            const pts = line.points;
                                            let minD = Infinity;
                                            let insertIdx = 0;
                                            for (let i = 0; i < pts.length - 2; i += 2) {
                                                const x1 = pts[i], y1 = pts[i+1], x2 = pts[i+2], y2 = pts[i+3];
                                                const A = pos.x - x1, B = pos.y - y1, C = x2 - x1, D = y2 - y1;
                                                const dot = A * C + B * D;
                                                const len_sq = C * C + D * D;
                                                let param = -1;
                                                if (len_sq !== 0) param = dot / len_sq;
                                                let xx, yy;
                                                if (param < 0) { xx = x1; yy = y1; }
                                                else if (param > 1) { xx = x2; yy = y2; }
                                                else { xx = x1 + param * C; yy = y1 + param * D; }
                                                const dx = pos.x - xx, dy = pos.y - yy;
                                                const d = Math.sqrt(dx * dx + dy * dy);
                                                if (d < minD) {
                                                    minD = d;
                                                    insertIdx = i + 2;
                                                }
                                            }
                                            
                                            // Add L-shape (2 points) or straight (1 point)?
                                            // Since it's orthogonal routing, adding 2 points is safer, but adding 1 point allows more control
                                            // Let's add 1 point (vertex) where they clicked
                                            const snapped = snapToGrid(pos);
                                            saveHistory();
                                            setLines(prev => prev.map(l => {
                                                if (l.id === line.id) {
                                                    const newPts = [...l.points];
                                                    newPts.splice(insertIdx, 0, snapped.x, snapped.y);
                                                    return { ...l, points: newPts };
                                                }
                                                return l;
                                            }));
                                        }
                                    }}
                                />
                                {isSelected && tool === 'select' && (
                                    line.points.reduce((acc, val, idx, arr) => {
                                        if (idx % 2 === 0) {
                                            acc.push(
                                                <Circle
                                                    key={`${line.id}-anchor-${idx}`}
                                                    x={arr[idx]}
                                                    y={arr[idx + 1]}
                                                    radius={5}
                                                    fill="#ffffff"
                                                    stroke="#f43f5e"
                                                    strokeWidth={2}
                                                    draggable
                                                    dragBoundFunc={function (pos) {
                                                        const stage = this.getStage();
                                                        if (!stage) return pos;
                                                        const transform = stage.getAbsoluteTransform().copy().invert();
                                                        const localPos = transform.point(pos);
                                                        const snappedLocal = snapToGrid(localPos);
                                                        return stage.getAbsoluteTransform().point(snappedLocal);
                                                    }}
                                                    onDragStart={saveHistory}
                                                    onDragMove={(e) => {
                                                        const newX = e.target.x();
                                                        const newY = e.target.y();
                                                        setLines(prev => prev.map(l => {
                                                            if (l.id === line.id) {
                                                                const pts = [...l.points];
                                                                pts[idx] = newX;
                                                                pts[idx + 1] = newY;
                                                                return { ...l, points: pts };
                                                            }
                                                            return l;
                                                        }));
                                                    }}
                                                    onDblClick={(e) => {
                                                        e.cancelBubble = true;
                                                        saveHistory();
                                                        setLines(prev => prev.map(l => {
                                                            if (l.id === line.id && l.points.length > 4) {
                                                                const pts = [...l.points];
                                                                pts.splice(idx, 2);
                                                                return { ...l, points: pts };
                                                            }
                                                            return l;
                                                        }));
                                                    }}
                                                />
                                            );
                                        }
                                        return acc;
                                    }, [])
                                )}
                                </React.Fragment>
                                );
                            })}

                            <Transformer
                                ref={transformerRef}
                                keepRatio={false}
                                ignoreStroke={true}
                                enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right']}
                                boundBoxFunc={(oldBox, newBox) => {
                                    const minSize = GRID_SIZE > 1 ? GRID_SIZE : 5;
                                    return (newBox.width < minSize || newBox.height < minSize) ? oldBox : newBox;
                                }}
                                anchorSize={8}
                                anchorCornerRadius={2}
                                anchorFill="#3b82f6"
                                anchorStroke="#ffffff"
                                borderStroke="#3b82f6"
                                borderDash={[3, 3]}
                            />
                        </Layer>

                        {/* Separate Layer for Selection Box to avoid re-drawing all devices on mouse move */}
                        <Layer>
                            <Rect
                                ref={selectionRectRef}
                                fill="rgba(59, 130, 246, 0.2)"
                                stroke="#3b82f6"
                                strokeWidth={1}
                                dash={[4, 4]}
                                listening={false}
                                visible={false}
                            />
                        </Layer>
                    </Stage>
                </div>
            </div>

            <PropertyPanel
                tool={tool}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                rooms={rooms}
                devices={devices}
                lines={lines}
                selectedRoom={selectedRoom}
                selectedDevice={selectedDevice}
                selectedLine={selectedLine}
                linesCount={lines.length}
                roomsCount={rooms.length}
                devicesCount={devices.length}
                setRooms={setRooms}
                setDevices={setDevices}
                setLines={setLines}
                saveHistory={saveHistory}
                gridSize={GRID_SIZE}
                setGridSnap={setGridSnap}
                notificationPrefs={notificationPrefs}
                handleNotificationToggle={handleNotificationToggle}
            />
        </div>
    );
}