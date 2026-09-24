/**
 * Enterprise Operational Status Design System
 * Normal/Up: #10B981 (Emerald 500)
 * Warning/Degraded: #F59E0B (Amber 500)
 * Critical/Down: #EF4444 (Rose/Red 500)
 * Unmanaged/Offline: #6B7280 (Gray/Slate 500)
 */

export const STATUS_COLORS = {
    UP: '#10B981',
    WARNING: '#F59E0B',
    DOWN: '#EF4444',
    OFFLINE: '#6B7280',
    UNKNOWN: '#6B7280',
};

export const STATUS_THEMES = {
    up: {
        key: 'up',
        label: 'NORMAL / UP',
        border: 'border-emerald-500/50 group-hover:border-emerald-400/80',
        bg: 'from-emerald-950/40 via-slate-900/90 to-slate-950/95',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.12)]',
        text: 'text-emerald-400',
        pulse: false,
    },
    warning: {
        key: 'warning',
        label: 'WARNING / DEGRADED',
        border: 'border-amber-500/60 group-hover:border-amber-400/90',
        bg: 'from-amber-950/50 via-slate-900/90 to-slate-950/95',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        iconBg: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
        dot: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.7)] animate-pulse',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
        text: 'text-amber-400',
        pulse: true,
    },
    down: {
        key: 'down',
        label: 'CRITICAL / DOWN',
        border: 'border-rose-500/60 group-hover:border-rose-400/90',
        bg: 'from-rose-950/60 via-slate-900/90 to-slate-950/95',
        badge: 'bg-rose-500/15 text-rose-400 border-rose-500/40 font-bold',
        iconBg: 'bg-rose-500/20 border-rose-500/30 text-rose-400',
        dot: 'bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-ping',
        glow: 'shadow-[0_0_25px_rgba(239,68,68,0.25)]',
        text: 'text-rose-400',
        pulse: true,
    },
    offline: {
        key: 'offline',
        label: 'UNMANAGED / OFFLINE',
        border: 'border-slate-600/50 group-hover:border-slate-500/80',
        bg: 'from-slate-900/80 to-slate-950/90',
        badge: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
        iconBg: 'bg-slate-800/60 border-slate-700/50 text-slate-400',
        dot: 'bg-slate-500 shadow-none',
        glow: 'shadow-none',
        text: 'text-slate-400',
        pulse: false,
    }
};

/**
 * Normalizer status string ke theme standard
 */
export const getStatusTheme = (status) => {
    if (!status) return STATUS_THEMES.up;
    const s = String(status).toLowerCase().trim();
    if (s === 'down' || s === 'critical' || s === 'offline_error') return STATUS_THEMES.down;
    if (s === 'warning' || s === 'degraded' || s === 'high_cpu') return STATUS_THEMES.warning;
    if (s === 'offline' || s === 'unmanaged' || s === 'unknown' || s === 'disabled') return STATUS_THEMES.offline;
    return STATUS_THEMES.up;
};
