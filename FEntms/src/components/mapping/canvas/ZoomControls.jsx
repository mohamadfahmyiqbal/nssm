import React from 'react';

export default function ZoomControls({ stageScale, onZoomIn, onZoomOut, onResetZoom }) {
    return (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-slate-950/90 border border-slate-800 p-1.5 rounded-xl shadow-2xl backdrop-blur-md font-mono text-[11px]">
            <button
                onClick={onZoomOut}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold"
                title="Zoom Out"
            >
                -
            </button>
            <span className="px-2 text-purple-400 font-bold min-w-[45px] text-center">
                {Math.round(stageScale * 100)}%
            </span>
            <button
                onClick={onZoomIn}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold"
                title="Zoom In"
            >
                +
            </button>
            <button
                onClick={onResetZoom}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold ml-1"
                title="Reset Zoom & Position"
            >
                Reset
            </button>
        </div>
    );
}