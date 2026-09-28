import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SnmpProfile = sequelize.define('SnmpProfile', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    vendor: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    sysoid_pattern: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'snmp_profiles',
    schema: 'dbo',
    timestamps: false,
});

export default SnmpProfile;
