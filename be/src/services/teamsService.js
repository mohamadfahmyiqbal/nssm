// services/teamsService.js
import dotenv from 'dotenv';

dotenv.config();

let alertQueue = [];
let dispatchTimeout = null;
const BUFFER_TIME = 30000; // 30 detik untuk menghindari alert storm & EDR detection

/**
 * Flush/Kirim agregat notifikasi ke Microsoft Teams
 */
const flushAlerts = async () => {
    if (alertQueue.length === 0) return;

    // Salin antrean dan kosongkan
    const currentBatch = [...alertQueue];
    alertQueue = [];
    dispatchTimeout = null;

    try {
        const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
        if (!webhookUrl || webhookUrl === 'your-teams-webhook-url-here') {
            console.warn(`⚠️ [Teams Service] TEAMS_WEBHOOK_URL belum diatur. ${currentBatch.length} notifikasi diabaikan.`);
            return;
        }

        const downDevices = currentBatch.filter(a => a.status === 'DOWN');
        const upDevices = currentBatch.filter(a => a.status === 'UP');

        const isMostlyDown = downDevices.length > 0;
        const color = isMostlyDown ? "d9534f" : "28a745";
        const title = `🚨 **MONITORING ALERT: ${currentBatch.length} Kejadian Terdeteksi**`;
        
        let markdownBody = `Waktu Kejadian: **${currentBatch[0].time}**\n\n`;

        if (downDevices.length > 0) {
            markdownBody += `### ❌ PERANGKAT DOWN (${downDevices.length})\n`;
            downDevices.forEach(item => {
                markdownBody += `- **${item.deviceData.HOSTNAME || 'N/A'}** (IP: ${item.deviceData.IP || 'N/A'} | PID: ${item.deviceData.PID || 'N/A'})\n`;
            });
            markdownBody += `\n`;
        }

        if (upDevices.length > 0) {
            markdownBody += `### ✅ PERANGKAT UP (${upDevices.length})\n`;
            upDevices.forEach(item => {
                markdownBody += `- **${item.deviceData.HOSTNAME || 'N/A'}** (IP: ${item.deviceData.IP || 'N/A'} | PID: ${item.deviceData.PID || 'N/A'})\n`;
            });
            markdownBody += `\n`;
        }

        const payload = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": color,
            "summary": `Notifikasi Agregat - ${currentBatch.length} perangkat`,
            "sections": [{
                "activityTitle": title,
                "text": markdownBody,
                "markdown": true
            }]
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log(`💬 [Teams Service] Mengirim ${currentBatch.length} aggregated alert ke Teams.`);
    } catch (error) {
        console.error('❌ [Teams Service Error]: Gagal mengirim notifikasi Teams agregat.', error.message);
    }
};

/**
 * Mendaftarkan notifikasi ke dalam antrean (Batching)
 * @param {Object} deviceData Data perangkat
 * @param {string} time Waktu kejadian
 * @param {string} status 'UP' atau 'DOWN'
 */
export const sendTeamsAlert = (deviceData, time, status = 'DOWN') => {
    alertQueue.push({ deviceData, time, status });
    
    if (!dispatchTimeout) {
        dispatchTimeout = setTimeout(flushAlerts, BUFFER_TIME);
    }
};
