import sequelizeITAM from './src/config/databaseITAM.js';

async function testHierarchy() {
    try {
        await sequelizeITAM.authenticate();
        
        const [detailSample] = await sequelizeITAM.query(`
            SELECT TOP 5 * FROM standard_maintenance_details WHERE id IN (1295, 1788)
        `);
        console.log('Sample standard_maintenance_details:', detailSample);

        const [queryTest] = await sequelizeITAM.query(`
            SELECT TOP 10
                ma.id as actual_id,
                ma.tanggal,
                ma.status,
                ma.legend,
                smc.pengecekan,
                smc.periodik,
                sm.id as standard_id,
                sm.kategori,
                sm.subKategori,
                sm.namaPerangkat,
                sm.tipePerangkat
            FROM maintenance_actual ma
            JOIN standard_maintenance_checks smc ON ma.check_id = smc.id
            JOIN standard_maintenance_details smd ON smc.standard_maintenance_detail_id = smd.id
            JOIN standard_maintenances sm ON smd.standard_maintenance_id = sm.id
            WHERE sm.kategori IN ('HARDWARE', 'SOFTWARE_HW')
            ORDER BY ma.tanggal DESC
        `);
        console.log('Query JOIN Hasil Lengkap:', queryTest);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

testHierarchy();
