// models/Akses.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Akses = sequelize.define('Akses', {
    NIK: {
        type: DataTypes.STRING,
        primaryKey: true,
        autoIncrement: false,
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
    timestamps: false,
});

export default Akses;