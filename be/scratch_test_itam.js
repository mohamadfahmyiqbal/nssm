import { MaintenanceSchedule, StandardMaintenance } from './src/models/itamRelations.js';
import sequelizeITAM from './src/config/databaseITAM.js';

async function testFetch() {
    try {
        await sequelizeITAM.authenticate();
        console.log('✅ Connected to ITAM DB');

        const totalSched = await MaintenanceSchedule.count();
        console.log('Total schedules in DB:', totalSched);

        const totalStd = await StandardMaintenance.count();
        console.log('Total standard maintenances in DB:', totalStd);

        const samples = await MaintenanceSchedule.findAll({
            limit: 5,
            include: [{
                model: StandardMaintenance,
                as: 'standardMaintenance'
            }]
        });

        console.log('Sample rows with relation:', JSON.stringify(samples, null, 2));

        const categories = await StandardMaintenance.findAll({
            attributes: ['kategori'],
            group: ['kategori']
        });
        console.log('Distinct kategori in StandardMaintenance:', categories.map(c => c.kategori));

    } catch (err) {
        console.error('❌ Error testing ITAM:', err);
    } finally {
        process.exit();
    }
}

testFetch();
