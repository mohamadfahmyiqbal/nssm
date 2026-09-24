// services/logTriageService.js
/**
 * Smart Log Summarization & Incident Triage Engine
 * Murni komputasi in-memory O(N), aman dan 100% EDR-Safe (Cybereason compliant).
 */

import DeviceLog from '../models/DeviceLog.js';
import DeviceAlert from '../models/DeviceAlert.js';
import Network from '../models/Network.js';
import { Op } from 'sequelize';

/**
 * Menganalisis, mengelompokkan (clustering), dan melakukan triage pada histori log & alert
 * @param {string} timeWindowRentang Waktu ('1h', '6h', '24h', '7d')
 * @returns {Promise<Object>} Ringkasan eksekutif dan daftar insiden yang telah di-triage
 */
export const generateLogSummaryAndTriage = async (timeWindow = '24h') => {
    try {
        let startTime = new Date();
        if (timeWindow === '1h') startTime.setHours(startTime.getHours() - 1);
        else if (timeWindow === '6h') startTime.setHours(startTime.getHours() - 6);
        else if (timeWindow === '7d') startTime.setDate(startTime.getDate() - 7);
        else startTime.setHours(startTime.getHours() - 24); // default 24h

        const [logs, alerts, devices] = await Promise.all([
            DeviceLog.findAll({
                where: { createdAt: { [Op.gte]: startTime } },
                order: [['createdAt', 'DESC']],
                limit: 1000
            }),
            DeviceAlert.findAll({
                where: { RECORDED_AT: { [Op.gte]: startTime } },
                order: [['RECORDED_AT', 'DESC']],
                limit: 500
            }),
            Network.findAll()
        ]);

        const deviceMap = new Map();
        devices.forEach(d => {
            if (d.PID) deviceMap.set(d.PID, d);
        });

        // 1. Deteksi Flapping & Status Transitions per Device
        const deviceStateChanges = new Map(); // pid -> array of logs
        logs.forEach(log => {
            if (!deviceStateChanges.has(log.PID)) {
                deviceStateChanges.set(log.PID, []);
            }
            deviceStateChanges.get(log.PID).push(log);
        });

        const flappingIncidents = [];
        for (const [pid, logList] of deviceStateChanges.entries()) {
            if (logList.length >= 3) {
                const dev = deviceMap.get(pid);
                flappingIncidents.push({
                    pid,
                    hostname: dev?.HOSTNAME || logList[0].HOSTNAME || pid,
                    ip: dev?.IP || '-',
                    changeCount: logList.length,
                    firstSeen: logList[logList.length - 1].createdAt,
                    lastSeen: logList[0].createdAt,
                    latestStatus: logList[0].NEW_STATUS
                });
            }
        }

        // 2. Clustering & Deduplikasi Alert Sejenis
        const alertClusters = new Map(); // key `${pid}_${alertType}` -> cluster object
        alerts.forEach(alert => {
            const key = `${alert.PID}_${alert.ALERT_TYPE}`;
            if (!alertClusters.has(key)) {
                alertClusters.set(key, {
                    pid: alert.PID,
                    hostname: alert.HOSTNAME,
                    ip: alert.IP,
                    alertType: alert.ALERT_TYPE,
                    severity: alert.SEVERITY,
                    count: 0,
                    firstSeen: alert.RECORDED_AT,
                    lastSeen: alert.RECORDED_AT,
                    latestMessage: alert.MESSAGE,
                    isAcknowledged: alert.IS_ACKNOWLEDGED,
                    peakMetricValue: alert.METRIC_VALUE
                });
            }
            const cluster = alertClusters.get(key);
            cluster.count += 1;
            if (new Date(alert.RECORDED_AT) > new Date(cluster.lastSeen)) {
                cluster.lastSeen = alert.RECORDED_AT;
                cluster.latestMessage = alert.MESSAGE;
            }
        });

        // 3. Triage Matrix (P1, P2, P3, P4)
        const triagedIncidents = [];

        // Masukkan insiden flapping
        flappingIncidents.forEach(f => {
            const priority = f.changeCount >= 6 ? 'P2' : 'P3';
            triagedIncidents.push({
                incidentId: `INC-FLAP-${f.pid}`,
                priority,
                category: 'NETWORK_FLAPPING',
                title: `Instabilitas Jaringan (Flapping ${f.changeCount}x)`,
                device: { pid: f.pid, hostname: f.hostname, ip: f.ip },
                occurrences: f.changeCount,
                firstSeen: f.firstSeen,
                lastSeen: f.lastSeen,
                status: f.latestStatus === 'UP' ? 'INTERMITTENT' : 'UNSTABLE_DOWN',
                summary: `Perangkat mengalami perubahan status ${f.changeCount} kali dalam rentang waktu ${timeWindow}.`,
                recommendation: 'Periksa fisik port switch, kualitas kabel LAN RJ45, atau stabilitas adaptor daya.'
            });
        });

        // Masukkan insiden alert cluster
        for (const cluster of alertClusters.values()) {
            let priority = 'P3';
            let category = 'TELEMETRY_ANOMALY';
            let recommendation = 'Tinjau beban proses dan telemetri perangkat.';

            if (cluster.alertType.includes('TEMP') || cluster.alertType.includes('OVERHEAT')) {
                priority = cluster.severity === 'CRITICAL' ? 'P1' : 'P2';
                category = 'THERMAL_OVERHEAT';
                recommendation = 'Periksa pendingin ruangan server (AC), ventilasi rack, atau fungsi kipas (fan) perangkat.';
            } else if (cluster.alertType.includes('MEMORY_LEAK')) {
                priority = 'P2';
                category = 'RESOURCE_LEAK';
                recommendation = 'Jadwalkan restart servis/firmware untuk melepaskan alokasi memori yang tertahan.';
            } else if (cluster.alertType.includes('CPU')) {
                priority = cluster.severity === 'CRITICAL' ? 'P2' : 'P3';
                category = 'HIGH_CPU_LOAD';
                recommendation = 'Analisis proses/klien yang mengakses stream berlebihan atau serangan broadcast traffic.';
            } else if (cluster.alertType.includes('OFF_HOURS')) {
                priority = 'P3';
                category = 'SECURITY_ANOMALY';
                recommendation = 'Verifikasi aktivitas transfer data tidak wajar atau pencadangan (backup) di luar jam operasional.';
            }

            triagedIncidents.push({
                incidentId: `INC-ALERT-${cluster.pid}-${cluster.alertType}`,
                priority,
                category,
                title: `[${cluster.alertType}] pada ${cluster.hostname}`,
                device: { pid: cluster.pid, hostname: cluster.hostname, ip: cluster.ip },
                occurrences: cluster.count,
                firstSeen: cluster.firstSeen,
                lastSeen: cluster.lastSeen,
                status: cluster.isAcknowledged ? 'ACKNOWLEDGED' : 'OPEN',
                summary: cluster.latestMessage,
                recommendation
            });
        }

        // Urutkan prioritas insiden (P1 -> P2 -> P3 -> P4)
        const priorityRank = { P1: 1, P2: 2, P3: 3, P4: 4 };
        triagedIncidents.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

        // 4. Executive Summary Generation
        const p1Count = triagedIncidents.filter(i => i.priority === 'P1').length;
        const p2Count = triagedIncidents.filter(i => i.priority === 'P2').length;
        const p3Count = triagedIncidents.filter(i => i.priority === 'P3').length;

        let overallHealthStatus = 'HEALTHY';
        if (p1Count > 0) overallHealthStatus = 'CRITICAL';
        else if (p2Count > 0 || flappingIncidents.length >= 3) overallHealthStatus = 'DEGRADED';
        else if (p3Count > 0) overallHealthStatus = 'ATTENTION_NEEDED';

        const executiveDigest = {
            timeWindow,
            generatedAt: new Date().toISOString(),
            overallHealthStatus,
            statistics: {
                totalRawLogs: logs.length,
                totalRawAlerts: alerts.length,
                triagedIncidentsCount: triagedIncidents.length,
                breakdown: {
                    p1Critical: p1Count,
                    p2High: p2Count,
                    p3Medium: p3Count,
                    flappingDevices: flappingIncidents.length
                }
            },
            executiveNarrative: `Dalam ${timeWindow} terakhir, sistem memproses ${logs.length} log transisi dan ${alerts.length} alert mentah. Ditemukan ${triagedIncidents.length} insiden unik (${p1Count} Kritis P1, ${p2Count} Tinggi P2, ${flappingIncidents.length} kasus flapping). Kondisi jaringan saat ini berstatus ${overallHealthStatus}.`,
            topNoisyDevices: flappingIncidents.slice(0, 5)
        };

        return {
            digest: executiveDigest,
            incidents: triagedIncidents
        };
    } catch (error) {
        console.error('❌ [Log Triage Engine Error]:', error.message);
        throw error;
    }
};
