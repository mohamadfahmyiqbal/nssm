import React, { useMemo } from 'react';
import { Layer, Rect } from 'react-konva';

export default function GridLayer({ dimensions }) {
    // Buat pattern dot grid sekali menggunakan in-memory canvas
    const fillPatternImage = useMemo(() => {
        const canvas = document.createElement('canvas');
        const step = 20; // Visual dot grid tetap di 20px agar rendering 60 FPS super ringan
        canvas.width = step;
        canvas.height = step;

        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(step, 0);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, step);
        ctx.stroke();

        return canvas;
    }, []);

    const maxW = Math.max(dimensions.width * 20, 40000);
    const maxH = Math.max(dimensions.height * 20, 40000);

    return (
        <Layer listening={false}>
            <Rect
                x={-maxW / 2}
                y={-maxH / 2}
                width={maxW}
                height={maxH}
                fillPriority="pattern"
                fillPatternImage={fillPatternImage}
                fillPatternRepeat="repeat"
                listening={false}
            />
        </Layer>
    );
}