import { useState, useEffect } from 'react';
import { useOpenTasks } from './hooks/useOpenTasks';
import { useIncidentArchive } from './hooks/useIncidentArchive';
import { useIncidentForm } from './hooks/useIncidentForm';

export const useIncidentManager = ({ devices, initialTask, onClearInitialTask }) => {
    const [activeSubTab, setActiveSubTab] = useState('create'); // 'create' | 'archive'

    // Sub-Hook 1: Open Tasks & Smart Alerts Queue
    const {
        openTasks,
        isLoadingOpenTasks,
        searchQuery,
        setSearchQuery,
        fetchOpenTasks
    } = useOpenTasks();

    // Sub-Hook 2: Form Handling & Pipeline Stages
    const {
        reportForm,
        setReportForm,
        selectedDevices,
        setSelectedDevices,
        selectedTask,
        sendTeamsNotice,
        setSendTeamsNotice,
        isSaving,
        handleSelectOpenTask,
        toggleSelectDevice,
        handleSaveAndPublish,
        handleDownloadPDF
    } = useIncidentForm({
        devices,
        onReportSaved: fetchOpenTasks
    });

    // Sub-Hook 3: Archive Reports Lifecycle
    const {
        archivedReports,
        archiveFilterStatus,
        setArchiveFilterStatus,
        isLoadingArchive,
        fetchArchivedReports,
        handleUpdateStatus,
        handleDeleteArchive
    } = useIncidentArchive({
        onArchiveUpdated: fetchOpenTasks
    });

    // Initial Task Effect dari external prop / Smart Alert ACK click
    useEffect(() => {
        if (initialTask) {
            handleSelectOpenTask(initialTask);
            if (onClearInitialTask) onClearInitialTask();
        }
    }, [initialTask, handleSelectOpenTask, onClearInitialTask]);

    // Fetch archive data saat tab arsip aktif
    useEffect(() => {
        if (activeSubTab === 'archive') {
            fetchArchivedReports();
        }
    }, [activeSubTab, fetchArchivedReports]);

    const isLoading = isLoadingOpenTasks || isLoadingArchive || isSaving;

    return {
        activeSubTab,
        setActiveSubTab,
        isLoading,
        searchQuery,
        setSearchQuery,
        selectedDevices,
        setSelectedDevices,
        sendTeamsNotice,
        setSendTeamsNotice,
        openTasks,
        selectedTask,
        archivedReports,
        archiveFilterStatus,
        setArchiveFilterStatus,
        reportForm,
        setReportForm,
        fetchOpenTasks,
        fetchArchivedReports,
        handleSelectOpenTask,
        toggleSelectDevice,
        handleSaveAndPublish,
        handleUpdateStatus,
        handleDeleteArchive,
        handleDownloadPDF
    };
};
