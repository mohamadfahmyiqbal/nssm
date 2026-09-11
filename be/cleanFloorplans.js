import { Op } from 'sequelize';
import Floorplan from './src/models/Floorplan.js';
import Network from './src/models/Network.js';

async function cleanData() {
    try {
        console.log('Cleaning floorplans except Master Facility Blueprint...');

        // Hapus seluruh floorplans yang bukan 'Master Facility Blueprint'
        const deletedCount = await Floorplan.destroy({
            where: {
                name: {
                    [Op.ne]: 'Master Facility Blueprint'
                }
            }
        });

        console.log(`✅ ${deletedCount} floorplans deleted.`);

        // Reset SEGMENT di Network yang tadinya menunjuk ke denah terhapus
        await Network.update(
            { SEGMENT: 'DEFAULT' },
            {
                where: {
                    SEGMENT: {
                        [Op.ne]: 'Master Facility Blueprint'
                    }
                }
            }
        );

        console.log('✅ Network device segments reset to DEFAULT.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Clean error:', err);
        process.exit(1);
    }
}

cleanData();
