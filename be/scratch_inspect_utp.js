import sequelizeITAM from './src/config/databaseITAM.js';

async function inspectUtp() {
    try {
        await sequelizeITAM.authenticate();
        
        // 1. Cek semua kolom tabel standard_maintenance_checks, standard_maintenance_details, standard_maintenances
        const [smcCols] = await sequelizeITAM.query(`
            SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'standard_maintenance_checks'
        `);
        console.log('Columns standard_maintenance_checks:', smcCols.map(c => c.COLUMN_NAME));

        const [smdCols] = await sequelizeITAM.query(`
            SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'standard_maintenance_details'
        `);
        console.log('Columns standard_maintenance_details:', smdCols.map(c => c.COLUMN_NAME));

        // 2. Cari data UTP
        const [utpRows] = await sequelizeITAM.query(`
            SELECT TOP 5 
                smc.*,
                smd.standar_waktu,
                smd.estimasi_waktu,
                smd.durasi,
                smd.waktu,
                smd.satuan
            FROM standard_maintenance_checks smc
            LEFT JOIN standard_maintenance_details smd ON smc.standard_maintenance_detail_id = smd.id
            WHERE smc.pengecekan LIKE '%UTP%'
        `);
        console.log('UTP Sample Data:', utpRows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

inspectUtp();
