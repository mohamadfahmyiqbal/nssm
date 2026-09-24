import sequelizeITAM from '../config/databaseITAM.js';

/**
 * Mendapatkan daftar jadwal maintenance dari master standard_maintenance_checks (planned_dates)
 * dan digabungkan dengan status/legend actual dari maintenance_actual jika ada.
 * Kategori: HARDWARE & SOFTWARE_HW
 */
export const getMaintenanceSchedules = async (req, res) => {
    try {
        const { status, subKategori, startDate, endDate, limit = 2000 } = req.query;

        // 1. Ambil master check standar beserta planned_dates dan cycle_time_minutes
        let checkQuery = `
            SELECT TOP ${parseInt(limit, 10) || 2000}
                smc.id as check_id,
                smc.pengecekan,
                smc.periodik,
                smc.bagian,
                smc.metode,
                smc.alat,
                smc.cycle_time_minutes,
                smc.planned_dates,
                sm.id as standard_id,
                sm.kategori,
                sm.subKategori,
                sm.namaPerangkat,
                sm.tipePerangkat,
                sm.subPerangkat
            FROM standard_maintenance_checks smc
            JOIN standard_maintenance_details smd ON smc.standard_maintenance_detail_id = smd.id
            JOIN standard_maintenances sm ON smd.standard_maintenance_id = sm.id
            WHERE sm.kategori IN ('HARDWARE', 'SOFTWARE_HW', 'hardware', 'software_hw')
        `;

        const replacements = {};

        if (subKategori && subKategori !== 'ALL') {
            checkQuery += ` AND sm.subKategori = :subKategori`;
            replacements.subKategori = subKategori;
        }

        const standardChecks = await sequelizeITAM.query(checkQuery, {
            replacements,
            type: sequelizeITAM.QueryTypes.SELECT
        });

        // 2. Ambil seluruh maintenance_actual untuk overlay status/legend
        const actualQuery = `
            SELECT 
                ma.id,
                ma.check_id,
                ma.tanggal,
                ma.status,
                ma.legend
            FROM maintenance_actual ma
        `;

        const actualList = await sequelizeITAM.query(actualQuery, {
            type: sequelizeITAM.QueryTypes.SELECT
        });

        // Map lookup actual by check_id + tanggal (YYYY-MM-DD)
        const actualMap = new Map();
        actualList.forEach(act => {
            const tglKey = typeof act.tanggal === 'string' ? act.tanggal.split('T')[0] : act.tanggal?.toISOString?.()?.split('T')[0];
            if (tglKey) {
                actualMap.set(`${act.check_id}_${tglKey}`, act);
            }
        });

        // 3. Ekspansi master check berdasarkan planned_dates
        const formattedData = [];

        standardChecks.forEach(check => {
            let plannedDatesArray = [];
            if (check.planned_dates) {
                try {
                    const parsed = JSON.parse(check.planned_dates);
                    if (Array.isArray(parsed)) {
                        plannedDatesArray = parsed;
                    }
                } catch {
                    // Jika formatnya comma separated string
                    plannedDatesArray = check.planned_dates.split(',').map(s => s.trim().replace(/['"\[\]]/g, ''));
                }
            }

            // Jika ada planned_dates, buat event per tanggal
            if (plannedDatesArray.length > 0) {
                plannedDatesArray.forEach((tgl, idx) => {
                    if (!tgl) return;
                    const cleanDate = tgl.split('T')[0];

                    // Cek filter tanggal
                    if (startDate && cleanDate < startDate) return;
                    if (endDate && cleanDate > endDate) return;

                    // Cek apakah ada record actual untuk tanggal ini
                    const actualMatch = actualMap.get(`${check.check_id}_${cleanDate}`);
                    const eventStatus = actualMatch?.status || 'PLAN';
                    const eventLegend = actualMatch?.legend || '□';

                    if (status && status !== 'ALL' && eventStatus !== status) return;

                    formattedData.push({
                        id: actualMatch?.id || `plan_${check.check_id}_${idx}`,
                        check_id: check.check_id,
                        tanggal: cleanDate,
                        status: eventStatus,
                        legend: eventLegend,
                        isPlanned: true,
                        hasActual: !!actualMatch,
                        pengecekan: check.pengecekan,
                        periodik: check.periodik,
                        bagian: check.bagian,
                        metode: check.metode,
                        alat: check.alat,
                        cycle_time_minutes: check.cycle_time_minutes != null ? Number(check.cycle_time_minutes) : null,
                        standardMaintenance: {
                            id: check.standard_id,
                            kategori: check.kategori,
                            subKategori: check.subKategori,
                            namaPerangkat: check.namaPerangkat,
                            tipePerangkat: check.tipePerangkat,
                            subPerangkat: check.subPerangkat
                        }
                    });
                });
            }
        });

        // Urutkan tanggal
        formattedData.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

        return res.status(200).json({
            success: true,
            total: formattedData.length,
            data: formattedData
        });
    } catch (error) {
        console.error('❌ [Maintenance Schedule Error]:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Gagal memuat jadwal maintenance dari master planned_dates ITAM.',
            details: error.message
        });
    }
};

/**
 * Mendapatkan ringkasan statistik jadwal maintenance actual
 */
export const getMaintenanceSummary = async (req, res) => {
    try {
        const [summaryResult] = await sequelizeITAM.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN ma.status IN ('PLAN', 'Scheduled', 'SCHEDULED', 'OPEN', 'PENDING') THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN ma.status IN ('ACTUAL', 'COMPLETED', 'DONE', 'Closed') THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN ma.status IN ('CANCELLED', 'CANCELED', 'CANCEL') THEN 1 ELSE 0 END) as cancelled
            FROM maintenance_actual ma
            JOIN standard_maintenance_checks smc ON ma.check_id = smc.id
            JOIN standard_maintenance_details smd ON smc.standard_maintenance_detail_id = smd.id
            JOIN standard_maintenances sm ON smd.standard_maintenance_id = sm.id
            WHERE sm.kategori IN ('HARDWARE', 'SOFTWARE_HW', 'hardware', 'software_hw')
        `, { type: sequelizeITAM.QueryTypes.SELECT });

        return res.status(200).json({
            success: true,
            summary: {
                total: summaryResult?.total || 0,
                pending: summaryResult?.pending || 0,
                completed: summaryResult?.completed || 0,
                cancelled: summaryResult?.cancelled || 0
            }
        });
    } catch (error) {
        console.error('❌ [Maintenance Summary Error]:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Gagal memuat statistik jadwal maintenance actual.',
            details: error.message
        });
    }
};
