import React, { useState } from 'react';
import { useDevices } from '../../context/DeviceContext';

// Custom Hooks & Utils
import { useWorkOrderData } from './hooks/useWorkOrderData';
import { useWorkOrderFilters } from './hooks/useWorkOrderFilters';
import {
    getPriorityBadge,
    getStatusBadge,
    formatDisplayDate,
    calculateTaskDurationMinutes,
    calculateGroupDurationMinutes
} from './utils/workOrderUtils';
import { getInitialFormData, getInitialBreakFormData } from './utils/workOrderFormDefaults';

// Sub Components
import WorkOrderStatsCards from './components/WorkOrderStatsCards';
import TechnicianWorkloadBar from './timeline/TechnicianWorkloadBar';
import WorkOrderHeaderTabs from './components/WorkOrderHeaderTabs';
import WorkOrderControlsBar from './components/WorkOrderControlsBar';
import DailyTimelineScheduler from './timeline/DailyTimelineScheduler';
import TaskPoolSidebar from './timeline/TaskPoolSidebar';
import WorkOrdersTable from './components/WorkOrdersTable';
import WorkOrderPipelineEditor from './components/WorkOrderPipelineEditor';
import WorkOrderOpenTasksQueue from './components/WorkOrderOpenTasksQueue';
import WorkOrderModal from './modals/WorkOrderModal';
import WorkOrderDetailModal from './modals/WorkOrderDetailModal';
import TechnicianTasksModal from './modals/TechnicianTasksModal';
import ScheduleBreakModal from './modals/ScheduleBreakModal';

export default function WorkOrderManagerView({ initialViewTab = 'PIPELINE_EDITOR' }) {
    const { devices: contextDevices } = useDevices();
    const [viewTab, setViewTab] = useState(initialViewTab); // 'PIPELINE_EDITOR' | 'SCHEDULER_WORKSPACE' | 'WORK_ORDERS'

    React.useEffect(() => {
        if (initialViewTab) {
            setViewTab(initialViewTab);
        }
    }, [initialViewTab]);

    const [sourceType, setSourceType] = useState('ALL');

    // Filters & Date States
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [technicianFilter, setTechnicianFilter] = useState('ALL');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [dateMode, setDateMode] = useState('DAILY'); // 'DAILY' or 'ALL_DATES'

    // Data Hook
    const {
        workOrders,
        summary,
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
    } = useWorkOrderData();

    // Filters Hook
    const {
        filteredSourceTasks,
        filteredWorkOrders,
        filteredScheduleBreaks
    } = useWorkOrderFilters({
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
    });

    // Dynamic Summary Stats synced strictly with selectedDate (Harian Daily Scheduler)
    const statsMetrics = React.useMemo(() => {
        const todayStr = new Date().toISOString().slice(0, 10);
        const activeDateStr = selectedDate || todayStr;
        const targetWos = workOrders.filter(w => {
            if (dateMode === 'ALL_DATES') return true;
            return w.targetDate && w.targetDate.startsWith(activeDateStr);
        });

        // 1. OPEN (Backlog tugas yang belum di-assign atau WO berstatus OPEN)
        const openWoCount = targetWos.filter(w => (w.status || 'OPEN').toUpperCase() === 'OPEN').length;
        const unassignedSourceTasksCount = filteredSourceTasks.filter(t => !t.isAssigned).length;
        const openCount = openWoCount + unassignedSourceTasksCount;

        // 2. SCHEDULED (WO yang sudah ditugaskan / ASSIGNED / SCHEDULED tapi belum mulai)
        const scheduledCount = targetWos.filter(w => {
            const st = (w.status || '').toUpperCase();
            return st === 'ASSIGNED' || st === 'SCHEDULED' || st === 'PLAN';
        }).length;

        // 3. IN PROGRESS
        const inProgressCount = targetWos.filter(w => (w.status || '').toUpperCase() === 'IN_PROGRESS').length;

        // 4. PENDING / ON-HOLD
        const pendingCount = targetWos.filter(w => {
            const st = (w.status || '').toUpperCase();
            return st === 'PENDING' || st === 'ON_HOLD' || st === 'ON-HOLD' || st === 'HOLD';
        }).length;

        // 5. RESOLVED / DONE
        const resolvedCount = targetWos.filter(w => {
            const st = (w.status || '').toUpperCase();
            return st === 'RESOLVED' || st === 'DONE' || st === 'CLOSED';
        }).length;

        // 6. OVERDUE / BREACHED (Tugas belum selesai yang target tanggal/waktunya sudah lewat)
        const now = new Date();
        const overdueCount = targetWos.filter(w => {
            const st = (w.status || '').toUpperCase();
            if (st === 'RESOLVED' || st === 'DONE' || st === 'CLOSED') return false;
            if (!w.targetDate) return false;
            
            // Cek jika tanggal lewat atau jika hari ini waktu endTime lewat
            const wDate = w.targetDate.slice(0, 10);
            if (wDate < todayStr) return true;
            if (wDate === todayStr && w.endTime) {
                const [eh, em] = w.endTime.split(':').map(Number);
                const endDateTime = new Date();
                endDateTime.setHours(eh || 17, em || 0, 0, 0);
                return now > endDateTime;
            }
            return false;
        }).length;

        // 7. TOTAL TODAY (Seluruh WO aktif pada tanggal terpilih)
        const totalToday = targetWos.length;

        return {
            open: openCount,
            scheduled: scheduledCount,
            inProgress: inProgressCount,
            pending: pendingCount,
            resolved: resolvedCount,
            overdue: overdueCount,
            totalToday: totalToday
        };
    }, [workOrders, filteredSourceTasks, selectedDate, dateMode]);

    // Modal States: Work Order
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWo, setEditingWo] = useState(null);
    const [formData, setFormData] = useState(() => getInitialFormData(new Date().toISOString().slice(0, 10)));

    // Modal States: Detail & Tech Tasks
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedDetailWo, setSelectedDetailWo] = useState(null);
    const [isTechTasksModalOpen, setIsTechTasksModalOpen] = useState(false);
    const [selectedTechForModal, setSelectedTechForModal] = useState(null);

    // Modal States: Schedule Break
    const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
    const [editingBreak, setEditingBreak] = useState(null);
    const [breakFormData, setBreakFormData] = useState(() => getInitialBreakFormData());

    // Date navigation
    const shiftSelectedDate = (days) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d.toISOString().slice(0, 10));
    };

    const resetDateToToday = () => {
        setSelectedDate(new Date().toISOString().slice(0, 10));
    };

    const resetWorkOrderForm = (customDate = selectedDate) => {
        setEditingWo(null);
        setFormData(getInitialFormData(customDate));
    };

    // Break Handlers
    const handleOpenAddBreak = (customInit = {}) => {
        setEditingBreak(null);
        setBreakFormData({
            ...getInitialBreakFormData(),
            ...customInit
        });
        setIsBreakModalOpen(true);
    };

    const handleBreakClick = (brk) => {
        setEditingBreak(brk);
        setBreakFormData({
            technicianNik: brk.technicianNik || 'ALL',
            technicianName: brk.technicianName || 'Semua Teknisi',
            label: brk.label || '',
            startTime: brk.startTime || '12:00',
            endTime: brk.endTime || '13:00',
            notes: brk.notes || ''
        });
        setIsBreakModalOpen(true);
    };

    const onBreakSubmit = async (e) => {
        e.preventDefault();
        const success = await handleSaveBreak(breakFormData, editingBreak);
        if (success) setIsBreakModalOpen(false);
    };

    const onBreakDelete = async (id) => {
        const success = await handleDeleteBreak(id);
        if (success) setIsBreakModalOpen(false);
    };

    // Helper hitung jam selesai dari durasi
    const computeEndTime = (startHourStr, durationMinutes) => {
        const [sh, sm] = (startHourStr || '08:00').split(':').map(Number);
        const totalEndMins = (sh || 0) * 60 + (sm || 0) + durationMinutes;
        const endH = Math.min(23, Math.floor(totalEndMins / 60));
        const endM = totalEndMins % 60;
        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    };

    // Work Order Creation / Assignment Handlers
    const handleAssignFromTask = (task) => {
        setEditingWo(null);
        const unitMins = calculateTaskDurationMinutes(task);
        const initialDevices = task.perangkat ? [task.perangkat] : [];
        const targetDuration = Math.max(1, initialDevices.length) * unitMins;
        const stdHours = Number((targetDuration / 60).toFixed(2));
        const autoEndTime = computeEndTime('08:00', targetDuration);

        setFormData({
            ...getInitialFormData(task.targetDate || selectedDate),
            woType: task.type,
            title: task.title,
            description: `Tipe: ${task.type}\nPerangkat: ${task.perangkat}\nBagian / Checklist: ${task.checkItem}\nPeriodik: ${task.periodik}`,
            priority: task.suggestedPriority || 'MEDIUM',
            startTime: '08:00',
            endTime: autoEndTime,
            estimatedHours: stdHours,
            unitCycleTimeMinutes: unitMins,
            targetDurationMinutes: targetDuration,
            devices: initialDevices,
            referenceId: task.uniqueId
        });
        setIsModalOpen(true);
    };

    const handleAssignFromGroup = (group) => {
        setEditingWo(null);
        const checklistSummary = group.tasks.map((t, idx) => `${idx + 1}. ${t.checkItem} (${t.periodik})`).join('\n');
        const firstDate = group.tasks[0]?.targetDate || selectedDate;
        const allGroupReferenceIds = group.tasks.map(t => t.uniqueId).join(',');
        
        const unitMins = calculateGroupDurationMinutes(group);
        const initialDevices = group.perangkat ? [group.perangkat] : [];
        const targetDuration = Math.max(1, initialDevices.length) * unitMins;
        const stdHours = Number((targetDuration / 60).toFixed(2));
        const autoEndTime = computeEndTime('08:00', targetDuration);

        setFormData({
            ...getInitialFormData(firstDate),
            woType: group.type,
            title: `[PM Group] ${group.subKategori} - ${group.perangkat} (${group.tasks.length} Items)`,
            description: `Pemeliharaan Rutin untuk Unit:\nPerangkat: ${group.perangkat}\nSub Kategori: ${group.subKategori}\nKategori: ${group.category}\n\nDaftar Checklist Standar:\n${checklistSummary}`,
            priority: 'MEDIUM',
            startTime: '08:00',
            endTime: autoEndTime,
            estimatedHours: stdHours,
            unitCycleTimeMinutes: unitMins,
            targetDurationMinutes: targetDuration,
            devices: initialDevices,
            referenceId: allGroupReferenceIds
        });
        setIsModalOpen(true);
    };

    const handleSlotClick = (tech, startHour, endHour) => {
        setEditingWo(null);
        setFormData({
            ...getInitialFormData(selectedDate),
            startTime: startHour || '08:00',
            endTime: endHour || '08:30',
            estimatedHours: 0.5,
            unitCycleTimeMinutes: 30,
            targetDurationMinutes: 30,
            assignedTechnicianNik: tech.nik || tech.NIK || '',
            assignedTechnicianName: tech.nama || tech.NAMA || ''
        });
        setIsModalOpen(true);
    };

    const handleSlotDrop = async (payload, tech, startHour) => {
        if (payload.kind === 'BREAK') {
            const bItem = payload.breakItem || {};
            const dur = payload.durationMinutes || 60;
            const autoEndStr = computeEndTime(startHour || '12:00', dur);

            handleOpenAddBreak({
                technicianNik: tech.nik || tech.NIK || 'ALL',
                technicianName: tech.nama || tech.NAMA || 'Semua Teknisi',
                label: bItem.label || '',
                startTime: startHour || '12:00',
                endTime: autoEndStr
            });
            return;
        }

        setEditingWo(null);

        if (payload.kind === 'GROUP') {
            const group = payload.group;
            const checklistSummary = group.tasks.map((t, idx) => `${idx + 1}. ${t.checkItem} (${t.periodik})`).join('\n');
            const allGroupReferenceIds = group.tasks.map(t => t.uniqueId).join(',');

            const unitMins = payload.standardMinutes || calculateGroupDurationMinutes(group);
            const initialDevices = group.perangkat ? [group.perangkat] : [];
            const targetDuration = Math.max(1, initialDevices.length) * unitMins;
            const stdHours = Number((targetDuration / 60).toFixed(2));
            const autoEndStr = computeEndTime(startHour || '08:00', targetDuration);

            setFormData({
                ...getInitialFormData(selectedDate),
                woType: group.type,
                title: `[PM Group] ${group.subKategori} - ${group.perangkat} (${group.tasks.length} Items)`,
                description: `Pemeliharaan Rutin untuk Unit:\nPerangkat: ${group.perangkat}\nSub Kategori: ${group.subKategori}\nKategori: ${group.category}\n\nDaftar Checklist Standar:\n${checklistSummary}`,
                startTime: startHour || '08:00',
                endTime: autoEndStr,
                estimatedHours: stdHours,
                unitCycleTimeMinutes: unitMins,
                targetDurationMinutes: targetDuration,
                assignedTechnicianNik: tech.nik || tech.NIK || '',
                assignedTechnicianName: tech.nama || tech.NAMA || '',
                devices: initialDevices,
                referenceId: allGroupReferenceIds
            });
            setIsModalOpen(true);
        } else if (payload.kind === 'TASK') {
            const task = payload.task;
            const unitMins = payload.standardMinutes || calculateTaskDurationMinutes(task);
            const initialDevices = task.perangkat ? [task.perangkat] : [];
            const targetDuration = Math.max(1, initialDevices.length) * unitMins;
            const stdHours = Number((targetDuration / 60).toFixed(2));
            const autoEndStr = computeEndTime(startHour || '08:00', targetDuration);

            setFormData({
                ...getInitialFormData(selectedDate),
                woType: task.type,
                title: task.title,
                description: `Tipe: ${task.type}\nPerangkat: ${task.perangkat}\nBagian / Checklist: ${task.checkItem}\nPeriodik: ${task.periodik}`,
                priority: task.suggestedPriority || 'MEDIUM',
                startTime: startHour || '08:00',
                endTime: autoEndStr,
                estimatedHours: stdHours,
                unitCycleTimeMinutes: unitMins,
                targetDurationMinutes: targetDuration,
                assignedTechnicianNik: tech.nik || tech.NIK || '',
                assignedTechnicianName: tech.nama || tech.NAMA || '',
                devices: initialDevices,
                referenceId: task.uniqueId
            });
            setIsModalOpen(true);
        }
    };

    const handleOpenEdit = (wo) => {
        setEditingWo(wo);
        let parsedMembers = [];
        if (wo.teamMembersJson) {
            try { parsedMembers = JSON.parse(wo.teamMembersJson); } catch (e) {}
        } else if (Array.isArray(wo.teamMembers)) {
            parsedMembers = wo.teamMembers;
        }

        let parsedDevices = [];
        if (wo.devicesJson) {
            try { parsedDevices = JSON.parse(wo.devicesJson); } catch (e) {}
        } else if (Array.isArray(wo.devices)) {
            parsedDevices = wo.devices;
        }

        const initialTargetDuration = wo.targetDurationMinutes || Math.round((parseFloat(wo.estimatedHours) || 1) * 60);
        const devCount = Math.max(1, (parsedDevices || []).length);
        const unitMins = Math.round(initialTargetDuration / devCount) || 5;

        setFormData({
            woType: wo.woType,
            title: wo.title,
            description: wo.description || '',
            priority: wo.priority,
            status: wo.status,
            targetDate: wo.targetDate || selectedDate,
            startTime: wo.startTime || '08:00',
            endTime: wo.endTime || '10:00',
            estimatedHours: wo.estimatedHours || 1.5,
            unitCycleTimeMinutes: unitMins,
            targetDurationMinutes: initialTargetDuration,
            actualHours: wo.actualHours !== null && wo.actualHours !== undefined ? wo.actualHours : '',
            actualStartTime: wo.actualStartTime || '',
            actualEndTime: wo.actualEndTime || '',
            actualDurationMinutes: wo.actualDurationMinutes !== null && wo.actualDurationMinutes !== undefined ? wo.actualDurationMinutes : '',
            assignedTechnicianNik: wo.assignedTechnicianNik || '',
            assignedTechnicianName: wo.assignedTechnicianName || '',
            teamMembers: parsedMembers || [],
            devices: parsedDevices || [],
            referenceId: wo.referenceId || '',
            completionNotes: wo.completionNotes || '',
            remarks: wo.remarks || ''
        });
        setIsModalOpen(true);
    };

    const handleSelectTechnician = (e) => {
        const nik = e.target.value;
        const tech = technicians.find(t => (t.nik || t.NIK) === nik);
        setFormData(prev => ({
            ...prev,
            assignedTechnicianNik: nik,
            assignedTechnicianName: tech ? (tech.nama || tech.NAMA) : ''
        }));
    };

    const onWorkOrderSubmit = async (e) => {
        e.preventDefault();
        const success = await handleSaveWorkOrder(formData, editingWo);
        if (success) setIsModalOpen(false);
    };

    const handleViewDetail = (wo) => {
        if (!wo) return;
        setSelectedDetailWo(wo);
        setIsDetailModalOpen(true);
    };

    const handleCardTechClick = (tech) => {
        setSelectedTechForModal(tech);
        setIsTechTasksModalOpen(true);
    };

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Top Summary Stat Cards (Synchronized strictly to selectedDate) */}
            <WorkOrderStatsCards
                stats={statsMetrics}
                selectedDate={selectedDate}
            />

            {/* Main Tabs Navigation */}
            <WorkOrderHeaderTabs
                viewTab={viewTab}
                setViewTab={setViewTab}
                workOrdersCount={workOrders.length}
                isLoading={isLoading}
                onSync={fetchData}
            />

            {/* Controls Bar & Daily Date Filter */}
            <WorkOrderControlsBar
                viewTab={viewTab}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                technicianFilter={technicianFilter}
                setTechnicianFilter={setTechnicianFilter}
                technicians={technicians}
                dateMode={dateMode}
                setDateMode={setDateMode}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                shiftSelectedDate={shiftSelectedDate}
                resetDateToToday={resetDateToToday}
                onOpenCreateCustom={() => {
                    resetWorkOrderForm(selectedDate);
                    setIsModalOpen(true);
                }}
            />

            {/* TAB 1: INTEGRATED PIPELINE FORM EDITOR */}
            {viewTab === 'PIPELINE_EDITOR' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-start">
                    <div className="lg:col-span-4">
                        <WorkOrderOpenTasksQueue
                            tasks={filteredSourceTasks}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            onSelectTask={(task) => {
                                handleAssignFromTask(task);
                                setIsModalOpen(false);
                            }}
                            onSelectGroup={(group) => {
                                handleAssignFromGroup(group);
                                setIsModalOpen(false);
                            }}
                            onOpenCreateCustom={() => resetWorkOrderForm(selectedDate)}
                        />
                    </div>

                    <div className="lg:col-span-8">
                        <WorkOrderPipelineEditor
                            formData={formData}
                            setFormData={setFormData}
                            editingWo={editingWo}
                            technicians={technicians}
                            inventoryDevices={contextDevices || []}
                            onSubmit={async (e) => {
                                e?.preventDefault?.();
                                const success = await handleSaveWorkOrder(formData, editingWo);
                                if (success) {
                                    setEditingWo(null);
                                }
                            }}
                            onCancel={() => resetWorkOrderForm(selectedDate)}
                            onSelectTechnician={handleSelectTechnician}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            )}

            {/* TAB 2: INTEGRATED SCHEDULER WORKSPACE */}
            {viewTab === 'SCHEDULER_WORKSPACE' && (
                <div className="flex flex-col lg:flex-row items-stretch gap-3 flex-1 h-[calc(100vh-280px)] min-h-[500px] overflow-hidden">
                    <TaskPoolSidebar
                        tasks={filteredSourceTasks}
                        onAssignTask={handleAssignFromTask}
                        onAssignGroup={handleAssignFromGroup}
                        onAssignBreak={() => handleOpenAddBreak()}
                    />

                    <DailyTimelineScheduler
                        technicians={technicians}
                        workOrders={filteredWorkOrders}
                        scheduleBreaks={filteredScheduleBreaks}
                        selectedDate={selectedDate}
                        onSlotClick={handleSlotClick}
                        onSlotDrop={handleSlotDrop}
                        onWoClick={handleViewDetail}
                        onBreakClick={handleBreakClick}
                        onOpenAddBreak={() => handleOpenAddBreak()}
                        onSelectTechnician={handleCardTechClick}
                    />
                </div>
            )}

            {/* TAB 3: ARSIP SEMUA WORK ORDERS */}
            {viewTab === 'WORK_ORDERS' && (
                <WorkOrdersTable
                    workOrders={filteredWorkOrders}
                    isLoading={isLoading}
                    dateMode={dateMode}
                    selectedDate={selectedDate}
                    formatDisplayDate={formatDisplayDate}
                    getPriorityBadge={getPriorityBadge}
                    getStatusBadge={getStatusBadge}
                    onEditWo={handleOpenEdit}
                    onDeleteWo={handleDeleteWorkOrder}
                    onQuickStatusChange={handleQuickStatusChange}
                    onViewDetail={handleViewDetail}
                />
            )}

            {/* Modal Create / Edit Work Order */}
            <WorkOrderModal
                isOpen={isModalOpen}
                editingWo={editingWo}
                formData={formData}
                setFormData={setFormData}
                technicians={technicians}
                inventoryDevices={contextDevices || []}
                onClose={() => setIsModalOpen(false)}
                onSubmit={onWorkOrderSubmit}
                onSelectTechnician={handleSelectTechnician}
            />

            {/* Modal Setup Waktu Istirahat Dinamis */}
            <ScheduleBreakModal
                isOpen={isBreakModalOpen}
                editingBreak={editingBreak}
                formData={breakFormData}
                setFormData={setBreakFormData}
                technicians={technicians}
                onClose={() => setIsBreakModalOpen(false)}
                onSubmit={onBreakSubmit}
                onDelete={onBreakDelete}
            />

            {/* Modal View Detail Work Order */}
            <WorkOrderDetailModal
                isOpen={isDetailModalOpen}
                wo={selectedDetailWo}
                onClose={() => setIsDetailModalOpen(false)}
                onEdit={handleOpenEdit}
            />

            {/* Modal Daftar Tugas Teknisi Saat Card Teknisi Diklik */}
            <TechnicianTasksModal
                isOpen={isTechTasksModalOpen}
                technician={selectedTechForModal}
                workOrders={workOrders}
                scheduleBreaks={scheduleBreaks}
                selectedDate={selectedDate}
                onClose={() => setIsTechTasksModalOpen(false)}
                onViewDetail={handleViewDetail}
            />
        </div>
    );
}

