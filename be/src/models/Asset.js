// models/Asset.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Asset = sequelize.define('Asset', {
    PID: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    CAT: DataTypes.STRING,
    ASSET: DataTypes.STRING,
    TYPE: DataTypes.STRING,
    PIC: DataTypes.STRING,
    HOSTNAME: DataTypes.STRING,
    PEMBELIAN: DataTypes.STRING,
    DEPRESIASI: DataTypes.STRING,
    EXTEND: DataTypes.STRING,
    STATUS: DataTypes.STRING,
}, {
    tableName: 'Asset',
    schema: 'dbo',
    timestamps: false,
});

export default Asset;