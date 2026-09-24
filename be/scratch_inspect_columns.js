import { MaintenanceSchedule } from './src/models/itamRelations.js';
import sequelizeITAM from './src/config/databaseITAM.js';

async function inspectColumns() {
    try {
        await sequelizeITAM.authenticate();
        const [results] = await sequelizeITAM.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'maintenance_schedules'
        `);
        console.log('Columns in maintenance_schedules:', results);

        const [sample] = await sequelizeITAM.query(`
            SELECT TOP 5 * FROM maintenance_schedules
        `);
        console.log('Sample raw rows in maintenance_schedules:', sample);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

inspectColumns();
