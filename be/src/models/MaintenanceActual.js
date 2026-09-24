import { DataTypes } from 'sequelize';
import sequelizeITAM from '../config/databaseITAM.js';

const MaintenanceActual = sequelizeITAM.define('MaintenanceActual', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    schedule_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    check_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    tanggal: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    legend: {
        type: DataTypes.STRING(10),
        allowNull: true,
    },
    created_by: {
        type: DataTypes.BIGINT,
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
}, {
    tableName: 'maintenance_actual',
    timestamps: false,
});

export default MaintenanceActual;
