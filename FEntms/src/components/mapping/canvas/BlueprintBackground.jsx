import React, { useState, useEffect } from 'react';
import { Image as KonvaImage } from 'react-konva';

export default function BlueprintBackground({ width, height }) {
    const [image, setImage] = useState(null);

    useEffect(() => {
        const img = new window.Image();
        img.src = '/assets/hero.png';
        img.onload = () => setImage(img);
    }, []);

    return <KonvaImage name="blueprint-bg" image={image} width={width} height={height} opacity={0.35} />;
}