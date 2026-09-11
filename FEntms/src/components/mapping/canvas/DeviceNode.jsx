import React from 'react';
import { Group, Rect, Circle, Text, Path } from 'react-konva';
import { useDevices } from '../../../context/DeviceContext';

export default function DeviceNode({
    device,
    tool,
    selectedIds,
    onSelect,
    onSaveHistory,
    snapToGrid,
    onDragEnd
}) {
    const { devices: liveInventory } = useDevices();
    const devName = device.label || device.name || '';
    const matchedInventory = liveInventory?.find(
        (d) => d.name?.toLowerCase() === devName.toLowerCase() || d.hostname?.toLowerCase() === devName.toLowerCase()
    );

    const liveStatus = (matchedInventory?.status || device.status || 'UP').toUpperCase();

    const getDeviceColor = (type) => {
        switch (type) {
            case 'camera': return '#8b5cf6';
            case 'switch': return '#06b6d4';
            case 'server': return '#f59e0b';
            case 'ap': return '#10b981';
            case 'pc': return '#ec4899';
            case 'modem': return '#ef4444'; // red
            case 'otb': return '#71717a'; // zinc
            case 'cable': return '#eab308'; // yellow
            case 'firewall': return '#f97316'; // orange
            case 'ups': return '#eab308'; // yellow
            case 'ups-battery': return '#84cc16'; // lime
            case 'ats': return '#0ea5e9'; // sky
            case 'nas': return '#6366f1'; // indigo
            default: return '#3b82f6';
        }
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'UP': return '#10b981';
            case 'DOWN': return '#f43f5e';
            case 'WARNING': return '#f59e0b';
            default: return '#64748b';
        }
    };

    let devColor = getDeviceColor(device.type);

    // Identifikasi Switch CCTV (biasanya ada kata 'cctv' atau 'poe' di namanya)
    const isCctvSwitch = device.type === 'switch' && (devName.toLowerCase().includes('cctv') || devName.toLowerCase().includes('poe'));
    if (isCctvSwitch) {
        devColor = '#8b5cf6'; // Warna ungu menyamakan dengan warna perangkat Camera
    }

    const badgeColor = getStatusBadgeColor(liveStatus);
    const isSelected = selectedIds?.includes(device.id);
    const isDown = liveStatus === 'DOWN';

    return (
        <Group
            id={device.id}
            x={device.x}
            y={device.y}
            draggable={tool === 'select'}
            dragBoundFunc={function (pos) {
                // Konversi presisi koordinat lokal kanvas saat Zoom/Pan
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
                if (onDragEnd) {
                    onDragEnd(device.id, node.x(), node.y());
                }
            }}
            onClick={(e) => {
                e.cancelBubble = true;
                if (e.evt.shiftKey) {
                    onSelect(prev => prev.includes(device.id) ? prev.filter(id => id !== device.id) : [...prev, device.id]);
                } else {
                    onSelect([device.id]);
                }
            }}
        >


            {/* Coverage Area Access Point */}
            {!device.hideIcon && device.type === 'ap' && (
                <Circle
                    radius={device.coverage || 120} // Radius default jika tidak ada properti coverage
                    fill={devColor}
                    opacity={0.08}
                    stroke={devColor}
                    strokeWidth={1}
                    dash={[5, 5]}
                />
            )}

            {/* Shape Perangkat */}
            {device.hideIcon ? null : device.type === 'camera' ? (
                <Group>
                    {/* FOV / Arah Sorotan Kamera (Ikut Berotasi) */}
                    <Group rotation={device.rotation || 0}>
                        <Path
                            data="M 12 0 L 70 -55 Q 95 0 70 55 Z"
                            fill={devColor}
                            opacity={0.15}
                        />
                    </Group>
                    {/* Body Kamera (Bulat dengan Nomor) (TETAP TEGAK) */}
                    <Circle
                        radius={12}
                        fill={isSelected ? '#f43f5e' : devColor}
                        stroke="transparent"
                        strokeWidth={0}
                        shadowBlur={isSelected ? 8 : 0}
                        shadowColor={devColor}
                    />
                    <Text
                        text={device.camNumber || (() => {
                            const match = (device.label || device.name)?.match(/\d+/g);
                            return match ? match[match.length - 1] : 'C';
                        })()}
                        fontSize={10}
                        fontFamily="monospace"
                        fontStyle="bold"
                        fill="#ffffff"
                        align="center"
                        width={24}
                        x={-12}
                        y={-4}
                    />
                </Group>
            ) : device.type === 'server' ? (
                <Rect
                    x={-14}
                    y={-10}
                    width={28}
                    height={20}
                    cornerRadius={4}
                    fill={isSelected ? '#f43f5e' : devColor}
                    stroke="transparent"
                    strokeWidth={0}
                    shadowBlur={isSelected ? 8 : 0}
                    shadowColor={devColor}
                />
            ) : device.type === 'switch' ? (
                <Group>
                    {/* Switch Body (Persegi Panjang Lebar) */}
                    <Rect
                        x={-16}
                        y={-10}
                        width={32}
                        height={20}
                        cornerRadius={3}
                        fill={isSelected ? '#f43f5e' : devColor}
                        stroke="transparent"
                        strokeWidth={0}
                        shadowBlur={isSelected ? 8 : 0}
                        shadowColor={devColor}
                    />

                    {/* Indikator Port Switch (Titik-titik putih di dalam) */}
                    <Rect x={-12} y={-4} width={4} height={4} fill="#ffffff" opacity={0.6} cornerRadius={1} />
                    <Rect x={-6} y={-4} width={4} height={4} fill="#ffffff" opacity={0.6} cornerRadius={1} />
                    <Rect x={0} y={-4} width={4} height={4} fill="#ffffff" opacity={0.6} cornerRadius={1} />
                    <Rect x={6} y={-4} width={4} height={4} fill="#ffffff" opacity={0.6} cornerRadius={1} />
                    <Rect x={-12} y={2} width={4} height={4} fill="#ffffff" opacity={0.6} cornerRadius={1} />
                    <Rect x={-6} y={2} width={4} height={4} fill="#ffffff" opacity={0.6} cornerRadius={1} />
                    <Rect x={0} y={2} width={4} height={4} fill="#ffffff" opacity={0.6} cornerRadius={1} />
                    <Rect x={6} y={2} width={4} height={4} fill="#ffffff" opacity={0.6} cornerRadius={1} />

                    {/* Jika Switch CCTV, berikan logo tambahan mungil */}
                    {isCctvSwitch && (
                        <Circle x={-16} y={-10} radius={4} fill="#fbbf24" stroke="#ffffff" strokeWidth={1} shadowBlur={isSelected ? 2 : 0} shadowColor="#000" />
                    )}
                </Group>
            ) : device.type === 'pc' ? (
                <Rect
                    x={-12}
                    y={-10}
                    width={24}
                    height={16}
                    cornerRadius={2}
                    fill={isSelected ? '#f43f5e' : devColor}
                    stroke="transparent"
                    strokeWidth={0}
                    shadowBlur={8}
                    shadowColor={devColor}
                />
            ) : device.type === 'ap' ? (
                <Group>
                    {/* AP Body */}
                    <Rect
                        x={-12}
                        y={-12}
                        width={24}
                        height={24}
                        cornerRadius={8}
                        fill={isSelected ? '#f43f5e' : devColor}
                        stroke="transparent"
                        strokeWidth={0}
                        shadowBlur={isSelected ? 8 : 0}
                        shadowColor={devColor}
                    />
                    {/* Wi-Fi Waves Icon */}
                    <Path
                        data="M -4 1 Q 0 -3 4 1 M -7 -2 Q 0 -7 7 -2 M -10 -5 Q 0 -11 10 -5"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        lineCap="round"
                        fill="transparent"
                    />
                    <Circle x={0} y={5} radius={1.5} fill="#ffffff" />
                </Group>
            ) : device.type === 'modem' ? (
                <Group x={-12} y={-12}>
                    <Rect x={2} y={14} width={20} height={8} cornerRadius={2} stroke={isSelected ? '#f43f5e' : devColor} strokeWidth={2} fill="transparent" shadowBlur={isSelected ? 8 : 0} shadowColor={devColor} />
                    <Path data="M6.01 18H6" stroke={isSelected ? '#f43f5e' : devColor} strokeWidth={2} lineCap="round" lineJoin="round" />
                    <Path data="M10.01 18H10" stroke={isSelected ? '#f43f5e' : devColor} strokeWidth={2} lineCap="round" lineJoin="round" />
                    <Path data="M15 10v4" stroke={isSelected ? '#f43f5e' : devColor} strokeWidth={2} lineCap="round" lineJoin="round" />
                    <Path data="M17.84 7.17a4 4 0 0 0-5.66 0" stroke={isSelected ? '#f43f5e' : devColor} strokeWidth={2} lineCap="round" lineJoin="round" />
                    <Path data="M20.66 4.34a8 8 0 0 0-11.31 0" stroke={isSelected ? '#f43f5e' : devColor} strokeWidth={2} lineCap="round" lineJoin="round" />
                </Group>
            ) : device.type === 'otb' ? (
                <Group x={-12} y={-12}>
                    <Path data="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" stroke={isSelected ? '#f43f5e' : devColor} strokeWidth={2} lineCap="round" lineJoin="round" shadowBlur={isSelected ? 8 : 0} shadowColor={devColor} fill="transparent" />
                    <Path data="m3.3 7 8.7 5 8.7-5" stroke={isSelected ? '#f43f5e' : devColor} strokeWidth={2} lineCap="round" lineJoin="round" />
                    <Path data="M12 22V12" stroke={isSelected ? '#f43f5e' : devColor} strokeWidth={2} lineCap="round" lineJoin="round" />
                </Group>
            ) : device.type === 'cable' ? (
                <Group x={-12} y={-12}>
                    <Rect x={16} y={16} width={6} height={6} cornerRadius={1} stroke={isSelected ? '#f43f5e' : devColor} strokeWidth={2} fill="transparent" shadowBlur={isSelected ? 8 : 0} shadowColor={devColor} />
                    <Rect x={2} y={16} width={6} height={6} cornerRadius={1} stroke={isSelected ? '#f43f5e' : devColor} strokeWidth={2} fill="transparent" />
                    <Rect x={9} y={2} width={6} height={6} cornerRadius={1} stroke={isSelected ? '#f43f5e' : devColor} strokeWidth={2} fill="transparent" />
                    <Path data="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" stroke={isSelected ? '#f43f5e' : devColor} strokeWidth={2} lineCap="round" lineJoin="round" fill="transparent" />
                    <Path data="M12 12V8" stroke={isSelected ? '#f43f5e' : devColor} strokeWidth={2} lineCap="round" lineJoin="round" fill="transparent" />
                </Group>
            ) : device.type === 'firewall' ? (
                <Group x={-12} y={-12}>
                    <Path data="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" stroke={isSelected ? '#f43f5e' : devColor} strokeWidth={2} lineCap="round" lineJoin="round" fill="transparent" shadowBlur={isSelected ? 8 : 0} shadowColor={devColor} />
                </Group>
            ) : device.type === 'ups' ? (
                <Group x={-12} y={-12}>
                    <Rect width={24} height={24} cornerRadius={4} fill={isSelected ? '#f43f5e' : devColor} shadowBlur={isSelected ? 8 : 0} shadowColor={devColor} />
                    <Path data="M13 2 3 14h9l-1 8 10-12h-9l1-8z" stroke="transparent" fill="#1e293b" scaleX={0.8} scaleY={0.8} x={3} y={1} />
                </Group>
            ) : device.type === 'ups-battery' ? (
                <Group x={-12} y={-12}>
                    <Rect width={24} height={24} cornerRadius={4} fill={isSelected ? '#f43f5e' : devColor} shadowBlur={isSelected ? 8 : 0} shadowColor={devColor} />
                    <Path data="M6 7h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2ZM22 11v2M6 11v2M10 11v2M14 11v2" stroke="#1e293b" strokeWidth={2} lineCap="round" lineJoin="round" fill="transparent" scaleX={0.7} scaleY={0.7} x={2} y={3} />
                </Group>
            ) : device.type === 'ats' ? (
                <Group x={-12} y={-12}>
                    <Rect width={24} height={24} cornerRadius={4} fill={isSelected ? '#f43f5e' : devColor} shadowBlur={isSelected ? 8 : 0} shadowColor={devColor} />
                    <Path data="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16" stroke="#1e293b" strokeWidth={2} lineCap="round" lineJoin="round" fill="transparent" scaleX={0.7} scaleY={0.7} x={2} y={3} />
                </Group>
            ) : device.type === 'nas' ? (
                <Group x={-12} y={-12}>
                    <Rect width={24} height={24} cornerRadius={4} fill={isSelected ? '#f43f5e' : devColor} shadowBlur={isSelected ? 8 : 0} shadowColor={devColor} />
                    <Rect x={4} y={4} width={16} height={4} cornerRadius={1} fill="#1e293b" />
                    <Rect x={4} y={10} width={16} height={4} cornerRadius={1} fill="#1e293b" />
                    <Rect x={4} y={16} width={16} height={4} cornerRadius={1} fill="#1e293b" />
                    <Circle x={7} y={6} radius={1} fill={devColor} />
                    <Circle x={7} y={12} radius={1} fill={devColor} />
                    <Circle x={7} y={18} radius={1} fill={devColor} />
                </Group>
            ) : (
                <Circle
                    radius={12}
                    fill={isSelected ? '#f43f5e' : devColor}
                    stroke="transparent"
                    strokeWidth={0}
                    shadowBlur={isSelected ? 8 : 0}
                    shadowColor={devColor}
                />
            )}

            {/* Badge Indicator Status UP / DOWN / WARNING (Kanan Atas) */}
            {!device.hideIcon && (
                <Circle
                    x={10}
                    y={-10}
                    radius={5}
                    fill={badgeColor}
                    stroke="#0f172a"
                    strokeWidth={1.5}
                    shadowBlur={isSelected ? 5 : 0}
                    shadowColor={badgeColor}
                />
            )}

            {/* Label Nama */}
            <Text
                text={device.label}
                fontSize={8}
                fontFamily="monospace"
                fontStyle="bold"
                fill="#ffffff"
                align="center"
                width={90}
                x={-45}
                y={16}
                rotation={device.labelRotation || 0}
            />
        </Group>
    );
}