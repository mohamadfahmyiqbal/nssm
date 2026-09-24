import { DataTypes } from 'sequelize';
import sequelizeITAM from '../config/databaseITAM.js';

const MaintenanceSchedule = sequelizeITAM.define('MaintenanceSchedule', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    asset_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
    },
    yearly_standard_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    standard_maintenance_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    periodik: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    next_maintenance_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    cancel_reason: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    next_maintenance_end_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    periodik_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    periodik_freq: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    periodik_unit: {
        type: DataTypes.STRING(10),
        allowNull: true,
    },
}, {
    tableName: 'maintenance_schedules',
    timestamps: false,
});

export default MaintenanceSchedule;
