import sequelizeITAM from './src/config/databaseITAM.js';

async function checkStandardDetails() {
    try {
        await sequelizeITAM.authenticate();
        
        // 1. Cek struktur tabel standard_maintenance_checks
        const [checksCols] = await sequelizeITAM.query(`
            SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'standard_maintenance_checks'
        `);
        console.log('Columns in standard_maintenance_checks:', checksCols);

        // 2. Cek sample data standard_maintenance_checks
        const [checksSample] = await sequelizeITAM.query(`
            SELECT TOP 5 * FROM standard_maintenance_checks WHERE id IN (3686, 5219)
        `);
        console.log('Sample standard_maintenance_checks:', checksSample);

        // 3. Cek JOIN antara maintenance_actual -> standard_maintenance_checks -> standard_maintenances
        const [joinTest] = await sequelizeITAM.query(`
            SELECT TOP 5 
                ma.id as actual_id,
                ma.tanggal,
                ma.status as actual_status,
                ma.legend,
                smc.id as check_id,
                sm.id as standard_id,
                sm.kategori,
                sm.subKategori,
                sm.namaPerangkat
            FROM maintenance_actual ma
            JOIN standard_maintenance_checks smc ON ma.check_id = smc.id
            JOIN standard_maintenances sm ON smc.standard_maintenance_id = sm.id
            WHERE sm.kategori IN ('HARDWARE', 'SOFTWARE_HW')
            ORDER BY ma.tanggal DESC
        `);
        console.log('Test JOIN hasil query Actual -> Checks -> Standard:', joinTest);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkStandardDetails();
