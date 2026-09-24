import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const IncidentReport = sequelize.define('IncidentReport', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        field: 'ID'
    },
    reportNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'REPORT_NUMBER'
    },
    reportDate: {
        type: DataTypes.STRING(30),
        allowNull: false,
        field: 'REPORT_DATE'
    },
    reporter: {
        type: DataTypes.STRING(150),
        allowNull: false,
        field: 'REPORTER'
    },
    discoveredTime: {
        type: DataTypes.STRING(30),
        allowNull: true,
        field: 'DISCOVERED_TIME'
    },
    startTime: {
        type: DataTypes.STRING(30),
        allowNull: true,
        field: 'START_TIME'
    },
    endTime: {
        type: DataTypes.STRING(30),
        allowNull: true,
        field: 'END_TIME'
    },
    totalDowntime: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'TOTAL_DOWNTIME'
    },
    status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'OPEN',
        field: 'STATUS'
    },
    devicesJson: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'DEVICES_JSON'
    },
    primaryHostname: {
        type: DataTypes.STRING(150),
        allowNull: true,
        field: 'PRIMARY_HOSTNAME'
    },
    primaryIp: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'PRIMARY_IP'
    },
    location: {
        type: DataTypes.STRING(150),
        allowNull: true,
        field: 'LOCATION'
    },
    assignedTechnician: {
        type: DataTypes.STRING(150),
        allowNull: true,
        field: 'ASSIGNED_TECHNICIAN'
    },
    assignedTechnicianNik: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'ASSIGNED_TECHNICIAN_NIK'
    },
    symptom: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'SYMPTOM'
    },
    impact: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'IMPACT'
    },
    rootCause: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'ROOT_CAUSE'
    },
    actionTaken: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'ACTION_TAKEN'
    },
    createdBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'SYSTEM',
        field: 'CREATED_BY'
    }
}, {
    tableName: 'IncidentReports',
    timestamps: true
});

export default IncidentReport;
