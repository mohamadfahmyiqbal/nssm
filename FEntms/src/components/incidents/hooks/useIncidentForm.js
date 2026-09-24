import { useState, useCallback } from 'react';
import { saveIncidentReportToDB, ackSmartAlertInDB } from '../../../services/api';
import { generateIncidentReportPDF } from '../../../utils/incidentReportGenerator';
import { showToast } from '../../../utils/swal';

const getDefaultForm = () => ({
    reportNumber: `INC-${Date.now().toString().slice(-6)}`,
    date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    reporter: 'Sistem Monitoring IT (Auto)',
    discoveredTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    startTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    endTime: '',
    totalDowntime: '',
    finalStatus: 'IN PROGRESS',
    deviceId: '',
    hostname: '',
    ip: '',
    vendor: '',
    deviceType: '',
    location: '',
    serialNumber: '-',
    sourceInfo: 'Sistem Monitoring (SNMP/Alert)',
    assignedTechnician: '',
    assignedTechnicianNik: '',
    symptom: '',
    impact: '',
    initialCheck: '',
    diagnosis: '',
    actionTaken: '',
    rootCause: '',
    preventiveAction: ''
});

export const useIncidentForm = ({ devices, onReportSaved }) => {
    const [reportForm, setReportForm] = useState(getDefaultForm);
    const [selectedDevices, setSelectedDevices] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [sendTeamsNotice, setSendTeamsNotice] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const handleSelectOpenTask = useCallback((task) => {
        if (!task) {
            setSelectedTask(null);
            setSelectedDevices([]);
            setReportForm({
                ...getDefaultForm(),
                reporter: '',
                deviceType: 'Perangkat IT / Endpoint',
                sourceInfo: 'Laporan User'
            });
            showToast('info', 'Formulir siap untuk penginputan insiden manual (Non-Monitoring).');
            return;
        }

        const alertDbId = task.alertDbId || (task.reportNumber?.startsWith('ALERT-') ? task.reportNumber.replace('ALERT-', '') : null);

        setSelectedTask({
            ...task,
            alertDbId
        });

        const matched = devices.find(d =>
            (d.ip && d.ip === (task.primaryIp || task.ip)) ||
            (d.hostname && d.hostname.toLowerCase() === (task.primaryHostname || task.hostname)?.toLowerCase()) ||
            (d.name && d.name.toLowerCase() === (task.primaryHostname || task.hostname)?.toLowerCase())
        );

        if (matched) {
            setSelectedDevices([matched]);
        }

        setReportForm(prev => ({
            ...prev,
            reportNumber: task.reportNumber?.startsWith('INC-') ? task.reportNumber : `INC-${Date.now().toString().slice(-6)}`,
            date: task.reportDate || prev.date,
            discoveredTime: task.discoveredTime || prev.discoveredTime,
            hostname: task.primaryHostname || matched?.name || matched?.hostname || task.hostname || 'Device',
            ip: task.primaryIp || matched?.ip || task.ip || '-',
            vendor: matched?.vendor || task.vendor || 'Generic',
            deviceType: matched?.type || task.deviceType || 'Switch',
            location: matched?.location || matched?.floor || task.location || 'Server Room',
            serialNumber: matched?.mac || matched?.sn || '-',
            sourceInfo: task.sourceType === 'LIVE_ANOMALY' ? 'Sistem Monitoring (SNMP/Alert)' : 'Laporan User',
            assignedTechnician: task.assignedTechnician || '',
            assignedTechnicianNik: task.assignedTechnicianNik || '',
            symptom: task.symptom || task.title || '',
            impact: task.impact || '',
            rootCause: task.rootCause || '',
            actionTaken: task.actionTaken || '',
            finalStatus: task.status || 'IN PROGRESS'
        }));

        showToast('info', `Task [${task.reportNumber}] dimuat ke Pipeline Penanganan.`);
    }, [devices]);

    const toggleSelectDevice = (d) => {
        const targetId = String(d.id || d.PID);
        setSelectedDevices(prev => {
            const exists = prev.some(item => String(item.id || item.PID) === targetId);
            const next = exists 
                ? prev.filter(item => String(item.id || item.PID) !== targetId)
                : [...prev, d];

            if (next.length > 0) {
                const primary = next[0];
                setReportForm(f => ({
                    ...f,
                    hostname: next.length === 1 ? (primary.hostname || primary.name) : `${next.length} Perangkat Terpilih`,
                    ip: next.length === 1 ? primary.ip : next.map(x => x.ip).filter(Boolean).join(', '),
                    vendor: next.length === 1 ? (primary.vendor || 'Generic') : 'Multi-Vendor',
                    deviceType: next.length === 1 ? (primary.type || 'Switch') : 'Multi-Device',
                    location: next.length === 1 ? (primary.location || primary.floor || 'Server Room') : 'Multi-Location',
                    serialNumber: next.length === 1 ? (primary.mac || '-') : `${next.length} S/N Terdaftar`
                }));
            } else {
                setReportForm(f => ({
                    ...f,
                    hostname: '',
                    ip: '',
                    vendor: '',
                    deviceType: '',
                    location: '',
                    serialNumber: '-'
                }));
            }
            return next;
        });
    };

    const handleSaveAndPublish = async () => {
        if (selectedDevices.length === 0 && !reportForm.hostname) {
            showToast('error', 'Silakan pilih minimal satu perangkat terdampak.');
            return;
        }

        try {
            setIsSaving(true);
            const payload = {
                reportNumber: reportForm.reportNumber,
                reportDate: reportForm.date,
                reporter: reportForm.reporter,
                discoveredTime: reportForm.discoveredTime,
                startTime: reportForm.startTime,
                endTime: reportForm.endTime,
                totalDowntime: reportForm.totalDowntime,
                status: reportForm.finalStatus || 'IN PROGRESS',
                devices: selectedDevices.length > 0 ? selectedDevices.map(d => ({
                    hostname: d.hostname || d.name,
                    ip: d.ip,
                    vendor: d.vendor,
                    deviceType: d.type,
                    location: d.location || d.floor,
                    serialNumber: d.mac || d.sn || '-'
                })) : [{
                    hostname: reportForm.hostname,
                    ip: reportForm.ip,
                    vendor: reportForm.vendor,
                    deviceType: reportForm.deviceType,
                    location: reportForm.location,
                    serialNumber: reportForm.serialNumber
                }],
                primaryHostname: reportForm.hostname,
                primaryIp: reportForm.ip,
                location: reportForm.location,
                assignedTechnician: reportForm.assignedTechnician,
                assignedTechnicianNik: reportForm.assignedTechnicianNik,
                symptom: reportForm.symptom,
                impact: reportForm.impact,
                rootCause: reportForm.rootCause,
                actionTaken: reportForm.actionTaken,
                sendToTeams: sendTeamsNotice
            };

            const res = await saveIncidentReportToDB(payload);
            if (res.success) {
                const targetAlertId = selectedTask?.alertDbId || (selectedTask?.reportNumber?.startsWith('ALERT-') ? selectedTask.reportNumber.replace('ALERT-', '') : null);
                if (targetAlertId) {
                    try {
                        await ackSmartAlertInDB(targetAlertId, {
                            note: `Ditangani via Laporan Gangguan No. ${reportForm.reportNumber} (Status: ${payload.status})`,
                            user: reportForm.reporter || 'Operator'
                        });
                    } catch (e) {
                        console.error('Failed auto-acking smart alert:', e);
                    }
                }

                showToast('success', sendTeamsNotice
                    ? 'Berita Acara tersimpan di Database & terkirim ke MS Teams!'
                    : 'Berita Acara berhasil disimpan ke Arsip Database.');
                
                if (onReportSaved) onReportSaved();
                setSelectedTask(null);
                setReportForm(prev => ({
                    ...prev,
                    reportNumber: `INC-${Date.now().toString().slice(-6)}`
                }));
            }
        } catch (error) {
            showToast('error', error.response?.data?.message || 'Gagal menyimpan berita acara.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadPDF = () => {
        if (selectedDevices.length === 0 && !reportForm.hostname) {
            showToast('error', 'Silakan pilih minimal satu perangkat dari daftar inventory.');
            return;
        }
        generateIncidentReportPDF(reportForm);
        showToast('success', 'Formulir Berita Acara Insiden berhasil digenerate.');
    };

    return {
        reportForm,
        setReportForm,
        selectedDevices,
        setSelectedDevices,
        selectedTask,
        setSelectedTask,
        sendTeamsNotice,
        setSendTeamsNotice,
        isSaving,
        handleSelectOpenTask,
        toggleSelectDevice,
        handleSaveAndPublish,
        handleDownloadPDF
    };
};
