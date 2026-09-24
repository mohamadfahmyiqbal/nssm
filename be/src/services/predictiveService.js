// services/predictiveService.js
/**
 * Predictive Maintenance & Statistical Machine Learning Engine
 * Murni in-memory math & statistical computation O(N), 100% EDR-Safe (Cybereason compliant).
 */

import DeviceTelemetryLog from '../models/DeviceTelemetryLog.js';
import { Op } from 'sequelize';

/**
 * Menghitung Regresi Linear Sederhana (Ordinary Least Squares) pada deret waktu
 * @param {Array<{ x: number, y: number }>} data Points data (x: timestamp/urutan, y: nilai metrik)
 * @returns {{ slope: number, intercept: number, r2: number }}
 */
export const calculateLinearRegression = (data = []) => {
    const n = data.length;
    if (n < 3) return { slope: 0, intercept: 0, r2: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

    for (let i = 0; i < n; i++) {
        const { x, y } = data[i];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
        sumY2 += y * y;
    }

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    // Hitung koefisien determinasi (R^2)
    const yMean = sumY / n;
    let ssTot = 0, ssRes = 0;
    for (let i = 0; i < n; i++) {
        const { x, y } = data[i];
        const yPred = slope * x + intercept;
        ssTot += Math.pow(y - yMean, 2);
        ssRes += Math.pow(y - yPred, 2);
    }
    const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - (ssRes / ssTot));

    return { slope, intercept, r2 };
};

/**
 * Deteksi Anomali Dinamis menggunakan Z-Score Statistik
 * @param {Array<number>} history Deret nilai historis
 * @param {number} currentValue Nilai saat ini
 * @param {number} thresholdZ Batas Z-Score (default 2.5 sigma)
 * @returns {{ isAnomaly: boolean, zScore: number, mean: number, stdDev: number }}
 */
export const detectZScoreAnomaly = (history = [], currentValue, thresholdZ = 2.5) => {
    if (history.length < 5 || currentValue === null || currentValue === undefined) {
        return { isAnomaly: false, zScore: 0, mean: currentValue || 0, stdDev: 0 };
    }

    const n = history.length;
    const mean = history.reduce((acc, val) => acc + val, 0) / n;
    const variance = history.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) {
        return { isAnomaly: false, zScore: 0, mean, stdDev: 0 };
    }

    const zScore = (currentValue - mean) / stdDev;
    const isAnomaly = Math.abs(zScore) >= thresholdZ;

    return { isAnomaly, zScore: Number(zScore.toFixed(2)), mean: Number(mean.toFixed(2)), stdDev: Number(stdDev.toFixed(2)) };
};

/**
 * Memprediksi Sisa Waktu (Time-to-Threshold) hingga metrik mencapai batas kritis
 * @param {Array<{ x: number, y: number }>} data Points data
 * @param {number} criticalThreshold Nilai ambang batas kritis (misal Suhu 70°C, RAM 90%)
 * @param {number} currentX Waktu saat ini (ms)
 * @returns {{ predictedTimeToThresholdMinutes: number | null, trend: 'INCREASING' | 'DECREASING' | 'STABLE', r2: number }}
 */
export const predictTimeToThreshold = (data = [], criticalThreshold, currentX = Date.now()) => {
    const { slope, intercept, r2 } = calculateLinearRegression(data);

    // Jika tren stabil atau slope mendekati 0 atau R^2 sangat rendah
    if (Math.abs(slope) < 0.0000001 || r2 < 0.3) {
        return {
            predictedTimeToThresholdMinutes: null,
            trend: 'STABLE',
            r2: Number(r2.toFixed(2))
        };
    }

    const trend = slope > 0 ? 'INCREASING' : 'DECREASING';

    // Jika tren naik menuju batas atas kritis (misal suhu naik menuju 70°C)
    if (slope > 0) {
        const targetX = (criticalThreshold - intercept) / slope;
        const deltaMs = targetX - currentX;
        const deltaMinutes = deltaMs / (1000 * 60);

        if (deltaMinutes > 0 && deltaMinutes <= 1440) { // Hanya estimasi jika dalam rentang 24 jam ke depan
            return {
                predictedTimeToThresholdMinutes: Math.round(deltaMinutes),
                trend,
                r2: Number(r2.toFixed(2))
            };
        }
    }

    return {
        predictedTimeToThresholdMinutes: null,
        trend,
        r2: Number(r2.toFixed(2))
    };
};

/**
 * Menghitung Health Score Komposit (0 - 100%) untuk Perangkat
 * @param {Object} latestMetrics Metrik terkini (CPU, RAM, Temp, Status)
 * @param {Object} anomalyResults Hasil deteksi anomali statistik
 * @returns {{ healthScore: number, grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'CRITICAL', deductions: Array<string> }}
 */
export const calculateHealthScore = (latestMetrics = {}, anomalyResults = {}) => {
    let score = 100;
    const deductions = [];

    const cpu = latestMetrics.cpu || 0;
    const ram = latestMetrics.ram || 0;
    const temp = latestMetrics.temp || 0;

    // 1. Penalti CPU
    if (cpu > 90) {
        score -= 30;
        deductions.push('Beban CPU ekstrem (>90%)');
    } else if (cpu > 75) {
        score -= 15;
        deductions.push('Beban CPU tinggi (>75%)');
    }

    // 2. Penalti RAM
    if (ram > 90) {
        score -= 25;
        deductions.push('Konsumsi RAM kritis (>90%)');
    } else if (ram > 80) {
        score -= 10;
        deductions.push('Konsumsi RAM tinggi (>80%)');
    }

    // 3. Penalti Suhu
    if (temp > 65) {
        score -= 30;
        deductions.push('Suhu perangkat overheat (>65°C)');
    } else if (temp > 55) {
        score -= 15;
        deductions.push('Suhu perangkat hangat (>55°C)');
    }

    // 4. Penalti Anomali Statistik (Z-Score)
    if (anomalyResults.cpuAnomaly?.isAnomaly) {
        score -= 10;
        deductions.push(`Penyimpangan CPU statistik (Z: ${anomalyResults.cpuAnomaly.zScore})`);
    }
    if (anomalyResults.tempAnomaly?.isAnomaly) {
        score -= 10;
        deductions.push(`Penyimpangan Suhu statistik (Z: ${anomalyResults.tempAnomaly.zScore})`);
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    let grade = 'EXCELLENT';
    if (score < 40) grade = 'CRITICAL';
    else if (score < 70) grade = 'FAIR';
    else if (score < 85) grade = 'GOOD';

    return { healthScore: score, grade, deductions };
};

/**
 * Melakukan Analisis Lengkap Prediktif & Anomali ML untuk Satu Perangkat
 * @param {string} pid Identitas unik perangkat
 * @param {Object} currentMetrics Metrik terkini { cpu, ram, temp }
 * @returns {Promise<Object>}
 */
export const runPredictiveAnalysis = async (pid, currentMetrics = {}) => {
    try {
        // Ambil 30 record telemetri terakhir
        const logs = await DeviceTelemetryLog.findAll({
            where: { PID: pid },
            order: [['RECORDED_AT', 'ASC']],
            limit: 30
        });

        const cpuSeries = [];
        const ramSeries = [];
        const tempSeries = [];

        logs.forEach((log) => {
            const time = new Date(log.RECORDED_AT).getTime();
            if (log.CPU_USAGE !== null) cpuSeries.push({ x: time, y: Number(log.CPU_USAGE) });
            if (log.RAM_USAGE !== null) ramSeries.push({ x: time, y: Number(log.RAM_USAGE) });
            if (log.TEMPERATURE !== null) tempSeries.push({ x: time, y: Number(log.TEMPERATURE) });
        });

        // Masukkan data terkini jika ada
        const now = Date.now();
        if (currentMetrics.cpu !== undefined && currentMetrics.cpu !== null) cpuSeries.push({ x: now, y: currentMetrics.cpu });
        if (currentMetrics.ram !== undefined && currentMetrics.ram !== null) ramSeries.push({ x: now, y: currentMetrics.ram });
        if (currentMetrics.temp !== undefined && currentMetrics.temp !== null) tempSeries.push({ x: now, y: currentMetrics.temp });

        // 1. Prediksi Time-to-Failure
        const tempForecast = predictTimeToThreshold(tempSeries, 65, now);
        const ramForecast = predictTimeToThreshold(ramSeries, 90, now);
        const cpuForecast = predictTimeToThreshold(cpuSeries, 90, now);

        // 2. Deteksi Anomali Z-Score Dinamis
        const cpuValues = cpuSeries.map(p => p.y);
        const tempValues = tempSeries.map(p => p.y);
        const ramValues = ramSeries.map(p => p.y);

        const cpuAnomaly = detectZScoreAnomaly(cpuValues.slice(0, -1), currentMetrics.cpu);
        const tempAnomaly = detectZScoreAnomaly(tempValues.slice(0, -1), currentMetrics.temp);
        const ramAnomaly = detectZScoreAnomaly(ramValues.slice(0, -1), currentMetrics.ram);

        // 3. Health Score
        const health = calculateHealthScore(currentMetrics, { cpuAnomaly, tempAnomaly, ramAnomaly });

        return {
            pid,
            timestamp: new Date().toISOString(),
            health,
            predictions: {
                temperature: {
                    criticalThreshold: 65,
                    predictedMinutesToCritical: tempForecast.predictedTimeToThresholdMinutes,
                    trend: tempForecast.trend,
                    confidenceR2: tempForecast.r2
                },
                ram: {
                    criticalThreshold: 90,
                    predictedMinutesToCritical: ramForecast.predictedTimeToThresholdMinutes,
                    trend: ramForecast.trend,
                    confidenceR2: ramForecast.r2
                },
                cpu: {
                    criticalThreshold: 90,
                    predictedMinutesToCritical: cpuForecast.predictedTimeToThresholdMinutes,
                    trend: cpuForecast.trend,
                    confidenceR2: cpuForecast.r2
                }
            },
            statisticalAnomalies: {
                cpu: cpuAnomaly,
                temperature: tempAnomaly,
                ram: ramAnomaly
            }
        };
    } catch (error) {
        console.error(`⚠️ [Predictive Service Error] on PID ${pid}:`, error.message);
        return null;
    }
};
