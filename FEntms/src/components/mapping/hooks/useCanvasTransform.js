import { useState, useEffect } from 'react';

export default function useCanvasTransform(stageRef, tool, GRID_SIZE) {
    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isMiddleDragging, setIsMiddleDragging] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' && !isSpacePressed) {
                setIsSpacePressed(true);
            }
        };
        const handleKeyUp = (e) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isSpacePressed]);

    const getRelativePointerPosition = (stage) => {
        const transform = stage.getAbsoluteTransform().copy().invert();
        return transform.point(stage.getPointerPosition());
    };

    const snapToGrid = (pos) => ({
        x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
    });

    const handleWheel = (e) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;

        const scaleBy = 1.1;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
        newScale = Math.max(0.3, Math.min(newScale, 4));

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };

        setStageScale(newScale);
        setStagePos(newPos);
    };

    const handleZoomIn = () => setStageScale((prev) => Math.min(prev * 1.2, 4));
    const handleZoomOut = () => setStageScale((prev) => Math.max(prev / 1.2, 0.3));
    const handleResetZoom = () => {
        setStageScale(1);
        setStagePos({ x: 0, y: 0 });
    };

    const isPanningActive = isSpacePressed || tool === 'pan' || isMiddleDragging;

    return {
        stageScale,
        stagePos,
        setStagePos,
        isSpacePressed,
        isMiddleDragging,
        setIsMiddleDragging,
        isPanningActive,
        handleWheel,
        handleZoomIn,
        handleZoomOut,
        handleResetZoom,
        getRelativePointerPosition,
        snapToGrid
    };
}