import React from 'react';
import {
    Monitor,
    Printer,
    Wifi,
    Lock,
    Camera,
    Fingerprint,
    HardDrive,
    Server,
    Tablet,
    ShieldCheck,
    BatteryCharging,
    Zap
} from 'lucide-react';

export const getEndpointStyle = (subType) => {
    switch (subType) {
        case 'ups':
            return {
                icon: <BatteryCharging className="w-4 h-4 text-emerald-400" />,
                border: 'border-emerald-500/40 group-hover:border-emerald-400/80',
                bg: 'from-emerald-950/40 via-slate-900/90 to-slate-950/90',
                iconBg: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
            };
        case 'ats':
            return {
                icon: <Zap className="w-4 h-4 text-amber-400" />,
                border: 'border-amber-500/40 group-hover:border-amber-400/80',
                bg: 'from-amber-950/40 via-slate-900/90 to-slate-950/90',
                iconBg: 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
            };
        case 'firewall':
            return {
                icon: <ShieldCheck className="w-4 h-4 text-orange-400" />,
                border: 'border-orange-500/40 group-hover:border-orange-400/80',
                bg: 'from-orange-950/40 to-slate-950/80',
                iconBg: 'bg-orange-500/10 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.2)]'
            };
        case 'gathering':
            return {
                icon: (
                    <div className="relative flex items-center justify-center">
                        <Tablet className="w-4 h-4 text-teal-400" />
                        <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping opacity-75"></span>
                    </div>
                ),
                border: 'border-teal-500/40 group-hover:border-teal-400/80',
                bg: 'from-teal-950/40 to-slate-950/80',
                iconBg: 'bg-teal-500/10 border-teal-500/20 shadow-[0_0_10px_rgba(20,184,166,0.25)]'
            };
        case 'camera':
            return {
                icon: <Camera className="w-4 h-4 text-purple-400" />,
                border: 'border-purple-500/40 group-hover:border-purple-400/80',
                bg: 'from-purple-950/40 to-slate-950/80',
                iconBg: 'bg-purple-500/10 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
            };
        case 'nvr':
            return {
                icon: <HardDrive className="w-4 h-4 text-indigo-400" />,
                border: 'border-indigo-500/40 group-hover:border-indigo-400/80',
                bg: 'from-indigo-950/40 to-slate-950/80',
                iconBg: 'bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
            };
        case 'server':
            return {
                icon: <Server className="w-4 h-4 text-indigo-400" />,
                border: 'border-indigo-500/40 group-hover:border-indigo-400/80',
                bg: 'from-indigo-950/40 to-slate-950/80',
                iconBg: 'bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
            };
        case 'door':
            return {
                icon: <Lock className="w-4 h-4 text-amber-400" />,
                border: 'border-amber-500/40 group-hover:border-amber-400/80',
                bg: 'from-amber-950/40 to-slate-950/80',
                iconBg: 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
            };
        case 'biometric':
            return {
                icon: <Fingerprint className="w-4 h-4 text-orange-400" />,
                border: 'border-orange-500/40 group-hover:border-orange-400/80',
                bg: 'from-orange-950/40 to-slate-950/80',
                iconBg: 'bg-orange-500/10 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.2)]'
            };
        case 'ap':
            return {
                icon: <Wifi className="w-4 h-4 text-emerald-400" />,
                border: 'border-emerald-500/40 group-hover:border-emerald-400/80',
                bg: 'from-emerald-950/40 to-slate-950/80',
                iconBg: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
            };
        case 'printer':
            return {
                icon: <Printer className="w-4 h-4 text-cyan-400" />,
                border: 'border-cyan-500/40 group-hover:border-cyan-400/80',
                bg: 'from-cyan-950/40 to-slate-950/80',
                iconBg: 'bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
            };
        case 'pc':
        default:
            return {
                icon: <Monitor className="w-4 h-4 text-blue-400" />,
                border: 'border-blue-500/40 group-hover:border-blue-400/80',
                bg: 'from-blue-950/40 to-slate-950/80',
                iconBg: 'bg-blue-500/10 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
            };
    }
};
