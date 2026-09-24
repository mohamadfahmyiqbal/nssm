import { useState, useEffect, useCallback } from 'react';
import { 
    getIncidentReportsFromDB, 
    updateIncidentReportStatusInDB, 
    deleteIncidentReportFromDB 
} from '../../../services/api';
import { showToast, showConfirm } from '../../../utils/swal';

export const useIncidentArchive = ({ onArchiveUpdated }) => {
    const [archivedReports, setArchivedReports] = useState([]);
    const [archiveFilterStatus, setArchiveFilterStatus] = useState('ALL');
    const [isLoadingArchive, setIsLoadingArchive] = useState(false);

    const fetchArchivedReports = useCallback(async () => {
        setIsLoadingArchive(true);
        try {
            const res = await getIncidentReportsFromDB(archiveFilterStatus);
            if (res?.success) {
                setArchivedReports(res.data || []);
            }
        } catch (err) {
            console.error('Failed fetching archived reports:', err);
        } finally {
            setIsLoadingArchive(false);
        }
    }, [archiveFilterStatus]);

    const handleUpdateStatus = async (id, currentStatus) => {
        const nextStatus = currentStatus === 'OPEN' || currentStatus === 'IN_PROGRESS' ? 'RESOLVED' : 'CLOSED';
        const confirmed = await showConfirm(
            'Ubah Status Insiden?',
            `Ubah status insiden ini menjadi ${nextStatus} dan kirim update ke MS Teams?`
        );
        if (!confirmed) return;

        try {
            const res = await updateIncidentReportStatusInDB(id, {
                status: nextStatus,
                endTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                sendToTeams: true
            });
            if (res.success) {
                showToast('success', `Status berhasil diubah menjadi ${nextStatus}`);
                fetchArchivedReports();
                if (onArchiveUpdated) onArchiveUpdated();
            }
        } catch (e) {
            showToast('error', 'Gagal memperbarui status laporan.');
        }
    };

    const handleDeleteArchive = async (id, reportNum) => {
        const confirmed = await showConfirm(
            'Hapus Arsip Laporan?',
            `Apakah Anda yakin ingin menghapus arsip berita acara ${reportNum}?`
        );
        if (!confirmed) return;

        try {
            const res = await deleteIncidentReportFromDB(id);
            if (res.success) {
                showToast('success', 'Arsip berita acara berhasil dihapus.');
                fetchArchivedReports();
                if (onArchiveUpdated) onArchiveUpdated();
            }
        } catch (e) {
            showToast('error', 'Gagal menghapus arsip.');
        }
    };

    return {
        archivedReports,
        archiveFilterStatus,
        setArchiveFilterStatus,
        isLoadingArchive,
        fetchArchivedReports,
        handleUpdateStatus,
        handleDeleteArchive
    };
};
