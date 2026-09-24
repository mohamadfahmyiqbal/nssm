import DeviceAlert from '../models/DeviceAlert.js';
import DeviceTelemetryLog from '../models/DeviceTelemetryLog.js';
import { sendTeamsAlert } from './teamsService.js';
import { runPredictiveAnalysis } from './predictiveService.js';
import { Op } from 'sequelize';

// State memori untuk melacak status keparahan saat ini per device & metric
// key: `${pid}_${metricType}` -> 'NORMAL' | 'WARNING' | 'CRITICAL'
const deviceSeverityState = new Map();

// In-memory buffer untuk melacak tren RAM (memory leak check)
// key: pid -> array of recent ram values [ram1, ram2, ram3, ...]
const ramHistoryBuffer = new Map();

/**
 * Engine evaluasi ambang batas cerdas dan deteksi anomali
 * @param {Object} device Informasi perangkat (PID, HOSTNAME, IP, TYPE)
 * @param {Object} metrics Objek metrik telemetri yang baru saja diambil
 * @param {Object} io Socket.io instance untuk real-time broadcast
 */
export const evaluateSmartThresholdsAndAnomalies = async (device, metrics, io = null) => {
    if (!device || !device.PID || !metrics) return;

    const pid = device.PID;
    const hostname = device.HOSTNAME || pid;
    const ip = device.IP || '-';

    const parseNum = (v) => {
        if (!v || v === 'N/A' || v === '-') return null;
        const num = parseFloat(String(v).replace(/[^0-9.]/g, ''));
        return isNaN(num) ? null : num;
    };

    const cpu = parseNum(metrics.resources?.cpu);
    const ram = parseNum(metrics.resources?.memory);
    const temp = parseNum(metrics.resources?.temperature || metrics.info?.temperature);
    const trafficInMB = parseNum(metrics.resources?.trafficIn) || 0;
    const trafficOutMB = parseNum(metrics.resources?.trafficOut) || 0;
    const totalTrafficMB = trafficInMB + trafficOutMB;

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Minggu, 6 = Sabtu

    const alertsToTrigger = [];

    // Helper pemicu alert
    const triggerAlert = async (alertType, severity, metricValue, thresholdValue, message) => {
        try {
            const newAlert = await DeviceAlert.create({
                PID: pid,
                HOSTNAME: hostname,
                IP: ip,
                ALERT_TYPE: alertType,
                SEVERITY: severity,
                METRIC_VALUE: metricValue,
                THRESHOLD_VALUE: thresholdValue,
                MESSAGE: message,
                RECORDED_AT: now
            });

            if (io) {
                io.emit('device:smart_alert', {
                    id: newAlert.id,
                    pid,
                    hostname,
                    ip,
                    alertType,
                    severity,
                    metricValue,
                    thresholdValue,
                    message,
                    recordedAt: now.toISOString()
                });
            }

            if (severity === 'CRITICAL') {
                sendTeamsAlert({ PID: pid, HOSTNAME: hostname, IP: ip }, now.toLocaleString(), `[${severity}] ${message}`);
            }
        } catch (err) {
            console.error('⚠️ [Alert Ingestion Error]:', err.message);
        }
    };

    // 1. Evaluasi CPU Severity
    if (cpu !== null) {
        const key = `${pid}_CPU`;
        const currentState = deviceSeverityState.get(key) || 'NORMAL';

        if (cpu >= 90 && currentState !== 'CRITICAL') {
            deviceSeverityState.set(key, 'CRITICAL');
            alertsToTrigger.push({
                type: 'CPU_HIGH',
                severity: 'CRITICAL',
                val: cpu,
                thresh: 90,
                msg: `Beban CPU kritis mencapai ${cpu}% (Batas > 90%)`
            });
        } else if (cpu >= 75 && cpu < 90 && currentState !== 'WARNING' && currentState !== 'CRITICAL') {
            deviceSeverityState.set(key, 'WARNING');
            alertsToTrigger.push({
                type: 'CPU_HIGH',
                severity: 'WARNING',
                val: cpu,
                thresh: 75,
                msg: `Beban CPU tinggi mencapai ${cpu}% (Batas > 75%)`
            });
        } else if (cpu < 70 && (currentState === 'WARNING' || currentState === 'CRITICAL')) {
            deviceSeverityState.set(key, 'NORMAL');
            alertsToTrigger.push({
                type: 'CPU_HIGH',
                severity: 'RECOVERY',
                val: cpu,
                thresh: 70,
                msg: `Beban CPU telah pulih normal di angka ${cpu}%`
            });
        }
    }

    // 2. Evaluasi RAM Severity
    if (ram !== null) {
        const key = `${pid}_RAM`;
        const currentState = deviceSeverityState.get(key) || 'NORMAL';

        if (ram >= 90 && currentState !== 'CRITICAL') {
            deviceSeverityState.set(key, 'CRITICAL');
            alertsToTrigger.push({
                type: 'RAM_HIGH',
                severity: 'CRITICAL',
                val: ram,
                thresh: 90,
                msg: `Penggunaan RAM kritis mencapai ${ram}% (Batas > 90%)`
            });
        } else if (ram >= 80 && ram < 90 && currentState !== 'WARNING' && currentState !== 'CRITICAL') {
            deviceSeverityState.set(key, 'WARNING');
            alertsToTrigger.push({
                type: 'RAM_HIGH',
                severity: 'WARNING',
                val: ram,
                thresh: 80,
                msg: `Penggunaan RAM tinggi mencapai ${ram}% (Batas > 80%)`
            });
        } else if (ram < 75 && (currentState === 'WARNING' || currentState === 'CRITICAL')) {
            deviceSeverityState.set(key, 'NORMAL');
            alertsToTrigger.push({
                type: 'RAM_HIGH',
                severity: 'RECOVERY',
                val: ram,
                thresh: 75,
                msg: `Penggunaan RAM telah pulih normal di angka ${ram}%`
            });
        }

        // Anomaly: Deteksi Indikasi Memory Leak (Naik terus tanpa turun selama 5 polling)
        let ramBuf = ramHistoryBuffer.get(pid) || [];
        ramBuf.push(ram);
        if (ramBuf.length > 5) ramBuf.shift();
        ramHistoryBuffer.set(pid, ramBuf);

        if (ramBuf.length === 5) {
            const isMonotonicIncrease = ramBuf.every((val, i) => i === 0 || val > ramBuf[i - 1]);
            const totalDelta = ramBuf[4] - ramBuf[0];
            if (isMonotonicIncrease && totalDelta >= 10 && ram > 65) {
                alertsToTrigger.push({
                    type: 'ANOMALY_MEMORY_LEAK',
                    severity: 'WARNING',
                    val: ram,
                    thresh: totalDelta,
                    msg: `Indikasi Memory Leak: RAM terus meningkat berturut-turut (${ramBuf.join('% -> ')}%)`
                });
                ramHistoryBuffer.set(pid, [ram]); // Reset buffer agar tidak spamming
            }
        }
    }

    // 3. Evaluasi Suhu (Temperature)
    if (temp !== null) {
        const key = `${pid}_TEMP`;
        const currentState = deviceSeverityState.get(key) || 'NORMAL';

        if (temp >= 65 && currentState !== 'CRITICAL') {
            deviceSeverityState.set(key, 'CRITICAL');
            alertsToTrigger.push({
                type: 'TEMP_HIGH',
                severity: 'CRITICAL',
                val: temp,
                thresh: 65,
                msg: `Suhu perangkat overheat di ${temp}°C (Batas > 65°C)`
            });
        } else if (temp >= 55 && temp < 65 && currentState !== 'WARNING' && currentState !== 'CRITICAL') {
            deviceSeverityState.set(key, 'WARNING');
            alertsToTrigger.push({
                type: 'TEMP_HIGH',
                severity: 'WARNING',
                val: temp,
                thresh: 55,
                msg: `Suhu perangkat meningkat di ${temp}°C (Batas > 55°C)`
            });
        } else if (temp < 50 && (currentState === 'WARNING' || currentState === 'CRITICAL')) {
            deviceSeverityState.set(key, 'NORMAL');
            alertsToTrigger.push({
                type: 'TEMP_HIGH',
                severity: 'RECOVERY',
                val: temp,
                thresh: 50,
                msg: `Suhu perangkat telah normal di ${temp}°C`
            });
        }
    }

    // 4. Deteksi Anomali: Lonjakan Trafik Luar Jam Kerja (19:00 - 06:00 atau Weekend)
    const isOffHours = currentHour >= 19 || currentHour < 6 || currentDay === 0 || currentDay === 6;
    if (isOffHours && totalTrafficMB > 100) { // Threshold > 100MB saat di luar jam kerja
        alertsToTrigger.push({
            type: 'ANOMALY_OFF_HOURS_TRAFFIC',
            severity: 'WARNING',
            val: totalTrafficMB,
            thresh: 100,
            msg: `Lonjakan trafik tidak biasa di luar jam operasional (${totalTrafficMB.toFixed(1)} MB pada jam ${currentHour}:00)`
        });
    }

    // 5. Machine Learning Predictive Analysis & Dynamic Z-Score Anomalies
    const predResult = await runPredictiveAnalysis(pid, { cpu, ram, temp });
    if (predResult) {
        // Peringatan Dini Prediksi Suhu Overheat
        const tempPred = predResult.predictions?.temperature;
        if (tempPred && tempPred.predictedMinutesToCritical !== null && tempPred.predictedMinutesToCritical <= 60 && tempPred.confidenceR2 >= 0.5) {
            alertsToTrigger.push({
                type: 'PREDICTIVE_TEMP_OVERHEAT',
                severity: 'WARNING',
                val: temp,
                thresh: tempPred.predictedMinutesToCritical,
                msg: `Peringatan Dini Prediktif (ML): Berdasarkan tren regresi, suhu diperkirakan mencapai >65°C dalam ~${tempPred.predictedMinutesToCritical} menit (Confidence R²: ${tempPred.confidenceR2})`
            });
        }

        // Anomali Statistik CPU Dinamis
        if (predResult.statisticalAnomalies?.cpu?.isAnomaly && Math.abs(predResult.statisticalAnomalies.cpu.zScore) >= 3.0) {
            alertsToTrigger.push({
                type: 'ANOMALY_STATISTICAL_CPU',
                severity: 'WARNING',
                val: cpu,
                thresh: predResult.statisticalAnomalies.cpu.zScore,
                msg: `Anomali Statistik ML: Pola penggunaan CPU melonjak drastis menyimpang ${predResult.statisticalAnomalies.cpu.zScore}σ dari rata-rata historisnya`
            });
        }

        // Broadcast real-time Predictive & Health Score
        if (io) {
            io.emit('device:predictive_health', {
                pid,
                hostname,
                ip,
                health: predResult.health,
                predictions: predResult.predictions,
                statisticalAnomalies: predResult.statisticalAnomalies
            });
        }
    }

    // Eksekusi trigger seluruh alert
    for (const a of alertsToTrigger) {
        await triggerAlert(a.type, a.severity, a.val, a.thresh, a.msg);
    }
};
