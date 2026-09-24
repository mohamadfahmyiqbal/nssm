import { useMemo } from 'react';

export function useWorkOrderFilters({
    workOrders,
    schedules,
    incidents,
    scheduleBreaks,
    searchQuery,
    typeFilter,
    statusFilter,
    priorityFilter,
    technicianFilter,
    dateMode,
    selectedDate,
    sourceType
}) {
    // Set of Reference IDs yang sudah memiliki Work Order (menghitung frekuensi penugasan)
    const assignedReferenceMap = useMemo(() => {
        const map = new Map();
        workOrders.forEach(w => {
            if (w.referenceId) {
                const ids = String(w.referenceId).split(',');
                ids.forEach(id => {
                    const cleanId = id.trim();
                    if (cleanId) {
                        const count = map.get(cleanId) || 0;
                        map.set(cleanId, count + 1);
                    }
                });
            }
        });
        return map;
    }, [workOrders]);

    // Format Combined Source Tasks (dari Jadwal ITAM & Insiden)
    const sourceTasks = useMemo(() => {
        const list = [];

        // 1. Dari Jadwal Preventive Maintenance
        if (sourceType === 'ALL' || sourceType === 'PREVENTIVE_MAINTENANCE') {
            schedules.forEach((item) => {
                const std = item.standardMaintenance || {};
                const refId = `PM_${item.check_id}_${item.tanggal}`;
                const assignedCount = assignedReferenceMap.get(refId) || 0;
                const isAssigned = assignedCount > 0;

                list.push({
                    uniqueId: refId,
                    type: 'PREVENTIVE_MAINTENANCE',
                    title: `[PM] ${std.subKategori || 'Perangkat'} - ${std.namaPerangkat || std.tipePerangkat || ''}: ${item.pengecekan || 'Checklist'}`,
                    category: std.kategori || 'Hardware',
                    subKategori: std.subKategori || 'Maintenance',
                    perangkat: std.namaPerangkat || std.tipePerangkat || '-',
                    checkItem: item.pengecekan || '-',
                    periodik: item.periodik || 'BULANAN',
                    bagian: item.bagian || 'Hardware',
                    cycleTimeMinutes: item.cycle_time_minutes != null ? Number(item.cycle_time_minutes) : 5,
                    targetDate: item.tanggal,
                    suggestedPriority: item.status === 'PLAN' ? 'MEDIUM' : 'LOW',
                    sourceStatus: item.status || 'PLAN',
                    isAssigned,
                    assignedCount,
                    raw: item
                });
            });
        }

        // 2. Dari Incident & Anomaly Reports
        if (sourceType === 'ALL' || sourceType === 'INCIDENT_ANOMALY') {
            incidents.forEach((inc) => {
                const refId = `INC_${inc.id}`;
                const assignedCount = assignedReferenceMap.get(refId) || 0;
                const isAssigned = assignedCount > 0;

                list.push({
                    uniqueId: refId,
                    type: 'INCIDENT_ANOMALY',
                    title: `[INC] ${inc.reportNumber}: ${inc.primaryHostname || 'Device'} (${inc.primaryIp || '-'}) - ${inc.symptom || 'Gangguan'}`,
                    category: 'Incident / Trouble',
                    subKategori: inc.location || 'Network',
                    perangkat: inc.primaryHostname || inc.primaryIp || '-',
                    checkItem: inc.symptom || inc.rootCause || 'Remediasi Gangguan',
                    periodik: 'ON-DEMAND',
                    bagian: inc.location || 'Network',
                    cycleTimeMinutes: 120,
                    targetDate: inc.reportDate || new Date().toISOString().slice(0, 10),
                    suggestedPriority: inc.status === 'OPEN' ? 'CRITICAL' : 'HIGH',
                    sourceStatus: inc.status || 'OPEN',
                    isAssigned,
                    assignedCount,
                    raw: inc
                });
            });
        }

        return list;
    }, [schedules, incidents, sourceType, assignedReferenceMap]);

    // Filter Source Tasks (Harian / All Dates)
    const filteredSourceTasks = useMemo(() => {
        return sourceTasks.filter(task => {
            const matchesSearch = 
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.subKategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.perangkat.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.checkItem.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesType = typeFilter === 'ALL' || task.type === typeFilter;
            const matchesDate = dateMode === 'ALL_DATES' || 
                (task.targetDate && task.targetDate.startsWith(selectedDate));

            return matchesSearch && matchesType && matchesDate;
        });
    }, [sourceTasks, searchQuery, typeFilter, dateMode, selectedDate]);

    // Filter Work Orders (Harian / All Dates)
    const filteredWorkOrders = useMemo(() => {
        return workOrders.filter(wo => {
            const matchesSearch = 
                (wo.woNumber && wo.woNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (wo.title && wo.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (wo.assignedTechnicianName && wo.assignedTechnicianName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (wo.description && wo.description.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesType = typeFilter === 'ALL' || wo.woType === typeFilter;
            const matchesStatus = statusFilter === 'ALL' || wo.status === statusFilter;
            const matchesPriority = priorityFilter === 'ALL' || wo.priority === priorityFilter;
            const matchesTech = technicianFilter === 'ALL' || wo.assignedTechnicianNik === technicianFilter;
            const matchesDate = dateMode === 'ALL_DATES' || 
                (wo.targetDate && wo.targetDate.startsWith(selectedDate));

            return matchesSearch && matchesType && matchesStatus && matchesPriority && matchesTech && matchesDate;
        });
    }, [workOrders, searchQuery, typeFilter, statusFilter, priorityFilter, technicianFilter, dateMode, selectedDate]);

    // Filter Schedule Breaks
    const filteredScheduleBreaks = useMemo(() => {
        return scheduleBreaks.filter(b => {
            const matchesTech = technicianFilter === 'ALL' || 
                b.technicianNik === 'ALL' || 
                b.technicianNik === technicianFilter;
            return matchesTech;
        });
    }, [scheduleBreaks, technicianFilter]);

    return {
        sourceTasks,
        filteredSourceTasks,
        filteredWorkOrders,
        filteredScheduleBreaks
    };
}
