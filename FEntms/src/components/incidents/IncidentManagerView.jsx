import React from 'react';
import { useDevices } from '../../context/DeviceContext';
import { useIncidentManager } from './useIncidentManager';
import IncidentHeaderToolbar from './IncidentHeaderToolbar';
import OpenTasksQueueList from './OpenTasksQueueList';
import IncidentFormEditor from './IncidentFormEditor';
import IncidentArchiveTable from './IncidentArchiveTable';

export default function IncidentManagerView({ initialTask, onClearInitialTask }) {
    const { devices } = useDevices();
    const {
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
    } = useIncidentManager({ devices, initialTask, onClearInitialTask });

    return (
        <div className="flex-1 flex flex-col gap-4 font-sans">
            {/* Top Bar Header with Navigation Tabs & Actions */}
            <IncidentHeaderToolbar
                activeSubTab={activeSubTab}
                setActiveSubTab={setActiveSubTab}
                sendTeamsNotice={sendTeamsNotice}
                setSendTeamsNotice={setSendTeamsNotice}
                handleSaveAndPublish={handleSaveAndPublish}
                handleDownloadPDF={handleDownloadPDF}
                isLoading={isLoading}
                selectedDevicesCount={selectedDevices.length || 1}
            />

            {/* Sub Tab: RIWAYAT ARSIP BERITA ACARA */}
            {activeSubTab === 'archive' && (
                <IncidentArchiveTable
                    archivedReports={archivedReports}
                    archiveFilterStatus={archiveFilterStatus}
                    setArchiveFilterStatus={setArchiveFilterStatus}
                    fetchArchivedReports={fetchArchivedReports}
                    handleUpdateStatus={handleUpdateStatus}
                    handleDeleteArchive={handleDeleteArchive}
                    isLoading={isLoading}
                />
            )}

            {/* Sub Tab: PIPELINE PENANGANAN & ANTREAN TASK OPEN */}
            {activeSubTab === 'create' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
                    {/* Kolom Kiri: Antrean Riwayat Task yang Sedang Open / Anomali Live */}
                    <OpenTasksQueueList
                        openIncidents={openTasks}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        onSelectOpenTask={handleSelectOpenTask}
                        selectedTask={selectedTask}
                        isLoading={isLoading}
                        onRefresh={fetchOpenTasks}
                    />

                    {/* Kolom Kanan: 5-Stage Pipeline Form Editor */}
                    <IncidentFormEditor
                        reportForm={reportForm}
                        setReportForm={setReportForm}
                        selectedDevices={selectedDevices}
                        toggleSelectDevice={toggleSelectDevice}
                        setSelectedDevices={setSelectedDevices}
                        devices={devices}
                    />
                </div>
            )}
        </div>
    );
}
