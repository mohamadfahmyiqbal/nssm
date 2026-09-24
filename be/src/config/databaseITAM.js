// config/databaseITAM.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME_ITAM || process.env.DB_NAME,
    process.env.DB_USER_ITAM || process.env.DB_USER,
    process.env.DB_PASSWORD_ITAM || process.env.DB_PASSWORD,
    {
        host: process.env.DB_SERVER_ITAM || process.env.DB_SERVER || 'pik1com074.local.ikoito.co.id',
        port: parseInt(process.env.DB_PORT_ITAM || process.env.DB_PORT, 10) || 1433,
        dialect: 'mssql',
        dialectOptions: {
            options: {
                encrypt: false,
                trustServerCertificate: true,
                readOnlyIntent: true,
            },
        },
        logging: false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    }
);

// Proteksi level ORM: Cegah operasi write (INSERT, UPDATE, DELETE, ALTER, DROP, TRUNCATE)
sequelize.addHook('beforeQuery', (options) => {
    const rawQuery = typeof options === 'string' ? options : (options?.query || '');
    const writePattern = /^\s*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|MERGE)\b/i;

    if (writePattern.test(rawQuery) || (options?.type && ['INSERT', 'UPDATE', 'DELETE', 'BULKUPDATE', 'BULKDELETE'].includes(options.type))) {
        throw new Error('❌ [databaseITAM] Akses ditolak: Database ITAM hanya diizinkan untuk operasi READ (SELECT).');
    }
});

export const testDbConnectionITAM = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ [Sequelize ORM] Connected to SQL Server (ITAM - Read-Only) successfully.');
    } catch (error) {
        console.error('❌ [Sequelize ORM] ITAM Database connection failed:', error.message);
    }
};

export default sequelize;