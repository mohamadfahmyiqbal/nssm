import React from 'react';
import { Group, Rect, Line, Text } from 'react-konva';

export default function RoomGroup({
    room,
    tool,
    selectedIds,
    onSelect,
    onSaveHistory,
    onTransform,
    onLabelDragEnd,
    snapToGrid,
    gridSize,
    showRoomLabels = true
}) {
    const isStairs = room.isStairs || room.type === 'stairs';
    const stepCount = 8;
    const stepLines = [];

    if (isStairs && room.width && room.height) {
        const isHorizontal = room.width >= room.height;
        if (isHorizontal) {
            const stepW = room.width / stepCount;
            for (let i = 1; i < stepCount; i++) {
                stepLines.push([i * stepW, 0, i * stepW, room.height]);
            }
        } else {
            const stepH = room.height / stepCount;
            for (let i = 1; i < stepCount; i++) {
                stepLines.push([0, i * stepH, room.width, i * stepH]);
            }
        }
    }

    return (
        <Group
            id={room.id}
            x={room.x}
            y={room.y}
            width={room.width}
            height={room.height}
            draggable={tool === 'select'}
            dragBoundFunc={function (pos) {
                // Transformasi posisi layar ke koordinat lokal kanvas (agar akurat saat zoom/pan)
                const stage = this.getStage();
                if (!stage) return pos;
                const transform = stage.getAbsoluteTransform().copy().invert();
                const localPos = transform.point(pos);
                const snappedLocal = snapToGrid(localPos);
                return stage.getAbsoluteTransform().point(snappedLocal);
            }}
            onDragStart={onSaveHistory}
            onDragEnd={(e) => {
                const node = e.target;
                if (node.name() !== 'room-label') {
                    onTransform(room.id, node.x(), node.y(), room.width, room.height);
                }
            }}
            onClick={(e) => {
                e.cancelBubble = true;
                if (e.evt.shiftKey) {
                    onSelect(prev => prev.includes(room.id) ? prev.filter(id => id !== room.id) : [...prev, room.id]);
                } else {
                    onSelect([room.id]);
                }
            }}
            onTransformEnd={(e) => {
                onSaveHistory();
                const node = e.target;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();

                const rawWidth = node.width() * scaleX;
                const rawHeight = node.height() * scaleY;

                const step = gridSize > 1 ? gridSize : 1;
                const newWidth = Math.max(step, Math.round(rawWidth / step) * step);
                const newHeight = Math.max(step, Math.round(rawHeight / step) * step);

                node.scaleX(1);
                node.scaleY(1);
                node.width(newWidth);
                node.height(newHeight);

                onTransform(room.id, node.x(), node.y(), newWidth, newHeight);
            }}
        >
            <Rect
                width={room.width}
                height={room.height}
                fill={isStairs ? "rgba(234, 88, 12, 0.25)" : "rgba(30, 41, 59, 0.6)"}
                stroke={selectedIds?.includes(room.id) ? '#3b82f6' : (isStairs ? '#f97316' : '#475569')}
                strokeWidth={2}
                cornerRadius={0}
            />

            {/* Garis anak tangga jika bertipe tangga */}
            {isStairs && stepLines.map((pts, idx) => (
                <Line
                    key={`step-${idx}`}
                    points={pts}
                    stroke={selectedIds?.includes(room.id) ? '#60a5fa' : '#fb923c'}
                    strokeWidth={1.5}
                    dash={[4, 2]}
                />
            ))}

            {showRoomLabels && (
                <Text
                    name="room-label"
                    text={room.label}
                    fontSize={10}
                    fontFamily="monospace"
                    fill={isStairs ? "#fdba74" : "#94a3b8"}
                    x={room.labelX !== undefined ? room.labelX : 8}
                    y={room.labelY !== undefined ? room.labelY : 8}
                    rotation={room.labelRotation || 0}
                    draggable={tool === 'select'}
                    onDragStart={(e) => {
                        e.cancelBubble = true;
                        onSaveHistory();
                    }}
                    onDragEnd={(e) => {
                        e.cancelBubble = true;
                        const textNode = e.target;
                        if (onLabelDragEnd) {
                            onLabelDragEnd(room.id, textNode.x(), textNode.y());
                        }
                    }}
                    onMouseEnter={(e) => {
                        if (tool === 'select') {
                            const container = e.target.getStage().container();
                            container.style.cursor = 'move';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (tool === 'select') {
                            const container = e.target.getStage().container();
                            container.style.cursor = 'crosshair';
                        }
                    }}
                />
            )}
        </Group>
    );
}