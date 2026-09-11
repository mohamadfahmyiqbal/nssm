// models/Akses.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Akses = sequelize.define('Akses', {
    NIK: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    NAMA: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    DEPT: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    PASS: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    TOKEN: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    AKSES: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'Akses',
    schema: 'dbo',
    timestamps: true, // Otomatis mengelola createdAt & updatedAt
});

export default Akses;