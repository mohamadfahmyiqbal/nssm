import sequelizeITAM from './src/config/databaseITAM.js';

async function checkForeignKeys() {
    try {
        await sequelizeITAM.authenticate();
        
        // Cari tabel yang punya ID cocok dengan check_id
        const [tables] = await sequelizeITAM.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
        `);
        console.log('Semua tabel di ITAM:', tables.map(t => t.TABLE_NAME));

        // Cek contoh check_id di tabel-tabel maintenance
        const [checkSample] = await sequelizeITAM.query(`
            SELECT TOP 5 * FROM maintenance_checks WHERE id = 3686 OR id = 5219
        `).catch(err => {
            return [[{ error: err.message }]];
        });
        console.log('Hasil cek maintenance_checks:', checkSample);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkForeignKeys();
