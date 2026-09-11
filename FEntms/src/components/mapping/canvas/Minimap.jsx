import React, { useMemo } from 'react';
import { Stage, Layer, Rect, Circle, Line } from 'react-konva';

export default function Minimap({
    dimensions,
    stagePos,
    stageScale,
    rooms,
    devices,
    lines,
    onViewportDrag
}) {
    const MINIMAP_WIDTH = 200;
    const MINIMAP_HEIGHT = 150;

    // Calculate bounds of all elements to determine minimap scale and offset
    const bounds = useMemo(() => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let hasElements = false;

        rooms.forEach(r => {
            hasElements = true;
            minX = Math.min(minX, r.x);
            minY = Math.min(minY, r.y);
            maxX = Math.max(maxX, r.x + (r.width || 0));
            maxY = Math.max(maxY, r.y + (r.height || 0));
        });

        devices.forEach(d => {
            hasElements = true;
            minX = Math.min(minX, d.x - 15);
            minY = Math.min(minY, d.y - 15);
            maxX = Math.max(maxX, d.x + 15);
            maxY = Math.max(maxY, d.y + 15);
        });

        lines.forEach(l => {
            if (!l.points || l.points.length === 0) return;
            hasElements = true;
            for (let i = 0; i < l.points.length; i += 2) {
                minX = Math.min(minX, l.points[i]);
                minY = Math.min(minY, l.points[i+1]);
                maxX = Math.max(maxX, l.points[i]);
                maxY = Math.max(maxY, l.points[i+1]);
            }
        });

        if (!hasElements) {
            return { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
        }

        // Add padding
        const padding = 200;
        return {
            minX: minX - padding,
            minY: minY - padding,
            maxX: maxX + padding,
            maxY: maxY + padding
        };
    }, [rooms, devices, lines]);

    const worldWidth = bounds.maxX - bounds.minX;
    const worldHeight = bounds.maxY - bounds.minY;

    // Calculate scale to fit the world into the minimap
    const scaleX = MINIMAP_WIDTH / worldWidth;
    const scaleY = MINIMAP_HEIGHT / worldHeight;
    const scale = Math.min(scaleX, scaleY);

    // Calculate offset to center the world in the minimap
    const offsetX = (MINIMAP_WIDTH - worldWidth * scale) / 2;
    const offsetY = (MINIMAP_HEIGHT - worldHeight * scale) / 2;

    // Viewport rectangle calculations
    // stagePos is the top-left of the stage in screen coordinates.
    // viewport is the visible area of the world.
    const viewportWidth = dimensions.width / stageScale;
    const viewportHeight = dimensions.height / stageScale;
    const viewportX = -stagePos.x / stageScale;
    const viewportY = -stagePos.y / stageScale;

    const minimapViewportX = (viewportX - bounds.minX) * scale + offsetX;
    const minimapViewportY = (viewportY - bounds.minY) * scale + offsetY;
    const minimapViewportW = viewportWidth * scale;
    const minimapViewportH = viewportHeight * scale;

    const handleDragMove = (e) => {
        if (!onViewportDrag) return;
        const node = e.target;
        const newMiniX = node.x();
        const newMiniY = node.y();

        // Convert back to world coordinates, then to stage position
        const newWorldX = (newMiniX - offsetX) / scale + bounds.minX;
        const newWorldY = (newMiniY - offsetY) / scale + bounds.minY;

        onViewportDrag({
            x: -newWorldX * stageScale,
            y: -newWorldY * stageScale
        });
    };

    const handleMapClick = (e) => {
        if (!onViewportDrag) return;
        const stage = e.target.getStage();
        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;

        const worldX = (pointerPos.x - offsetX) / scale + bounds.minX;
        const worldY = (pointerPos.y - offsetY) / scale + bounds.minY;

        onViewportDrag({
            x: dimensions.width / 2 - worldX * stageScale,
            y: dimensions.height / 2 - worldY * stageScale
        });
    };

    return (
        <div className="absolute bottom-4 left-4 z-20 bg-slate-950/90 border border-slate-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1 bg-slate-900 border-b border-slate-800">
                Minimap
            </div>
            <Stage 
                width={MINIMAP_WIDTH} 
                height={MINIMAP_HEIGHT}
                onClick={handleMapClick}
                onTap={handleMapClick}
            >
                <Layer>
                    <Rect 
                        width={MINIMAP_WIDTH} 
                        height={MINIMAP_HEIGHT} 
                        fill="#0d131f" 
                    />
                    
                    {/* Render simplified rooms */}
                    {rooms.map(r => (
                        <Rect
                            key={r.id}
                            x={(r.x - bounds.minX) * scale + offsetX}
                            y={(r.y - bounds.minY) * scale + offsetY}
                            width={r.width * scale}
                            height={r.height * scale}
                            fill="rgba(30, 41, 59, 0.8)"
                            stroke="#475569"
                            strokeWidth={1}
                        />
                    ))}

                    {/* Render simplified lines */}
                    {lines.map(l => {
                        const scaledPoints = l.points.map((p, i) => 
                            i % 2 === 0 
                                ? (p - bounds.minX) * scale + offsetX 
                                : (p - bounds.minY) * scale + offsetY
                        );
                        return (
                            <Line
                                key={l.id}
                                points={scaledPoints}
                                stroke={l.color || '#3b82f6'}
                                strokeWidth={1}
                                tension={l.isCurve ? (l.tension || 0.4) : 0}
                            />
                        );
                    })}

                    {/* Render simplified devices */}
                    {devices.filter(d => !d.hideIcon).map(d => (
                        <Circle
                            key={d.id}
                            x={(d.x - bounds.minX) * scale + offsetX}
                            y={(d.y - bounds.minY) * scale + offsetY}
                            radius={2}
                            fill="#38bdf8"
                        />
                    ))}

                    {/* Viewport Indicator */}
                    <Rect
                        x={minimapViewportX}
                        y={minimapViewportY}
                        width={minimapViewportW}
                        height={minimapViewportH}
                        stroke="#22d3ee"
                        strokeWidth={1.5}
                        fill="rgba(34, 211, 238, 0.15)"
                        draggable
                        onDragMove={handleDragMove}
                        onDragEnd={(e) => {
                            // Reset position of rect in minimap local space so re-render handles it
                            e.target.x(minimapViewportX);
                            e.target.y(minimapViewportY);
                        }}
                    />
                </Layer>
            </Stage>
        </div>
    );
}
