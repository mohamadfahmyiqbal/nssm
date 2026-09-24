import { MaintenanceSchedule, StandardMaintenance } from './src/models/itamRelations.js';
import sequelizeITAM from './src/config/databaseITAM.js';
import { Op } from 'sequelize';

async function testDates() {
    try {
        await sequelizeITAM.authenticate();

        const countWithNextDate = await MaintenanceSchedule.count({
            where: {
                next_maintenance_date: {
                    [Op.ne]: null
                }
            }
        });
        console.log('Count where next_maintenance_date is NOT NULL:', countWithNextDate);

        const sampleDates = await MaintenanceSchedule.findAll({
            where: {
                next_maintenance_date: {
                    [Op.ne]: null
                }
            },
            limit: 5,
            include: [{
                model: StandardMaintenance,
                as: 'standardMaintenance',
                where: {
                    kategori: {
                        [Op.in]: ['HARDWARE', 'SOFTWARE_HW']
                    }
                }
            }]
        });

        console.log('Sample schedules with non-null dates (HARDWARE / SOFTWARE_HW):', JSON.stringify(sampleDates, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

testDates();
