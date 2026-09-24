export const getPriorityBadge = (p) => {
    switch ((p || '').toUpperCase()) {
        case 'CRITICAL':
            return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
        case 'HIGH':
            return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
        case 'MEDIUM':
            return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
        default:
            return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
};

export const getStatusBadge = (s) => {
    switch ((s || '').toUpperCase()) {
        case 'RESOLVED':
        case 'CLOSED':
            return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        case 'IN_PROGRESS':
            return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
        case 'ASSIGNED':
            return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
        default:
            return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
};

export const formatDisplayDate = (dStr) => {
    if (!dStr) return '-';
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? dStr : d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export const calculateTaskDurationMinutes = (task) => {
    if (!task) return 5;
    if (task.type === 'INCIDENT_ANOMALY') return 120;
    return task.cycleTimeMinutes != null ? Number(task.cycleTimeMinutes) : 5;
};

export const calculateGroupDurationMinutes = (group) => {
    if (!group || !group.tasks || group.tasks.length === 0) return 5;
    if (group.type === 'INCIDENT_ANOMALY') return 120;
    return group.tasks.reduce((sum, t) => sum + (t.cycleTimeMinutes != null ? Number(t.cycleTimeMinutes) : 5), 0);
};
