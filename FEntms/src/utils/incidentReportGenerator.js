import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate PDF Laporan Penanganan Gangguan IT sesuai template resmi
 */
export const generateIncidentReportPDF = (data = {}) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const primaryColor = [15, 23, 42]; // slate-900
    const accentColor = [37, 99, 235]; // blue-600
    const lightBg = [248, 250, 252];
    const borderColor = [203, 213, 225];

    const todayStr = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const reportNumber = data.reportNumber || `INC-${Date.now().toString().slice(-6)}`;

    // ==========================================
    // 1. HEADER DOKUMEN
    // ==========================================
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('LAPORAN PENANGANAN ANOMALI / GANGGUAN PERANGKAT IT', 105, 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Departemen Teknologi Informasi & Infrastruktur', 105, 16, { align: 'center' });

    // Meta Info (Nomor & Tanggal)
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`No. Laporan: ${reportNumber}`, 14, 31);
    doc.text(`Tanggal: ${data.date || todayStr}`, 155, 31);

    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.line(14, 34, 196, 34);

    let startY = 38;

    // Helper Section Header
    const drawSectionHeader = (title, y) => {
        doc.setFillColor(241, 245, 249);
        doc.rect(14, y, 182, 6, 'F');
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(title, 16, y + 4.2);
        return y + 7.5;
    };

    // ==========================================
    // I. INFORMASI UMUM INSIDEN
    // ==========================================
    startY = drawSectionHeader('I. Informasi Umum Insiden', startY);

    const infoRows = [
        ['Nama Pelapor / Unit:', data.reporter || 'Sistem Monitoring (Auto)', 'Waktu Ditemukan:', data.discoveredTime || new Date().toLocaleTimeString('id-ID')],
        ['Mulai Penanganan:', data.startTime || new Date().toLocaleTimeString('id-ID'), 'Selesai Penanganan:', data.endTime || 'Sedang Ditangani'],
        ['Total Downtime:', data.totalDowntime || '-', 'Status Akhir:', data.finalStatus || 'IN PROGRESS / RESOLVED']
    ];

    autoTable(doc, {
        startY: startY,
        body: infoRows,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1.5, textColor: [30, 41, 59] },
        columnStyles: {
            0: { fontStyle: 'bold', width: 38 },
            1: { width: 53 },
            2: { fontStyle: 'bold', width: 38 },
            3: { width: 53 }
        },
        margin: { left: 14, right: 14 }
    });

    startY = (doc.lastAutoTable?.finalY || 60) + 3;

    // ==========================================
    // II. DETAIL PERANGKAT TERDAMPAK
    // ==========================================
    startY = drawSectionHeader('II. Detail Perangkat Terdampak', startY);

    const selectedDevicesList = Array.isArray(data.devicesList) && data.devicesList.length > 0
        ? data.devicesList
        : [{
            hostname: data.hostname || 'Device',
            ip: data.ip || '-',
            deviceType: data.deviceType || 'Switch / Network Node',
            vendor: data.vendor || 'Generic',
            serialNumber: data.serialNumber || '-',
            location: data.location || data.floor || 'Server Room / Rack'
        }];

    if (selectedDevicesList.length > 1) {
        // Tampilkan format tabel rapi untuk multi perangkat
        const multiDeviceRows = selectedDevicesList.map((dev, idx) => [
            String(idx + 1),
            dev.hostname || dev.name || '-',
            dev.ip || '-',
            `${dev.vendor || 'Generic'} (${dev.deviceType || dev.type || 'Switch'})`,
            dev.serialNumber || dev.mac || '-',
            dev.location || dev.floor || 'Server Room'
        ]);

        autoTable(doc, {
            startY: startY,
            head: [['No', 'Hostname / Label', 'IP Address', 'Merk / Tipe', 'S/N / MAC', 'Lokasi']],
            body: multiDeviceRows,
            theme: 'grid',
            headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 7.5, cellPadding: 1.8 },
            styles: { fontSize: 7, cellPadding: 1.5, textColor: [30, 41, 59] },
            columnStyles: {
                0: { width: 8, halign: 'center' },
                1: { width: 38, fontStyle: 'bold' },
                2: { width: 30 },
                3: { width: 38 },
                4: { width: 34 },
                5: { width: 34 }
            },
            margin: { left: 14, right: 14 }
        });
    } else {
        // Format single device klasik
        const singleDev = selectedDevicesList[0];
        const deviceRows = [
            ['Jenis Perangkat:', singleDev.deviceType || singleDev.type || 'Switch / Network Node', 'Merk / Tipe:', singleDev.vendor || 'Cisco / Generic'],
            ['Nomor Seri (S/N):', singleDev.serialNumber || singleDev.mac || '-', 'Hostname / IP:', `${singleDev.hostname || singleDev.name || 'Device'} (${singleDev.ip || '-'})`],
            ['Lokasi / Ruangan:', singleDev.location || singleDev.floor || 'Server Room / Rack', '', '']
        ];

        autoTable(doc, {
            startY: startY,
            body: deviceRows,
            theme: 'plain',
            styles: { fontSize: 8, cellPadding: 1.5, textColor: [30, 41, 59] },
            columnStyles: {
                0: { fontStyle: 'bold', width: 38 },
                1: { width: 53 },
                2: { fontStyle: 'bold', width: 38 },
                3: { width: 53 }
            },
            margin: { left: 14, right: 14 }
        });
    }

    startY = (doc.lastAutoTable?.finalY || startY + 20) + 3;

    // ==========================================
    // III. DESKRIPSI GANGGUAN & GEJALA
    // ==========================================
    startY = drawSectionHeader('III. Deskripsi Gangguan & Gejala (Symptom)', startY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Keluhan Utama:', 14, startY + 3);
    doc.setFont('helvetica', 'normal');
    doc.text(data.symptom || '-', 14, startY + 7);

    doc.setFont('helvetica', 'bold');
    doc.text('Dampak Layanan (Impact):', 14, startY + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(data.impact || '-', 14, startY + 17);

    // Checklist Sumber Informasi
    doc.setFont('helvetica', 'bold');
    doc.text('Sumber Informasi Gangguan:', 14, startY + 23);
    doc.setFont('helvetica', 'normal');
    const sourceInfo = data.sourceInfo || 'Sistem Monitoring (SNMP/Alert)';
    doc.text(
        `[ ${sourceInfo.includes('User') ? 'X' : ' '} ] Laporan User         [ ${sourceInfo.includes('Monitoring') ? 'X' : ' '} ] Sistem Monitoring (SNMP/Alert)         [ ${sourceInfo.includes('Rutin') ? 'X' : ' '} ] Pengecekan Rutin`, 
        58, 
        startY + 23
    );

    startY = startY + 28;

    // ==========================================
    // IV. ANALISA & LANGKAH PENANGANAN
    // ==========================================
    startY = drawSectionHeader('IV. Analisa & Langkah Penanganan (Troubleshooting)', startY);

    const troubleshootingRows = [
        ['1. Cek Awal / Isolasi', data.initialCheck || '-', data.startTime || 'WIB'],
        ['2. Diagnosa Teknis', data.diagnosis || '-', 'In Progress'],
        ['3. Perbaikan / Recovery', data.actionTaken || '-', data.endTime || 'Selesai']
    ];

    autoTable(doc, {
        startY: startY,
        head: [['Tahapan', 'Aksi / Tindakan Teknis yang Dilakukan', 'Waktu / Status']],
        body: troubleshootingRows,
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 8, cellPadding: 1.8 },
        styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
        columnStyles: {
            0: { fontStyle: 'bold', width: 32 },
            1: { width: 110 },
            2: { width: 40 }
        },
        margin: { left: 14, right: 14 }
    });

    startY = (doc.lastAutoTable?.finalY || startY + 25) + 3;

    // ==========================================
    // V. ROOT CAUSE & VI. TINDAK LANJUT
    // ==========================================
    startY = drawSectionHeader('V. Root Cause (Akar Penyebab) & VI. Tindak Lanjut', startY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Akar Penyebab Utama (RCA):', 14, startY + 3);
    doc.setFont('helvetica', 'normal');
    doc.text(data.rootCause || '-', 14, startY + 7);

    doc.setFont('helvetica', 'bold');
    doc.text('Rekomendasi & Tindak Lanjut Pencegahan:', 14, startY + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(data.preventiveAction ? `Tindakan: ${data.preventiveAction}` : '[   ] Penjadwalan maintenance berkala     [   ] Peningkatan alert threshold     [   ] Penggantian backup unit', 14, startY + 18);

    startY = startY + 24;

    // ==========================================
    // VII. VALIDASI & PERSETUJUAN (SIGNATURES)
    // ==========================================
    startY = drawSectionHeader('VII. Validasi & Persetujuan', startY);

    let techName = '\n\n\n______________________';
    if (data.assignedTechnician) {
        const names = data.assignedTechnician.split(',').map(s => s.trim()).filter(Boolean);
        if (names.length === 1) {
            techName = `\n\n\n(${names[0]})`;
        } else if (names.length > 1) {
            techName = `\n\n${names.map(n => `• ${n}`).join('\n')}`;
        }
    }
    const reporterName = data.reporter ? `\n\n\n(${data.reporter})` : '\n\n\n______________________';

    const sigTableBody = [
        ['Dilaporkan Oleh:', 'Ditangani Oleh:', 'Diketahui Oleh:', 'Disetujui Oleh:'],
        [reporterName, techName, '\n\n\n______________________', '\n\n\n______________________'],
        ['PIC Pelaporan', 'Tim Teknisi / Staff IT', 'Section Head IT', 'Dept Head IT']
    ];

    autoTable(doc, {
        startY: startY,
        body: sigTableBody,
        theme: 'plain',
        styles: {
            fontSize: 7.5,
            cellPadding: 1,
            alignment: 'center',
            textColor: [30, 41, 59],
            halign: 'center'
        },
        columnStyles: {
            0: { width: 45.5 },
            1: { width: 45.5 },
            2: { width: 45.5 },
            3: { width: 45.5 }
        },
        margin: { left: 14, right: 14 }
    });

    // Output / Download PDF
    const filename = `Laporan_Gangguan_${(data.hostname || 'IT').replace(/\s+/g, '_')}_${Date.now().toString().slice(-6)}.pdf`;
    doc.save(filename);
};
