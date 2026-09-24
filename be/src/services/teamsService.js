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
            const rootCauses = downDevices.filter(d => d.rcaInfo?.isRootCause);
            const cascading = downDevices.filter(d => d.rcaInfo?.classification === 'CASCADING_DOWN');
            const isolated = downDevices.filter(d => !d.rcaInfo?.isRootCause && d.rcaInfo?.classification !== 'CASCADING_DOWN');

            if (rootCauses.length > 0) {
                markdownBody += `### 🔥 ROOT CAUSE FAILURES (${rootCauses.length})\n`;
                rootCauses.forEach(item => {
                    const impact = item.rcaInfo?.impactCount ? ` *(Berdampak pada ${item.rcaInfo.impactCount} perangkat turunan)*` : '';
                    markdownBody += `- **[ROOT CAUSE] ${item.deviceData.HOSTNAME || 'N/A'}** (IP: ${item.deviceData.IP || 'N/A'})${impact}\n`;
                });
                markdownBody += `\n`;
            }

            if (cascading.length > 0) {
                markdownBody += `### ⛓️ CASCADING / UNREACHABLE (${cascading.length})\n`;
                cascading.forEach(item => {
                    const parentStr = item.rcaInfo?.rootCauseDevice?.HOSTNAME ? ` *(Akibat: ${item.rcaInfo.rootCauseDevice.HOSTNAME})*` : '';
                    markdownBody += `- ${item.deviceData.HOSTNAME || 'N/A'} (IP: ${item.deviceData.IP || 'N/A'})${parentStr}\n`;
                });
                markdownBody += `\n`;
            }

            if (isolated.length > 0) {
                markdownBody += `### ❌ ISOLATED DOWN (${isolated.length})\n`;
                isolated.forEach(item => {
                    markdownBody += `- ${item.deviceData.HOSTNAME || 'N/A'} (IP: ${item.deviceData.IP || 'N/A'} | PID: ${item.deviceData.PID || 'N/A'})\n`;
                });
                markdownBody += `\n`;
            }
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
 * @param {Object} rcaInfo Informasi Root Cause Analysis
 */
export const sendTeamsAlert = (deviceData, time, status = 'DOWN', rcaInfo = null) => {
    alertQueue.push({ deviceData, time, status, rcaInfo });
    
    if (!dispatchTimeout) {
        dispatchTimeout = setTimeout(flushAlerts, BUFFER_TIME);
    }
};

/**
 * Mengirim notifikasi Berita Acara / Laporan Gangguan IT secara langsung ke MS Teams
 * @param {Object} reportData Data berita acara
 */
export const sendIncidentReportTeamsAlert = async (reportData) => {
    try {
        const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
        if (!webhookUrl || webhookUrl === 'your-teams-webhook-url-here') {
            console.warn('⚠️ [Teams Service] TEAMS_WEBHOOK_URL belum diatur.');
            return { success: false, message: 'Webhook URL belum diatur' };
        }

        const isResolved = reportData.status === 'RESOLVED' || reportData.status === 'CLOSED';
        const color = isResolved ? "28a745" : "d9534f"; // Green jika selesai, Red jika open/in-progress
        const statusBadge = isResolved ? '✅ SELESAI (RESOLVED)' : '⚠️ SEDANG DITANGANI (IN PROGRESS)';

        const devicesList = Array.isArray(reportData.devices) ? reportData.devices : [];
        let deviceSummaryText = '';
        if (devicesList.length > 0) {
            deviceSummaryText = devicesList.map(d => `- **${d.hostname || d.name}** (IP: \`${d.ip || '-'}\`, Lokasi: ${d.location || '-'})`).join('\n');
        } else {
            deviceSummaryText = `- **${reportData.primaryHostname || 'Perangkat IT'}** (IP: \`${reportData.primaryIp || '-'}\`, Lokasi: ${reportData.location || '-'})`;
        }

        const markdownBody = `
### 📋 **BERITA ACARA GANGGUAN PERANGKAT IT**
**Departemen Teknologi Informasi & Infrastruktur**

---
* **No. Laporan:** \`${reportData.reportNumber}\`
* **Status Penanganan:** **${statusBadge}**
* **Tanggal / Waktu Kejadian:** ${reportData.reportDate} | ${reportData.discoveredTime || '-'}
* **Mulai Penanganan:** ${reportData.startTime || '-'}
* **Selesai Penanganan:** ${reportData.endTime || '-'}
* **Total Downtime:** **${reportData.totalDowntime || '-'}**
* **Pelapor / Unit:** ${reportData.reporter || 'Sistem Monitoring IT'}
* **Teknisi Penangan:** **${reportData.assignedTechnician || 'Belum Ditugaskan'}** ${reportData.assignedTechnicianNik ? `(NIK: ${reportData.assignedTechnicianNik})` : ''}

### 🖥️ **Perangkat Terdampak (${devicesList.length || 1} Unit):**
${deviceSummaryText}

${reportData.symptom ? `**Gejala / Keluhan:**\n${reportData.symptom}\n\n` : ''}
${reportData.actionTaken ? `**Tindakan Teknis:**\n${reportData.actionTaken}\n\n` : ''}
${reportData.rootCause ? `**Akar Penyebab (Root Cause):**\n${reportData.rootCause}\n\n` : ''}
---
*Dokumen Berita Acara resmi tersimpan pada sistem NTMS Portal.*
`;

        const payload = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": color,
            "summary": `Berita Acara Insiden: ${reportData.reportNumber}`,
            "sections": [{
                "activityTitle": `📢 **Pemberitahuan Berita Acara IT: ${reportData.reportNumber}**`,
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

        console.log(`💬 [Teams Service] Notifikasi Berita Acara [${reportData.reportNumber}] berhasil dikirim ke MS Teams.`);
        return { success: true };
    } catch (error) {
        console.error('❌ [Teams Service Error]: Gagal mengirim Berita Acara ke Teams.', error.message);
        return { success: false, error: error.message };
    }
};

