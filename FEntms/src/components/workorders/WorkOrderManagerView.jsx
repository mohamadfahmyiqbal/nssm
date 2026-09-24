import React, { useState } from 'react';
import { Briefcase, RefreshCw } from 'lucide-react';
import { useDevices } from '../../context/DeviceContext';

// Custom Hooks & Utils
import { useWorkOrderData } from './useWorkOrderData';
import { useWorkOrderFilters } from './useWorkOrderFilters';
import {
    getPriorityBadge,
    getStatusBadge,
    formatDisplayDate,
    calculateTaskDurationMinutes,
    calculateGroupDurationMinutes
} from './workOrderUtils';

// Sub Components
import WorkOrderStatsCards from './WorkOrderStatsCards';
import TechnicianWorkloadBar from './TechnicianWorkloadBar';
import WorkOrderControlsBar from './WorkOrderControlsBar';
import DailyTimelineScheduler from './DailyTimelineScheduler';
import TaskPoolSidebar from './TaskPoolSidebar';
import WorkOrdersTable from './WorkOrdersTable';
import WorkOrderPipelineEditor from './WorkOrderPipelineEditor';
import WorkOrderOpenTasksQueue from './WorkOrderOpenTasksQueue';
import WorkOrderModal from './WorkOrderModal';
import WorkOrderDetailModal from './WorkOrderDetailModal';
import TechnicianTasksModal from './TechnicianTasksModal';
import ScheduleBreakModal from './ScheduleBreakModal';

export default function WorkOrderManagerView() {
    const { devices: contextDevices } = useDevices();
    const [viewTab, setViewTab] = useState('SCHEDULER_WORKSPACE'); // 'SCHEDULER_WORKSPACE' or 'WORK_ORDERS'
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

    // Modal States: Work Order
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWo, setEditingWo] = useState(null);
    const [formData, setFormData] = useState({
        woType: 'PREVENTIVE_MAINTENANCE',
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'ASSIGNED',
        targetDate: new Date().toISOString().slice(0, 10),
        startTime: '08:00',
        endTime: '10:00',
        estimatedHours: 2.0,
        assignedTechnicianNik: '',
        assignedTechnicianName: '',
        teamMembers: [],
        referenceId: '',
        completionNotes: ''
    });

    // Modal States: Detail & Tech Tasks
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedDetailWo, setSelectedDetailWo] = useState(null);
    const [isTechTasksModalOpen, setIsTechTasksModalOpen] = useState(false);
    const [selectedTechForModal, setSelectedTechForModal] = useState(null);

    // Modal States: Schedule Break
    const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
    const [editingBreak, setEditingBreak] = useState(null);
    const [breakFormData, setBreakFormData] = useState({
        technicianNik: 'ALL',
        technicianName: 'Semua Teknisi',
        label: '',
        startTime: '12:00',
        endTime: '13:00',
        notes: ''
    });

    // Date navigation
    const shiftSelectedDate = (days) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d.toISOString().slice(0, 10));
    };

    const resetDateToToday = () => {
        setSelectedDate(new Date().toISOString().slice(0, 10));
    };

    // Break Handlers
    const handleOpenAddBreak = (customInit = {}) => {
        setEditingBreak(null);
        setBreakFormData({
            technicianNik: customInit.technicianNik || 'ALL',
            technicianName: customInit.technicianName || 'Semua Teknisi',
            label: customInit.label || '',
            startTime: customInit.startTime || '12:00',
            endTime: customInit.endTime || '13:00',
            notes: ''
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

    // Work Order Creation / Assignment Handlers
    const handleAssignFromTask = (task) => {
        setEditingWo(null);
        const unitMins = calculateTaskDurationMinutes(task);
        const initialDevices = task.perangkat ? [task.perangkat] : [];
        const targetDuration = Math.max(1, initialDevices.length) * unitMins;
        const stdHours = Number((targetDuration / 60).toFixed(2));
        
        const startHourMins = 8 * 60;
        const endHourMins = startHourMins + targetDuration;
        const endH = Math.min(23, Math.floor(endHourMins / 60));
        const endM = endHourMins % 60;
        const autoEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        setFormData({
            woType: task.type,
            title: task.title,
            description: `Tipe: ${task.type}\nPerangkat: ${task.perangkat}\nBagian / Checklist: ${task.checkItem}\nPeriodik: ${task.periodik}`,
            priority: task.suggestedPriority,
            status: 'ASSIGNED',
            targetDate: task.targetDate || selectedDate,
            startTime: '08:00',
            endTime: autoEndTime,
            estimatedHours: stdHours,
            unitCycleTimeMinutes: unitMins,
            targetDurationMinutes: targetDuration,
            assignedTechnicianNik: '',
            assignedTechnicianName: '',
            teamMembers: [],
            devices: initialDevices,
            referenceId: task.uniqueId,
            completionNotes: ''
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

        const startHourMins = 8 * 60;
        const endHourMins = startHourMins + targetDuration;
        const endH = Math.min(23, Math.floor(endHourMins / 60));
        const endM = endHourMins % 60;
        const autoEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        setFormData({
            woType: group.type,
            title: `[PM Group] ${group.subKategori} - ${group.perangkat} (${group.tasks.length} Items)`,
            description: `Pemeliharaan Rutin untuk Unit:\nPerangkat: ${group.perangkat}\nSub Kategori: ${group.subKategori}\nKategori: ${group.category}\n\nDaftar Checklist Standar:\n${checklistSummary}`,
            priority: 'MEDIUM',
            status: 'ASSIGNED',
            targetDate: firstDate,
            startTime: '08:00',
            endTime: autoEndTime,
            estimatedHours: stdHours,
            unitCycleTimeMinutes: unitMins,
            targetDurationMinutes: targetDuration,
            actualHours: '',
            actualStartTime: '',
            actualEndTime: '',
            actualDurationMinutes: '',
            assignedTechnicianNik: '',
            assignedTechnicianName: '',
            teamMembers: [],
            devices: initialDevices,
            referenceId: allGroupReferenceIds,
            completionNotes: '',
            remarks: ''
        });
        setIsModalOpen(true);
    };

    const handleSlotClick = (tech, startHour, endHour) => {
        setEditingWo(null);
        setFormData({
            woType: 'PREVENTIVE_MAINTENANCE',
            title: '',
            description: '',
            priority: 'MEDIUM',
            status: 'ASSIGNED',
            targetDate: selectedDate,
            startTime: startHour || '08:00',
            endTime: endHour || '08:30',
            estimatedHours: 0.5,
            unitCycleTimeMinutes: 30,
            targetDurationMinutes: 30,
            actualHours: '',
            actualStartTime: '',
            actualEndTime: '',
            actualDurationMinutes: '',
            assignedTechnicianNik: tech.nik || tech.NIK || '',
            assignedTechnicianName: tech.nama || tech.NAMA || '',
            teamMembers: [],
            devices: [],
            referenceId: '',
            completionNotes: '',
            remarks: ''
        });
        setIsModalOpen(true);
    };

    const handleSlotDrop = async (payload, tech, startHour) => {
        if (payload.kind === 'BREAK') {
            const bItem = payload.breakItem || {};
            const dur = payload.durationMinutes || 60;
            const [sh, sm] = (startHour || '12:00').split(':').map(Number);
            const totalEndMins = (sh || 0) * 60 + (sm || 0) + dur;
            const eh = Math.min(23, Math.floor(totalEndMins / 60));
            const em = totalEndMins % 60;
            const autoEndStr = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

            setEditingBreak(null);
            setBreakFormData({
                technicianNik: tech.nik || tech.NIK || 'ALL',
                technicianName: tech.nama || tech.NAMA || 'Semua Teknisi',
                label: bItem.label || '',
                startTime: startHour || '12:00',
                endTime: autoEndStr,
                notes: ''
            });
            setIsBreakModalOpen(true);
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

            const [sh, sm] = (startHour || '08:00').split(':').map(Number);
            const totalEndMins = sh * 60 + sm + targetDuration;
            const eh = Math.min(23, Math.floor(totalEndMins / 60));
            const em = totalEndMins % 60;
            const autoEndStr = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

            setFormData({
                woType: group.type,
                title: `[PM Group] ${group.subKategori} - ${group.perangkat} (${group.tasks.length} Items)`,
                description: `Pemeliharaan Rutin untuk Unit:\nPerangkat: ${group.perangkat}\nSub Kategori: ${group.subKategori}\nKategori: ${group.category}\n\nDaftar Checklist Standar:\n${checklistSummary}`,
                priority: 'MEDIUM',
                status: 'ASSIGNED',
                targetDate: selectedDate,
                startTime: startHour || '08:00',
                endTime: autoEndStr,
                estimatedHours: stdHours,
                unitCycleTimeMinutes: unitMins,
                targetDurationMinutes: targetDuration,
                actualHours: '',
                actualStartTime: '',
                actualEndTime: '',
                actualDurationMinutes: '',
                assignedTechnicianNik: tech.nik || tech.NIK || '',
                assignedTechnicianName: tech.nama || tech.NAMA || '',
                teamMembers: [],
                devices: initialDevices,
                referenceId: allGroupReferenceIds,
                completionNotes: '',
                remarks: ''
            });
            setIsModalOpen(true);
        } else if (payload.kind === 'TASK') {
            const task = payload.task;
            const unitMins = payload.standardMinutes || calculateTaskDurationMinutes(task);
            const initialDevices = task.perangkat ? [task.perangkat] : [];
            const targetDuration = Math.max(1, initialDevices.length) * unitMins;
            const stdHours = Number((targetDuration / 60).toFixed(2));

            const [sh, sm] = (startHour || '08:00').split(':').map(Number);
            const totalEndMins = sh * 60 + sm + targetDuration;
            const eh = Math.min(23, Math.floor(totalEndMins / 60));
            const em = totalEndMins % 60;
            const autoEndStr = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

            setFormData({
                woType: task.type,
                title: task.title,
                description: `Tipe: ${task.type}\nPerangkat: ${task.perangkat}\nBagian / Checklist: ${task.checkItem}\nPeriodik: ${task.periodik}`,
                priority: task.suggestedPriority || 'MEDIUM',
                status: 'ASSIGNED',
                targetDate: selectedDate,
                startTime: startHour || '08:00',
                endTime: autoEndStr,
                estimatedHours: stdHours,
                unitCycleTimeMinutes: unitMins,
                targetDurationMinutes: targetDuration,
                actualHours: '',
                actualStartTime: '',
                actualEndTime: '',
                actualDurationMinutes: '',
                assignedTechnicianNik: tech.nik || tech.NIK || '',
                assignedTechnicianName: tech.nama || tech.NAMA || '',
                teamMembers: [],
                devices: initialDevices,
                referenceId: task.uniqueId,
                completionNotes: '',
                remarks: ''
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
            {/* Top Summary Stat Cards */}
            <WorkOrderStatsCards
                summary={summary}
                schedulesCount={schedules.length}
                incidentsCount={incidents.length}
            />

            {/* Man Power Allocation Workload Bar (Klik Card untuk Detail Task) */}
            <TechnicianWorkloadBar
                technicians={technicians}
                workloads={calculatedTechnicianWorkloads}
                onSelectTechnician={handleCardTechClick}
            />

            {/* Main Tabs Navigation */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewTab('PIPELINE_EDITOR')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                            viewTab === 'PIPELINE_EDITOR'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                    >
                        <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                        <span>1. Editor Surat Perintah Kerja (Pipeline)</span>
                    </button>

                    <button
                        onClick={() => setViewTab('SCHEDULER_WORKSPACE')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                            viewTab === 'SCHEDULER_WORKSPACE'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                    >
                        <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                        <span>2. Daily Timeline Scheduler (Drag & Drop)</span>
                    </button>

                    <button
                        onClick={() => setViewTab('WORK_ORDERS')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                            viewTab === 'WORK_ORDERS'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                    >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>3. Arsip Seluruh Work Order</span>
                        <span className="px-1.5 py-0.2 text-[10px] bg-slate-950/60 rounded-full font-mono">
                            {workOrders.length}
                        </span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border border-slate-700"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Sync Data</span>
                    </button>
                </div>
            </div>

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
                    setEditingWo(null);
                    setFormData({
                        woType: 'PREVENTIVE_MAINTENANCE',
                        title: '',
                        description: '',
                        priority: 'MEDIUM',
                        status: 'ASSIGNED',
                        targetDate: selectedDate,
                        startTime: '08:00',
                        endTime: '10:00',
                        estimatedHours: 2.0,
                        unitCycleTimeMinutes: 30,
                        targetDurationMinutes: 120,
                        actualHours: '',
                        actualStartTime: '',
                        actualEndTime: '',
                        actualDurationMinutes: '',
                        assignedTechnicianNik: '',
                        assignedTechnicianName: '',
                        teamMembers: [],
                        devices: [],
                        referenceId: '',
                        completionNotes: '',
                        remarks: ''
                    });
                    setIsModalOpen(true);
                }}
            />

            {/* TAB 1: INTEGRATED PIPELINE FORM EDITOR (SEPERTI BERITA ACARA IT) */}
            {viewTab === 'PIPELINE_EDITOR' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-start">
                    {/* Panel Kiri: Antrean Task Open (4 Kolom) */}
                    <div className="lg:col-span-4">
                        <WorkOrderOpenTasksQueue
                            tasks={filteredSourceTasks}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            onSelectTask={(task) => {
                                handleAssignFromTask(task);
                                setIsModalOpen(false); // keep in pipeline editor view
                            }}
                            onSelectGroup={(group) => {
                                handleAssignFromGroup(group);
                                setIsModalOpen(false); // keep in pipeline editor view
                            }}
                            onOpenCreateCustom={() => {
                                setEditingWo(null);
                                setFormData({
                                    woType: 'PREVENTIVE_MAINTENANCE',
                                    title: '',
                                    description: '',
                                    priority: 'MEDIUM',
                                    status: 'ASSIGNED',
                                    targetDate: selectedDate,
                                    startTime: '08:00',
                                    endTime: '10:00',
                                    estimatedHours: 2.0,
                                    unitCycleTimeMinutes: 30,
                                    targetDurationMinutes: 120,
                                    actualHours: '',
                                    actualStartTime: '',
                                    actualEndTime: '',
                                    actualDurationMinutes: '',
                                    assignedTechnicianNik: '',
                                    assignedTechnicianName: '',
                                    teamMembers: [],
                                    devices: [],
                                    referenceId: '',
                                    completionNotes: '',
                                    remarks: ''
                                });
                            }}
                        />
                    </div>

                    {/* Panel Kanan: Form Editor Surat Perintah Kerja (8 Kolom) */}
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
                            onCancel={() => {
                                setEditingWo(null);
                                setFormData({
                                    woType: 'PREVENTIVE_MAINTENANCE',
                                    title: '',
                                    description: '',
                                    priority: 'MEDIUM',
                                    status: 'ASSIGNED',
                                    targetDate: selectedDate,
                                    startTime: '08:00',
                                    endTime: '10:00',
                                    estimatedHours: 2.0,
                                    unitCycleTimeMinutes: 30,
                                    targetDurationMinutes: 120,
                                    actualHours: '',
                                    actualStartTime: '',
                                    actualEndTime: '',
                                    actualDurationMinutes: '',
                                    assignedTechnicianNik: '',
                                    assignedTechnicianName: '',
                                    teamMembers: [],
                                    devices: [],
                                    referenceId: '',
                                    completionNotes: '',
                                    remarks: ''
                                });
                            }}
                            onSelectTechnician={handleSelectTechnician}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            )}

            {/* TAB 2: INTEGRATED SCHEDULER WORKSPACE */}
            {viewTab === 'SCHEDULER_WORKSPACE' && (
                <div className="flex items-stretch gap-3 flex-1 h-[calc(100vh-320px)] min-h-[550px] overflow-hidden">
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
                    />
                </div>
            )}

            {/* TAB 2: ARSIP SEMUA WORK ORDERS */}
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
