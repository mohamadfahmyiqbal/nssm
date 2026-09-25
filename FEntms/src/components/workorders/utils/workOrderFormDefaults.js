export const getInitialFormData = (selectedDate = new Date().toISOString().slice(0, 10)) => ({
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

export const getInitialBreakFormData = () => ({
    technicianNik: 'ALL',
    technicianName: 'Semua Teknisi',
    label: '',
    startTime: '12:00',
    endTime: '13:00',
    notes: ''
});
