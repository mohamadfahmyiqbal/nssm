import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate PDF Lembar Kerja Work Order & Penugasan Man Power per Teknisi
 * @param {Object} params
 * @param {Object} params.technician - Data teknisi { nik, name, dept }
 * @param {Array} params.workOrders - Daftar seluruh WO yang ditugaskan ke teknisi ini
 * @param {Array} params.scheduleBreaks - Daftar jadwal istirahat yang berlaku
 * @param {string} params.selectedDate - Tanggal filter (opsional/harian)
 */
export const generateTechnicianWorkOrderPDF = ({
    technician,
    workOrders = [],
    scheduleBreaks = [],
    selectedDate = null
}) => {
    if (!technician) return;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const techNik = String(technician.nik || technician.NIK || '-').trim();
    const techName = String(technician.name || technician.nama || technician.NAMA || 'Teknisi').trim();
    const techDept = technician.dept || technician.DEPT || 'IT Infrastructure & Support';

    // Filter WO milik teknisi ini
    const techWos = workOrders.filter(w => {
        const wNik = String(w.assignedTechnicianNik || '').trim();
        const wName = String(w.assignedTechnicianName || '').trim().toLowerCase();
        const isPic = (techNik && wNik === techNik) || (techName.toLowerCase() && wName === techName.toLowerCase());

        let isHelper = false;
        let membersList = [];
        if (w.teamMembersJson) {
            try { membersList = JSON.parse(w.teamMembersJson); } catch (e) {}
        } else if (Array.isArray(w.teamMembers)) {
            membersList = w.teamMembers;
        }
        if (Array.isArray(membersList)) {
            isHelper = membersList.some(m => {
                const mNik = String(m.nik || m.NIK || '').trim();
                const mName = String(m.name || m.nama || m.NAMA || '').trim().toLowerCase();
                return (techNik && mNik === techNik) || (techName.toLowerCase() && mName === techName.toLowerCase());
            });
        }
        return isPic || isHelper;
    });

    // Filter Waktu Istirahat yang berlaku
    const techBreaks = scheduleBreaks.filter(b => {
        const bNik = String(b.technicianNik || 'ALL').trim();
        return bNik === 'ALL' || (techNik && bNik === techNik);
    });

    const printDateStr = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const targetDateDisplay = selectedDate
        ? new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Semua Periode';

    // ==========================================
    // 1. HEADER DOKUMEN & KOP SURAT
    // ==========================================
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('SURAT PERINTAH KERJA (WORK ORDER) & MAN POWER ALLOCATION', 105, 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Network Telemetry & Maintenance System (NTMS) • IT Infrastructure Dept', 105, 16, { align: 'center' });

    // Meta Info Bar
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Dicetak Pada: ${printDateStr}`, 14, 30);
    doc.text(`Target Periode: ${targetDateDisplay}`, 196, 30, { align: 'right' });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(14, 33, 196, 33);

    let startY = 37;

    // Helper Section Header
    const drawSectionHeader = (title, y) => {
        doc.setFillColor(241, 245, 249);
        doc.rect(14, y, 182, 6, 'F');
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(title, 16, y + 4.2);
        return y + 8;
    };

    // ==========================================
    // I. PROFIL TEKNISI & SUMMARY BEBAN TUGAS
    // ==========================================
    startY = drawSectionHeader('I. IDENTITAS TEKNISI / PELAKSANA TUGAS', startY);

    const totalHours = techWos.reduce((sum, w) => sum + (parseFloat(w.estimatedHours) || 1), 0);
    const resolvedCount = techWos.filter(w => w.status === 'RESOLVED' || w.status === 'CLOSED').length;
    const inProgressCount = techWos.filter(w => w.status === 'IN_PROGRESS' || w.status === 'ASSIGNED').length;

    const techInfoRows = [
        ['Nama Teknisi:', techName, 'NIK:', techNik],
        ['Departemen:', techDept, 'Role Penugasan:', 'PIC Utama / Tim Maintenance'],
        ['Total Work Order:', `${techWos.length} Tugas`, 'Total Estimasi Waktu:', `${totalHours.toFixed(1)} Jam`],
        ['Status Pengerjaan:', `${resolvedCount} Selesai • ${inProgressCount} Berjalan / Open`, 'Jumlah Istirahat:', `${techBreaks.length} Sesi Terdaftar`]
    ];

    autoTable(doc, {
        startY: startY,
        body: techInfoRows,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1.5, textColor: [30, 41, 59] },
        columnStyles: {
            0: { fontStyle: 'bold', width: 36 },
            1: { width: 55 },
            2: { fontStyle: 'bold', width: 36 },
            3: { width: 55 }
        },
        margin: { left: 14, right: 14 }
    });

    startY = (doc.lastAutoTable?.finalY || startY + 25) + 4;

    // ==========================================
    // II. WAKTU ISTIRAHAT (SCHEDULE BREAKS)
    // ==========================================
    if (techBreaks.length > 0) {
        startY = drawSectionHeader('II. JADWAL ISTIRAHAT RESMI (BREAK TIME)', startY);

        const breakTableBody = techBreaks.map((b, idx) => [
            String(idx + 1),
            b.label || 'Istirahat',
            `${b.startTime} - ${b.endTime}`,
            `${b.durationMinutes || 60} Menit`,
            b.technicianNik === 'ALL' ? 'Semua Teknisi (Global)' : `Khusus (${techName})`,
            b.notes || '-'
        ]);

        autoTable(doc, {
            startY: startY,
            head: [['No', 'Keperluan Istirahat', 'Jam Istirahat', 'Durasi', 'Cakupan', 'Catatan']],
            body: breakTableBody,
            theme: 'grid',
            headStyles: {
                fillColor: [245, 158, 11], // amber-500
                textColor: [255, 255, 255],
                fontSize: 8,
                fontStyle: 'bold',
                halign: 'center'
            },
            styles: { fontSize: 7.5, cellPadding: 1.5, textColor: [30, 41, 59] },
            columnStyles: {
                0: { width: 8, halign: 'center' },
                1: { width: 52 },
                2: { width: 30, halign: 'center', fontStyle: 'bold' },
                3: { width: 20, halign: 'center' },
                4: { width: 40 },
                5: { width: 32 }
            },
            margin: { left: 14, right: 14 }
        });

        startY = (doc.lastAutoTable?.finalY || startY + 20) + 4;
    }

    // ==========================================
    // III. TABEL RINCIAN WORK ORDER & CHECKLIST ITEM
    // ==========================================
    const sectionNum = techBreaks.length > 0 ? 'III' : 'II';
    startY = drawSectionHeader(`${sectionNum}. DAFTAR RINCIAN WORK ORDER & LEMBAR PENGECEKAN (CHECKLIST)`, startY);

    if (techWos.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Tidak ada Work Order yang ditugaskan ke teknisi ini pada periode terpilih.', 16, startY + 4);
        startY += 10;
    } else {
        // Ekstrak checklist item dari masing-masing Work Order
        const checklistRows = [];
        let rowCounter = 1;

        techWos.forEach((wo) => {
            let devicesText = '-';
            if (wo.devicesJson) {
                try {
                    const parsed = JSON.parse(wo.devicesJson);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        devicesText = parsed.join(', ');
                    }
                } catch (e) {}
            } else if (Array.isArray(wo.devices) && wo.devices.length > 0) {
                devicesText = wo.devices.join(', ');
            }

            const timeRange = `${wo.startTime || '08:00'} - ${wo.endTime || '10:00'}`;
            const desc = wo.description || '';

            // Ekstrak butir checklist dari deskripsi (misal: "Daftar Checklist Standar:\n1. ... \n2. ...")
            const checklistLines = [];
            if (desc.includes('Daftar Checklist Standar:')) {
                const parts = desc.split('Daftar Checklist Standar:');
                if (parts[1]) {
                    const lines = parts[1].split('\n').map(l => l.trim()).filter(Boolean);
                    lines.forEach(line => {
                        // Bersihkan nomor di depan jika ada (e.g., "1. Cek suhu" -> "Cek suhu")
                        const cleanItem = line.replace(/^\d+[\.\)]\s*/, '');
                        if (cleanItem) checklistLines.push(cleanItem);
                    });
                }
            } else if (desc.trim()) {
                // Jika deskripsi non-standar, gunakan baris deskripsi
                const lines = desc.split('\n').map(l => l.trim()).filter(Boolean);
                lines.forEach(l => {
                    const cleanItem = l.replace(/^\d+[\.\)]\s*/, '');
                    if (cleanItem) checklistLines.push(cleanItem);
                });
            }

            // Jika ada baris checklist, tampilkan setiap item checklist secara rinci
            const actInfo = (wo.actualStartTime || wo.actualEndTime)
                ? `\n[Act: ${wo.actualStartTime || '-'} - ${wo.actualEndTime || '-'} (${wo.actualDurationMinutes || Math.round((parseFloat(wo.actualHours) || 0) * 60)}m)]`
                : '';
            const remarksInfo = wo.remarks ? `\n• Remarks: ${wo.remarks}` : '';

            if (checklistLines.length > 0) {
                checklistLines.forEach((itemText, itemIdx) => {
                    const isFirstItem = itemIdx === 0;
                    checklistRows.push([
                        String(rowCounter++),
                        isFirstItem ? (wo.woNumber || '-') : '',
                        isFirstItem ? `${wo.title || '-'}\n• Target Unit: ${devicesText}${remarksInfo}` : '',
                        `[  ] ${itemText}`,
                        isFirstItem ? (wo.targetDate || '-') : '',
                        isFirstItem ? `${timeRange}${actInfo}` : '',
                        isFirstItem ? (wo.status || 'ASSIGNED') : '',
                        '[  ] OK   [  ] NOK\nParaf: _____'
                    ]);
                });
            } else {
                // Fallback jika tidak ada breakdown checklist
                checklistRows.push([
                    String(rowCounter++),
                    wo.woNumber || '-',
                    `${wo.title || '-'}\n• Target Unit: ${devicesText}${remarksInfo}`,
                    `[  ] Pelaksanaan & Pemeliharaan: ${wo.title || 'Pekerjaan Standar'}`,
                    wo.targetDate || '-',
                    `${timeRange}${actInfo}`,
                    wo.status || 'ASSIGNED',
                    '[  ] OK   [  ] NOK\nParaf: _____'
                ]);
            }
        });

        autoTable(doc, {
            startY: startY,
            head: [['No', 'No. WO', 'Instruksi / Perangkat', 'Rincian Checklist Pengecekan', 'Tanggal', 'Jam Kerja', 'Status', 'Hasil & Paraf']],
            body: checklistRows,
            theme: 'grid',
            headStyles: {
                fillColor: [30, 58, 138], // blue-900
                textColor: [255, 255, 255],
                fontSize: 7.5,
                fontStyle: 'bold',
                halign: 'center'
            },
            styles: { fontSize: 7, cellPadding: 1.5, textColor: [30, 41, 59], overflow: 'linebreak' },
            columnStyles: {
                0: { width: 7, halign: 'center' },
                1: { width: 22, fontStyle: 'bold' },
                2: { width: 42 },
                3: { width: 55 },
                4: { width: 16, halign: 'center' },
                5: { width: 17, halign: 'center' },
                6: { width: 13, halign: 'center' },
                7: { width: 18, halign: 'center' }
            },
            margin: { left: 14, right: 14 },
            didDrawPage: (data) => {
                // Footer nomor halaman
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(7);
                doc.setTextColor(148, 163, 184);
                doc.text(`Halaman ${doc.internal.getCurrentPageInfo().pageNumber} dari ${pageCount}`, 196, 288, { align: 'right' });
                doc.text('Dokumen ini dicetak otomatis oleh Sistem NTMS. Harap ditandatangani setelah checklist diselesaikan.', 14, 288);
            }
        });

        startY = (doc.lastAutoTable?.finalY || startY + 40) + 6;
    }

    // Cek apakah sisa halaman cukup untuk blok tanda tangan (butuh minimal 40mm)
    if (startY > 235) {
        doc.addPage();
        startY = 20;
    }

    // ==========================================
    // LEMBAR PENGESAHAN & TANDA TANGAN
    // ==========================================
    doc.setDrawColor(203, 213, 225);
    doc.line(14, startY, 196, startY);
    startY += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('LEMBAR PENGESAHAN PENUGASAN & PENYELESAIAN TUGAS', 105, startY, { align: 'center' });
    startY += 6;

    const signBoxY = startY;
    const colWidth = 56;

    // Kolom 1: Diserahkan Oleh (Supervisor / Lead)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Diberikan / Disetujui Oleh,', 14 + (colWidth / 2), signBoxY, { align: 'center' });
    doc.text('Supervisor / Koordinator IT', 14 + (colWidth / 2), signBoxY + 4, { align: 'center' });
    doc.line(18, signBoxY + 22, 14 + colWidth - 4, signBoxY + 22);
    doc.text('( ................................................ )', 14 + (colWidth / 2), signBoxY + 26, { align: 'center' });

    // Kolom 2: Diterima Oleh (Teknisi Pelaksana)
    doc.text('Diterima & Dilaksanakan Oleh,', 77 + (colWidth / 2), signBoxY, { align: 'center' });
    doc.text('Teknisi / Pelaksana Tugas', 77 + (colWidth / 2), signBoxY + 4, { align: 'center' });
    doc.line(81, signBoxY + 22, 77 + colWidth - 4, signBoxY + 22);
    doc.setFont('helvetica', 'bold');
    doc.text(`( ${techName} )`, 77 + (colWidth / 2), signBoxY + 26, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`NIK: ${techNik}`, 77 + (colWidth / 2), signBoxY + 30, { align: 'center' });

    // Kolom 3: Diverifikasi Oleh (User / PIC Lokasi)
    doc.text('Diverifikasi / Diperiksa Oleh,', 140 + (colWidth / 2), signBoxY, { align: 'center' });
    doc.text('Dept Head / Verifikator', 140 + (colWidth / 2), signBoxY + 4, { align: 'center' });
    doc.line(144, signBoxY + 22, 140 + colWidth - 4, signBoxY + 22);
    doc.text('( ................................................ )', 140 + (colWidth / 2), signBoxY + 26, { align: 'center' });

    // Simpan File PDF
    const cleanTechName = techName.replace(/[^a-zA-Z0-9]/g, '_');
    const dateFileSlug = selectedDate ? selectedDate.replace(/-/g, '') : 'ALL';
    const fileName = `WorkOrder_${cleanTechName}_${dateFileSlug}.pdf`;
    doc.save(fileName);
};
