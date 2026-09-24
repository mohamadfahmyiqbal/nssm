import { DataTypes } from 'sequelize';
import sequelizeITAM from '../config/databaseITAM.js';

const StandardMaintenance = sequelizeITAM.define('StandardMaintenance', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    yearly_standard_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    kategori: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    subKategori: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    namaPerangkat: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    tipePerangkat: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    subPerangkat: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    source_file: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    imported_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    imported_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'standard_maintenances',
    timestamps: false,
});

export default StandardMaintenance;
