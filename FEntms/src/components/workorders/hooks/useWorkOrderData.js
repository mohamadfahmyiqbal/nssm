import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    getWorkOrdersFromDB,
    getWorkOrderSummaryFromDB,
    saveWorkOrderToDB,
    updateWorkOrderInDB,
    deleteWorkOrderFromDB,
    getScheduleBreaksFromDB,
    saveScheduleBreakToDB,
    updateScheduleBreakInDB,
    deleteScheduleBreakFromDB,
    getUsersFromDB,
    getMaintenanceSchedulesFromDB,
    getIncidentReportsFromDB
} from '../../../services/api';
import { showToast, showConfirm } from '../../../utils/swal';

export function useWorkOrderData() {
    const [workOrders, setWorkOrders] = useState([]);
    const [summary, setSummary] = useState({
        total: 0,
        open: 0,
        assigned: 0,
        inProgress: 0,
        resolved: 0,
        preventiveCount: 0,
        incidentCount: 0
    });
    const [technicianWorkloads, setTechnicianWorkloads] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [scheduleBreaks, setScheduleBreaks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [woRes, sumRes, usersRes, schedRes, incRes, breakRes] = await Promise.all([
                getWorkOrdersFromDB(),
                getWorkOrderSummaryFromDB(),
                getUsersFromDB(),
                getMaintenanceSchedulesFromDB({ limit: 500 }),
                getIncidentReportsFromDB(),
                getScheduleBreaksFromDB()
            ]);

            if (woRes.success) setWorkOrders(woRes.data || []);
            if (sumRes.success) {
                setSummary(sumRes.summary || {});
                setTechnicianWorkloads(sumRes.technicianWorkloads || []);
            }
            if (usersRes.success) setTechnicians(usersRes.data || []);
            if (schedRes.success) setSchedules(schedRes.data || []);
            if (incRes.success) setIncidents(incRes.data || []);
            if (breakRes.success) setScheduleBreaks(breakRes.data || []);
        } catch (error) {
            console.error('Failed to load Work Order data:', error);
            showToast('error', 'Gagal memuat data Work Order & Man Power.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Realtime Technician Workloads calculation (PIC Utama & Helper / Anggota Tim)
    const calculatedTechnicianWorkloads = useMemo(() => {
        return technicians.map(t => {
            const techNik = String(t.nik || t.NIK || '').trim();
            const techName = String(t.nama || t.NAMA || '').trim().toLowerCase();

            const assignedWos = workOrders.filter(w => {
                const wNik = String(w.assignedTechnicianNik || '').trim();
                const wName = String(w.assignedTechnicianName || '').trim().toLowerCase();
                const isPic = (techNik && wNik === techNik) || (techName && wName === techName);

                let isHelper = false;
                let membersList = [];
                if (w.teamMembersJson) {
                    try { membersList = JSON.parse(w.teamMembersJson); } catch (e) {}
                } else if (Array.isArray(w.teamMembers)) {
                    membersList = w.teamMembers;
                }
                if (Array.isArray(membersList)) {
                    isHelper = membersList.some(m => {
                        const mNik = String(m.nik || m.NIK || '').trim();
                        const mName = String(m.name || m.nama || m.NAMA || '').trim().toLowerCase();
                        return (techNik && mNik === techNik) || (techName && mName === techName);
                    });
                }

                const isMatched = isPic || isHelper;
                const isNotClosed = w.status !== 'CLOSED' && w.status !== 'RESOLVED';
                return isMatched && isNotClosed;
            });

            const totalHours = assignedWos.reduce((sum, w) => sum + (parseFloat(w.estimatedHours) || 1), 0);
            return {
                nik: techNik,
                name: t.nama || t.NAMA,
                dept: t.dept || t.DEPT,
                activeTaskCount: assignedWos.length,
                totalEstimatedHours: Number(totalHours.toFixed(1))
            };
        });
    }, [technicians, workOrders]);

    // Work Order CRUD
    const handleSaveWorkOrder = async (formData, editingWo) => {
        if (!formData.title?.trim()) {
            showToast('warning', 'Judul Work Order wajib diisi.');
            return false;
        }

        try {
            if (editingWo) {
                const res = await updateWorkOrderInDB(editingWo.id, formData);
                if (res.success) {
                    showToast('success', 'Work Order berhasil diperbarui.');
                    fetchData();
                    return true;
                }
            } else {
                const res = await saveWorkOrderToDB(formData);
                if (res.success) {
                    showToast('success', 'Work Order berhasil dibuat & Man Power telah dialokasikan.');
                    fetchData();
                    return true;
                }
            }
        } catch (error) {
            console.error('Submit Work Order Error:', error);
            showToast('error', 'Gagal menyimpan data Work Order.');
        }
        return false;
    };

    const handleDeleteWorkOrder = async (id, woNumber) => {
        const confirmed = await showConfirm(
            'Hapus Work Order?',
            `Apakah Anda yakin ingin menghapus Work Order ${woNumber}?`,
            'Ya, Hapus'
        );
        if (confirmed) {
            try {
                const res = await deleteWorkOrderFromDB(id);
                if (res.success) {
                    showToast('success', 'Work Order telah dihapus.');
                    fetchData();
                    return true;
                }
            } catch (error) {
                showToast('error', 'Gagal menghapus Work Order.');
            }
        }
        return false;
    };

    const handleQuickStatusChange = async (id, newStatus) => {
        try {
            const res = await updateWorkOrderInDB(id, { status: newStatus });
            if (res.success) {
                showToast('success', `Status WO diubah ke ${newStatus}`);
                fetchData();
                return true;
            }
        } catch (error) {
            showToast('error', 'Gagal memperbarui status WO.');
        }
        return false;
    };

    // Schedule Breaks CRUD
    const handleSaveBreak = async (breakFormData, editingBreak) => {
        try {
            if (editingBreak) {
                const res = await updateScheduleBreakInDB(editingBreak.id, breakFormData);
                if (res.success) {
                    showToast('success', 'Waktu istirahat berhasil diperbarui.');
                    fetchData();
                    return true;
                }
            } else {
                const res = await saveScheduleBreakToDB(breakFormData);
                if (res.success) {
                    showToast('success', 'Waktu istirahat berhasil ditetapkan.');
                    fetchData();
                    return true;
                }
            }
        } catch (error) {
            console.error('Break submit error:', error);
            showToast('error', 'Gagal menyimpan waktu istirahat.');
        }
        return false;
    };

    const handleDeleteBreak = async (id) => {
        const confirmed = await showConfirm(
            'Hapus Waktu Istirahat?',
            'Apakah Anda yakin ingin menghapus jadwal istirahat ini?',
            'Ya, Hapus'
        );
        if (confirmed) {
            try {
                const res = await deleteScheduleBreakFromDB(id);
                if (res.success) {
                    showToast('success', 'Jadwal istirahat telah dihapus.');
                    fetchData();
                    return true;
                }
            } catch (error) {
                showToast('error', 'Gagal menghapus jadwal istirahat.');
            }
        }
        return false;
    };

    return {
        workOrders,
        summary,
        technicianWorkloads,
        technicians,
        schedules,
        incidents,
        scheduleBreaks,
        isLoading,
        calculatedTechnicianWorkloads,
        fetchData,
        handleSaveWorkOrder,
        handleDeleteWorkOrder,
        handleQuickStatusChange,
        handleSaveBreak,
        handleDeleteBreak
    };
}
