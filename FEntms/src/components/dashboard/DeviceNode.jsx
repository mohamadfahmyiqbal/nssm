import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Network, Server, HardDrive, Router, Video } from 'lucide-react';

const iconMap = {
    switch: Network,
    router: Router,
    server: Server,
    nvr: HardDrive,
    camera: Video,
};

export default function DeviceNode({ data }) {
    const Icon = iconMap[data.type] || Network;
    const isCCTV = data.networkType === 'CCTV';

    const statusStyles = {
        UP: {
            border: 'border-emerald-500/80',
            glow: 'shadow-[0_0_15px_rgba(16,185,129,0.45)]',
            text: 'text-[#10B981]',
            dot: 'bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.8)]',
        },
        WARNING: {
            border: 'border-amber-500/80',
            glow: 'shadow-[0_0_15px_rgba(245,158,11,0.45)] animate-pulse',
            text: 'text-[#F59E0B]',
            dot: 'bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.8)]',
        },
        DOWN: {
            border: 'border-rose-500/80',
            glow: 'shadow-[0_0_18px_rgba(239,68,68,0.55)] animate-pulse',
            text: 'text-[#EF4444]',
            dot: 'bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.8)]',
        },
        OFFLINE: {
            border: 'border-slate-600/80',
            glow: 'shadow-none',
            text: 'text-[#6B7280]',
            dot: 'bg-[#6B7280]',
        }
    };

    const style = statusStyles[data.status?.toUpperCase()] || statusStyles.UP;

    return (
        <div
            className={`relative px-4 py-3.5 bg-slate-900/90 backdrop-blur-md rounded-xl border-2 ${style.border} ${style.glow} min-w-[175px] flex flex-col items-center justify-center transition-all duration-300 hover:scale-105`}
        >
            <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 !h-2" />

            {/* Network Type & VLAN Badge */}
            <span
                className={`absolute -top-2.5 px-2 py-0.5 rounded-full text-[9px] font-black font-mono border ${isCCTV
                        ? 'bg-purple-950 text-purple-300 border-purple-500/50'
                        : 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                    }`}
            >
                {isCCTV ? 'CCTV' : 'LAN'} • VLAN {data.vlan || '1'}
            </span>

            {/* Device Icon */}
            <div className={`p-2 rounded-lg bg-slate-800/80 my-1 ${style.text}`}>
                <Icon className="w-5 h-5" />
            </div>

            {/* Device Label */}
            <div className="font-bold text-xs text-slate-100 tracking-wide text-center">
                {data.label}
            </div>

            {/* CPU & Status Indicator */}
            <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                <span>[ CPU: {data.cpu || 'N/A'}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                <span>]</span>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-2 !h-2" />
        </div>
    );
}