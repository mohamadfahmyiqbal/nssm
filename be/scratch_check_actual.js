import { MaintenanceActual, MaintenanceSchedule, StandardMaintenance } from './src/models/itamRelations.js';
import sequelizeITAM from './src/config/databaseITAM.js';

async function checkActualData() {
    try {
        await sequelizeITAM.authenticate();
        console.log('✅ Connected to ITAM DB');

        const totalActual = await MaintenanceActual.count();
        console.log('Total baris di maintenance_actual:', totalActual);

        const sampleActual = await MaintenanceActual.findAll({
            limit: 10,
            order: [['id', 'DESC']]
        });
        console.log('10 Sample terbaru di maintenance_actual:', JSON.stringify(sampleActual, null, 2));

        const withRelation = await MaintenanceActual.findAll({
            limit: 5,
            include: [
                {
                    model: MaintenanceSchedule,
                    as: 'schedule',
                    include: [
                        {
                            model: StandardMaintenance,
                            as: 'standardMaintenance'
                        }
                    ]
                }
            ]
        });
        console.log('Sample dengan relasi Schedule + StandardMaintenance:', JSON.stringify(withRelation, null, 2));

        // Cek range tanggal
        const [minMax] = await sequelizeITAM.query(`
            SELECT MIN(tanggal) as min_date, MAX(tanggal) as max_date FROM maintenance_actual
        `);
        console.log('Rentang tanggal di maintenance_actual:', minMax);

    } catch (err) {
        console.error('❌ Error checking actual data:', err);
    } finally {
        process.exit();
    }
}

checkActualData();
