// config/database.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_SERVER || 'pik1com074.local.ikoito.co.id',
        port: parseInt(process.env.DB_PORT, 10) || 1433,
        dialect: 'mssql',
        dialectOptions: {
            options: {
                encrypt: false,
                trustServerCertificate: true,
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

export const testDbConnection = async () => {
    console.log(process.env.DB_SERVER);
    console.log(process.env.DB_PORT);

    try {
        await sequelize.authenticate();
        console.log('✅ [Sequelize ORM] Connected to SQL Server successfully.');
    } catch (error) {
        console.error('❌ [Sequelize ORM] Database connection failed:', error.message);
    }
};

export default sequelize;