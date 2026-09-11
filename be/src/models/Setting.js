import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Setting = sequelize.define('Setting', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: 'unique_setting_key',
    },
    value: {
        type: DataTypes.TEXT, // Using TEXT for JSON storage
        allowNull: true,
    },
}, {
    tableName: 'Settings', // Force table name
    timestamps: true,
});

export default Setting;
