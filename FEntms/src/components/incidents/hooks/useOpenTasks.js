import { useState, useEffect, useCallback } from 'react';
import { getIncidentReportsFromDB, getSmartAlertsFromDB } from '../../../services/api';

export const useOpenTasks = () => {
    const [openTasks, setOpenTasks] = useState([]);
    const [isLoadingOpenTasks, setIsLoadingOpenTasks] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchOpenTasks = useCallback(async () => {
        setIsLoadingOpenTasks(true);
        try {
            const [resDbReports, resSmartAlerts] = await Promise.all([
                getIncidentReportsFromDB('OPEN').catch(() => ({ data: [] })),
                getSmartAlertsFromDB().catch(() => ({ data: [] }))
            ]);

            const list = [];

            // 1. Seluruh Laporan dari Database SQL Server yang statusnya OPEN / IN PROGRESS
            if (resDbReports?.success && Array.isArray(resDbReports.data)) {
                resDbReports.data.forEach(r => {
                    list.push({
                        ...r,
                        sourceType: 'DB_OPEN_TASK',
                        title: `[${r.reportNumber}] Gangguan: ${r.primaryHostname}`
                    });
                });
            }

            // 2. Anomali Live Telemetri (Smart Alerts) yang belum di-ACK dan belum dibuatkan berita acara
            if (resSmartAlerts?.success && Array.isArray(resSmartAlerts.data)) {
                resSmartAlerts.data
                    .filter(alert => !alert.IS_ACKNOWLEDGED)
                    .slice(0, 15)
                    .forEach(alert => {
                        const exists = list.some(item =>
                            (item.primaryIp && alert.IP && item.primaryIp === alert.IP) ||
                            (item.primaryHostname && alert.HOSTNAME && item.primaryHostname.toLowerCase() === alert.HOSTNAME.toLowerCase())
                        );
                        if (!exists) {
                            list.push({
                                id: `smart-${alert.id}`,
                                alertDbId: alert.id,
                                reportNumber: `ALERT-${alert.id}`,
                                primaryHostname: alert.HOSTNAME || alert.PID || 'Unknown Host',
                                primaryIp: alert.IP || '-',
                                symptom: alert.MESSAGE || 'Terdeteksi anomali telemetri perangkat.',
                                impact: 'Potensi degradasi performa jaringan / link flap.',
                                priority: alert.SEVERITY === 'CRITICAL' ? 'P1' : 'P2',
                                discoveredTime: alert.RECORDED_AT 
                                    ? new Date(alert.RECORDED_AT).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
                                    : new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                                reportDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                                sourceType: 'LIVE_ANOMALY',
                                location: alert.LOCATION || alert.FLOOR || 'Server Room'
                            });
                        }
                    });
            }

            setOpenTasks(list);
        } catch (err) {
            console.error('Failed fetching open tasks:', err);
        } finally {
            setIsLoadingOpenTasks(false);
        }
    }, []);

    useEffect(() => {
        fetchOpenTasks();
    }, [fetchOpenTasks]);

    return {
        openTasks,
        isLoadingOpenTasks,
        searchQuery,
        setSearchQuery,
        fetchOpenTasks
    };
};
