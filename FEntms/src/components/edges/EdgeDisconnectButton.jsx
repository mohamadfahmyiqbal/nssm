import React from 'react';

export default function EdgeDisconnectButton({ x, y, onDisconnect }) {
    return (
        <div
            style={{
                position: 'absolute',
                transform: `translate(-50%, -100%) translate(${x}px,${y - 8}px)`,
                pointerEvents: 'all',
                zIndex: 1000
            }}
            className="nodrag nopan select-none group/disconnect"
        >
            <button
                type="button"
                onClick={onDisconnect}
                title="Putuskan Koneksi"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/95 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.6)] hover:scale-110 transition-all duration-150 cursor-pointer text-[10px] font-semibold tracking-wider"
            >
                <svg className="w-3.5 h-3.5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="pr-0.5">Putus</span>
            </button>
        </div>
    );
}
