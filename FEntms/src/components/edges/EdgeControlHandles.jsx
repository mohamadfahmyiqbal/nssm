import React, { useRef, useState } from 'react';

// Komponen Handle Titik Belok Kustom (Cyan)
export function ControlPointHandle({ pointX, pointY, zoom = 1, onDragLive, onDragEnd, onDoubleClick }) {
    const dragDataRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    const handlePointerDown = (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();

        const startClientX = e.clientX;
        const startClientY = e.clientY;
        const startPointX = pointX;
        const startPointY = pointY;
        const currentZoom = zoom || 1;

        dragDataRef.current = {
            startX: startClientX,
            startY: startClientY,
            origX: startPointX,
            origY: startPointY,
            currentX: startPointX,
            currentY: startPointY
        };

        const handlePointerMove = (moveEvent) => {
            if (!dragDataRef.current) return;
            moveEvent.stopPropagation();
            moveEvent.preventDefault();

            const deltaX = (moveEvent.clientX - dragDataRef.current.startX) / currentZoom;
            const deltaY = (moveEvent.clientY - dragDataRef.current.startY) / currentZoom;

            const nextX = dragDataRef.current.origX + deltaX;
            const nextY = dragDataRef.current.origY + deltaY;

            dragDataRef.current.currentX = nextX;
            dragDataRef.current.currentY = nextY;

            if (onDragLive) onDragLive(nextX, nextY);
        };

        const handlePointerUp = (upEvent) => {
            upEvent.stopPropagation();
            upEvent.preventDefault();

            window.removeEventListener('pointermove', handlePointerMove, true);
            window.removeEventListener('pointerup', handlePointerUp, true);
            window.removeEventListener('pointercancel', handlePointerUp, true);

            if (dragDataRef.current) {
                const finalX = dragDataRef.current.currentX;
                const finalY = dragDataRef.current.currentY;
                dragDataRef.current = null;
                if (onDragEnd) onDragEnd(finalX, finalY);
            }
        };

        window.addEventListener('pointermove', handlePointerMove, { capture: true, passive: false });
        window.addEventListener('pointerup', handlePointerUp, { capture: true, passive: false });
        window.addEventListener('pointercancel', handlePointerUp, { capture: true, passive: false });
    };

    return (
        <div
            style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${pointX}px,${pointY}px)`,
                pointerEvents: 'all',
                cursor: 'grab',
                zIndex: 50,
                touchAction: 'none'
            }}
            className="nodrag nopan select-none"
            onPointerDown={handlePointerDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (onDoubleClick) onDoubleClick();
            }}
            title="Tarik untuk geser posisi titik, Double-click untuk hapus titik"
        >
            <div className={`rounded-full border-2 border-white bg-cyan-400 shadow-[0_0_12px_#06b6d4] transition-all duration-100 flex items-center justify-center ${
                isHovered ? 'w-5 h-5 scale-125' : 'w-4 h-4 scale-100'
            }`} />
        </div>
    );
}

// Komponen Handle Titik Tengah Segmen untuk Menambah Titik Belok Baru (Hijau)
export function MidpointHandle({ pointX, pointY, zoom = 1, onDragStart, onDragLive, onDragEnd }) {
    const dragDataRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    const handlePointerDown = (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();

        const startClientX = e.clientX;
        const startClientY = e.clientY;
        const startPointX = pointX;
        const startPointY = pointY;
        const currentZoom = zoom || 1;

        let insertedIdx = 0;
        if (onDragStart) {
            insertedIdx = onDragStart({ x: startPointX, y: startPointY });
        }

        dragDataRef.current = {
            startX: startClientX,
            startY: startClientY,
            origX: startPointX,
            origY: startPointY,
            currentX: startPointX,
            currentY: startPointY,
            insertedIdx
        };

        const handlePointerMove = (moveEvent) => {
            if (!dragDataRef.current) return;
            moveEvent.stopPropagation();
            moveEvent.preventDefault();

            const deltaX = (moveEvent.clientX - dragDataRef.current.startX) / currentZoom;
            const deltaY = (moveEvent.clientY - dragDataRef.current.startY) / currentZoom;

            const nextX = dragDataRef.current.origX + deltaX;
            const nextY = dragDataRef.current.origY + deltaY;

            dragDataRef.current.currentX = nextX;
            dragDataRef.current.currentY = nextY;

            if (onDragLive) {
                onDragLive(dragDataRef.current.insertedIdx, nextX, nextY);
            }
        };

        const handlePointerUp = (upEvent) => {
            upEvent.stopPropagation();
            upEvent.preventDefault();

            window.removeEventListener('pointermove', handlePointerMove, true);
            window.removeEventListener('pointerup', handlePointerUp, true);
            window.removeEventListener('pointercancel', handlePointerUp, true);

            if (dragDataRef.current) {
                const finalX = dragDataRef.current.currentX;
                const finalY = dragDataRef.current.currentY;
                const idx = dragDataRef.current.insertedIdx;
                dragDataRef.current = null;
                if (onDragEnd) {
                    onDragEnd(idx, finalX, finalY);
                }
            }
        };

        window.addEventListener('pointermove', handlePointerMove, { capture: true, passive: false });
        window.addEventListener('pointerup', handlePointerUp, { capture: true, passive: false });
        window.addEventListener('pointercancel', handlePointerUp, { capture: true, passive: false });
    };

    return (
        <div
            style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${pointX}px,${pointY}px)`,
                pointerEvents: 'all',
                cursor: 'pointer',
                zIndex: 40,
                touchAction: 'none'
            }}
            className="nodrag nopan select-none opacity-80 hover:opacity-100"
            onPointerDown={handlePointerDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => e.stopPropagation()}
            title="Klik & geser untuk menambah belokan baru di segmen ini"
        >
            <div className={`rounded-full border-2 border-white bg-emerald-400 shadow-[0_0_10px_#10b981] transition-all duration-100 flex items-center justify-center ${
                isHovered ? 'w-4 h-4 scale-125' : 'w-3 h-3 scale-100'
            }`} />
        </div>
    );
}
