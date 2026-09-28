import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Helper untuk load image ke HTMLImageElement / Base64
 */
const loadImage = (url) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
    });
};

/**
 * Generate PDF Formulir Permohonan Perbaikan Perangkat IT & Berita Acara (F-PIK-IT-093-Rev.00)
 * Format Enterprise lengkap: Kop Resmi, Logo Koito PNG, Data Pemohon, Tiket, Kategori, Downtime, Sparepart, Root Cause & Dual-Layer Approval
 * @param {Object} data - Data lengkap berita acara / insiden
 */
export const generateIncidentReportPDF = async (data = {}) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const mLeft = 12;
    const mRight = 198;
    const contentW = mRight - mLeft; // 186mm

    const todayStr = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const reportNumber = data.reportNumber || data.id || `INC-${Date.now().toString().slice(-6)}`;
    const tglPengajuan = data.date || todayStr;

    // Hilangkan teks default Sistem Monitoring IT (Auto) jika belum diisi user
    let rawReporter = data.reporter || data.reporterName || '';
    if (rawReporter.includes('Sistem Monitoring') || rawReporter.includes('(Auto)')) {
        rawReporter = '';
    }
    const reporterName = rawReporter.trim() || ' ';
    const reporterNik = data.reporterNik || ' ';
    const reporterJabatan = data.reporterJabatan || data.jabatan || ' ';
    const reporterDept = data.reporterDept || data.dept || ' ';

    const techName = data.assignedTechnician ? data.assignedTechnician.split(',')[0].trim() : 'Staff IT';
    const priority = (data.severity || data.priority || 'HIGH').toUpperCase();
    const category = (data.category || data.deviceType || 'NETWORK').toUpperCase();

    // 1. OUTER BORDER DOKUMEN
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(mLeft, 8, contentW, 280);

    // ==========================================
    // 2. HEADER KOP SURAT (Logo Koito PNG + Judul Form + No. Tiket)
    // ==========================================
    doc.line(mLeft, 23, mRight, 23);
    doc.line(mLeft + 38, 8, mLeft + 38, 23);
    doc.line(mRight - 42, 8, mRight - 42, 23);

    // Box Kiri: Gambar Logo KOITO.png dari public/
    try {
        const logoImg = await loadImage('/KOITO.png');
        if (logoImg) {
            doc.addImage(logoImg, 'PNG', mLeft + 4, 9.5, 30, 9);
        } else {
            // Fallback teks jika gambar gagal dimuat
            doc.setTextColor(220, 38, 38);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.text('KOITO', mLeft + 19, 14.5, { align: 'center' });
        }
    } catch (e) {
        doc.setTextColor(220, 38, 38);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('KOITO', mLeft + 19, 14.5, { align: 'center' });
    }

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('PT.Indonesia Koito', mLeft + 19, 21, { align: 'center' });

    // Box Tengah: Judul Form
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('FORMULIR PERMOHONAN PERBAIKAN', (mLeft + 38 + mRight - 42) / 2, 14, { align: 'center' });
    doc.text('PERANGKAT IT', (mLeft + 38 + mRight - 42) / 2, 19, { align: 'center' });

    // Box Kanan: Nomor Tiket & Prioritas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('NO. TIKET / INC:', mRight - 40, 12.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(reportNumber, mRight - 40, 16.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Prioritas: ${priority}`, mRight - 40, 20.5);

    // ==========================================
    // 3. SECTION: DATA PEMOHON
    // ==========================================
    doc.setFillColor(0, 0, 0);
    doc.rect(mLeft, 23, contentW, 5.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DATA PEMOHON', mLeft + 3, 27);

    doc.setDrawColor(0, 0, 0);
    doc.line(mLeft, 44, mRight, 44);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    // Kolom Kiri
    doc.text('NIK', mLeft + 5, 33);
    doc.text(':', mLeft + 25, 33);
    doc.text(reporterNik, mLeft + 28, 33);

    doc.text('NAMA', mLeft + 5, 38.5);
    doc.text(':', mLeft + 25, 38.5);
    doc.text(reporterName, mLeft + 28, 38.5);

    // Kolom Tengah
    const colMidX = mLeft + 75;
    doc.text('TGL PENGAJUAN', colMidX, 33);
    doc.text(':', colMidX + 26, 33);
    doc.text(tglPengajuan, colMidX + 29, 33);

    doc.text('JAM TERDETEKSI', colMidX, 38.5);
    doc.text(':', colMidX + 26, 38.5);
    doc.text(data.discoveredTime || '08:00 WIB', colMidX + 29, 38.5);

    // Kolom Kanan
    const colRightX = mLeft + 138;
    doc.text('JABATAN', colRightX, 33);
    doc.text(':', colRightX + 16, 33);
    doc.text(reporterJabatan, colRightX + 19, 33);

    doc.text('DEPT', colRightX, 38.5);
    doc.text(':', colRightX + 16, 38.5);
    doc.text(reporterDept, colRightX + 19, 38.5);

    // ==========================================
    // 4. SECTION: ALASAN PERBAIKAN & DETAIL GANGGUAN
    // ==========================================
    doc.setFillColor(0, 0, 0);
    doc.rect(mLeft, 44, contentW, 5.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('ALASAN PERBAIKAN : ( Diisi oleh Pemohon )', mLeft + 3, 48);

    doc.line(mLeft, 137, mRight, 137);

    // Kategori Insiden & Sumber Informasi
    doc.setTextColor(0, 0, 0);
    let curY = 53.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Kategori Abnormal:', mLeft + 5, curY);

    doc.setFont('helvetica', 'normal');
    const isHw = category.includes('HARDWARE') || category.includes('SWITCH') || category.includes('NVR');
    const isSw = category.includes('SOFTWARE') || category.includes('OS');
    const isNet = category.includes('NETWORK') || category.includes('KONEKSI') || (!isHw && !isSw);
    doc.text(
        `[ ${isHw ? 'X' : ' '} ] Hardware / Perangkat Fisik       Jaringan / Network       [ ${isSw ? 'X' : ' '} ] Software / Sistem`,
        mLeft + 32,
        curY
    );
    curY += 4.5;

    // Detail Perangkat Terdampak
    const devList = Array.isArray(data.devicesList) && data.devicesList.length > 0
        ? data.devicesList
        : [{
            hostname: data.hostname || data.name || 'Perangkat IT',
            ip: data.ip || ' ',
            deviceType: data.deviceType || data.type || 'Switch / Node',
            vendor: data.vendor || 'Generic',
            location: data.location || data.floor || 'Server Room / Office',
            serialNumber: data.serialNumber || ' '
        }];

    doc.setFont('helvetica', 'bold');
    doc.text('Perangkat Terdampak:', mLeft + 5, curY);
    curY += 4;

    doc.setFont('helvetica', 'normal');
    devList.forEach((d, idx) => {
        if (idx < 2) {
            const devInfo = `• ${d.hostname || d.name} (IP: ${d.ip || ' '}, Tipe: ${d.vendor || ''} ${d.deviceType || d.type || ''}, S/N: ${d.serialNumber || ' '}, Lokasi: ${d.location || d.floor || ' '})`;
            doc.text(devInfo, mLeft + 8, curY);
            curY += 3.8;
        }
    });
    if (devList.length > 2) {
        doc.text(`  ...dan ${devList.length - 2} perangkat lainnya terdaftar dalam insiden ini.`, mLeft + 8, curY);
        curY += 3.8;
    }

    curY += 1;
    doc.setFont('helvetica', 'bold');
    doc.text('Uraian Gejala / Kendala:', mLeft + 5, curY);
    curY += 4;

    doc.setFont('helvetica', 'normal');
    const symptomText = data.symptom || 'Perangkat mengalami kegagalan fungsi / koneksi terputus.';
    const splitSymptom = doc.splitTextToSize(symptomText, contentW - 12);
    doc.text(splitSymptom, mLeft + 8, curY);
    curY += splitSymptom.length * 3.8 + 1.5;

    if (data.impact) {
        doc.setFont('helvetica', 'bold');
        doc.text('Dampak Operasional:', mLeft + 5, curY);
        curY += 4;
        doc.setFont('helvetica', 'normal');
        const splitImpact = doc.splitTextToSize(data.impact, contentW - 12);
        doc.text(splitImpact, mLeft + 8, curY);
    }

    // ==========================================
    // BOX APPROVAL TAHAP 1 (Alur: Pemohon -> Dept.head Pemohon)
    // ==========================================
    const boxApprovalY = 99;
    const colBoxW = 55;

    // Box Kiri: Pemohon & Dept.Head Pemohon
    doc.rect(mLeft + 6, boxApprovalY, colBoxW, 23);
    doc.line(mLeft + 6, boxApprovalY + 6, mLeft + 6 + colBoxW, boxApprovalY + 6);
    doc.line(mLeft + 6 + (colBoxW / 2), boxApprovalY, mLeft + 6 + (colBoxW / 2), boxApprovalY + 23);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Pemohon', mLeft + 6 + (colBoxW / 4), boxApprovalY + 4.2, { align: 'center' });
    doc.text('Dept.Head', mLeft + 6 + (colBoxW * 3 / 4), boxApprovalY + 4.2, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`(${reporterName})`, mLeft + 6 + (colBoxW / 4), boxApprovalY + 20, { align: 'center' });
    doc.text('( .................... )', mLeft + 6 + (colBoxW * 3 / 4), boxApprovalY + 20, { align: 'center' });

    // Box Kanan: PIC IT & IT Dept. Head
    const boxKananX = mRight - 6 - colBoxW;
    doc.rect(boxKananX, boxApprovalY, colBoxW, 23);
    doc.line(boxKananX, boxApprovalY + 6, boxKananX + colBoxW, boxApprovalY + 6);
    doc.line(boxKananX + (colBoxW / 2), boxApprovalY, boxKananX + (colBoxW / 2), boxApprovalY + 23);

    doc.setFont('helvetica', 'bold');
    doc.text('PIC IT', boxKananX + (colBoxW / 4), boxApprovalY + 4.2, { align: 'center' });
    doc.text('IT Dept. Head', boxKananX + (colBoxW * 3 / 4), boxApprovalY + 4.2, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.text(`(${techName})`, boxKananX + (colBoxW / 4), boxApprovalY + 20, { align: 'center' });
    doc.text('( .................... )', boxKananX + (colBoxW * 3 / 4), boxApprovalY + 20, { align: 'center' });

    // Keterangan Alur Approval
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text('Alur Approval permohonan : Pemohon -> Dept.head Pemohon', mLeft + 6, boxApprovalY + 28);

    // ==========================================
    // 5. SECTION: TINDAKAN PERBAIKAN & AUDIT TEKNIS
    // ==========================================
    doc.setFillColor(0, 0, 0);
    doc.rect(mLeft, 137, contentW, 5.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('TINDAKAN ANALISA & PERBAIKAN : ( Di isi oleh PIK IT )', mLeft + 3, 141);

    // Checkbox Sementara / Permanen & Waktu Penanganan
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);

    const isPermanent = data.status === 'RESOLVED' || data.status === 'CLOSED';

    // Checkbox 1: Sementara
    doc.setLineWidth(0.4);
    doc.rect(mLeft + 6, 146, 3.5, 3.5);
    if (!isPermanent) {
        doc.text('X', mLeft + 6.8, 148.8);
    }
    doc.text('Sementara (Temporary)', mLeft + 11.5, 148.8);

    // Checkbox 2: Permanen
    doc.rect(mLeft + 52, 146, 3.5, 3.5);
    if (isPermanent) {
        doc.text('X', mLeft + 52.8, 148.8);
    }
    doc.text('Permanen', mLeft + 57.5, 148.8);

    // Metadata Waktu & Downtime
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const timeInfo = `Mulai: ${data.startTime || ' '}  •  Selesai: ${data.endTime || ' '}  •  Total Downtime: ${data.totalDowntime || ' '}`;
    doc.text(timeInfo, mRight - 6, 148.8, { align: 'right' });

    // Kotak Ruang Uraian Tindakan Perbaikan
    const actionBoxY = 152;
    const actionBoxH = 92;
    doc.rect(mLeft + 6, actionBoxY, contentW - 12, actionBoxH);

    // Isi Uraian Tindakan Perbaikan
    let actY = actionBoxY + 4.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('1. Langkah Analisa & Diagnosa Teknis:', mLeft + 9, actY);
    actY += 3.8;

    doc.setFont('helvetica', 'normal');
    const tsText = (data.diagnosis || data.initialCheck || '').trim();
    if (tsText) {
        const splitTs = doc.splitTextToSize(tsText, contentW - 20);
        doc.text(splitTs, mLeft + 12, actY);
        actY += splitTs.length * 3.5 + 2.5;
    } else {
        // Space 2x enter kosong untuk pengisian manual
        actY += 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.text('2. Tindakan Perbaikan (Action Taken):', mLeft + 9, actY);
    actY += 3.8;

    doc.setFont('helvetica', 'normal');
    const actionText = (data.actionTaken || '').trim();
    if (actionText) {
        const splitAction = doc.splitTextToSize(actionText, contentW - 20);
        doc.text(splitAction, mLeft + 12, actY);
        actY += splitAction.length * 3.5 + 2.5;
    } else {
        // Space 2x enter kosong untuk pengisian manual
        actY += 8;
    }

    if (data.rootCause && data.rootCause.trim()) {
        doc.setFont('helvetica', 'bold');
        doc.text('3. Akar Masalah (Root Cause):', mLeft + 9, actY);
        actY += 3.8;

        doc.setFont('helvetica', 'normal');
        const splitRca = doc.splitTextToSize(data.rootCause.trim(), contentW - 20);
        doc.text(splitRca, mLeft + 12, actY);
        actY += splitRca.length * 3.5 + 2;
    }

    // Mini Tabel Penggantian Spare Part / Komponen (Jika Ada)
    doc.setFont('helvetica', 'bold');
    doc.text('4. Penggantian Komponen / Spare Part (Bila Ada):', mLeft + 9, actY);
    actY += 3.8;

    const partsRows = Array.isArray(data.replacedParts) && data.replacedParts.length > 0
        ? data.replacedParts.map(p => [p.name || ' ', p.oldSn || ' ', p.newSn || ' ', `${p.qty || 1} Unit`])
        : [
            [' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ']
        ]; // Diberikan 2 baris kosong untuk space pengisian

    autoTable(doc, {
        startY: actY,
        head: [['Nama Komponen / Material', 'S/N Lama', 'S/N Baru', 'Qty']],
        body: partsRows,
        theme: 'grid',
        headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontSize: 6.5, fontStyle: 'bold', cellPadding: 1 },
        styles: { fontSize: 6.5, cellPadding: 1.8, textColor: [30, 41, 59] },
        columnStyles: {
            0: { width: 85 },
            1: { width: 35 },
            2: { width: 35 },
            3: { width: 17, halign: 'center' }
        },
        margin: { left: mLeft + 9, right: mLeft + 9 }
    });

    actY = (doc.lastAutoTable?.finalY || actY + 12) + 2;

    if (data.preventiveAction && data.preventiveAction.trim()) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('5. Rekomendasi Pencegahan:', mLeft + 9, actY);
        actY += 3.8;

        doc.setFont('helvetica', 'normal');
        const splitPrev = doc.splitTextToSize(data.preventiveAction, contentW - 20);
        doc.text(splitPrev, mLeft + 12, actY);
    }

    // ==========================================
    // BOX APPROVAL FINAL PENYELESAIAN (PIC IT & Pemohon)
    // ==========================================
    const finalSignY = 247;
    const finalSignW = 55;
    const finalSignX = mRight - 6 - finalSignW;

    doc.rect(finalSignX, finalSignY, finalSignW, 20);
    doc.line(finalSignX, finalSignY + 5.5, finalSignX + finalSignW, finalSignY + 5.5);
    doc.line(finalSignX + (finalSignW / 2), finalSignY, finalSignX + (finalSignW / 2), finalSignY + 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('PIC IT', finalSignX + (finalSignW / 4), finalSignY + 4, { align: 'center' });
    doc.text('Pemohon', finalSignX + (finalSignW * 3 / 4), finalSignY + 4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`(${techName})`, finalSignX + (finalSignW / 4), finalSignY + 17.5, { align: 'center' });
    doc.text(`(${reporterName})`, finalSignX + (finalSignW * 3 / 4), finalSignY + 17.5, { align: 'center' });

    // ==========================================
    // 6. FOOTER NOTE & KODE FORMULIR RESMI
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Note :', mLeft + 6, 270);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text('Pengisian Form perbaikan perangkat IT ini berlaku untuk penanganan perbaikan yang tidak selesai selama (24 Jam).', mLeft + 6, 274.5);

    // Garis pembatas footer form code
    doc.setLineWidth(0.4);
    doc.line(mLeft, 280, mRight, 280);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('F-PIK-IT-093-Rev.00', mLeft + 2, 285);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tanggal Cetak: ${todayStr}`, mRight - 2, 285, { align: 'right' });

    // Save & Download
    const cleanHost = (data.hostname || 'IT').replace(/\s+/g, '_');
    const fileName = `Formulir_Perbaikan_IT_${cleanHost}_${Date.now().toString().slice(-6)}.pdf`;
    doc.save(fileName);
};
