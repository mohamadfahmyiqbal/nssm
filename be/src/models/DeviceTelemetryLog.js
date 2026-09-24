import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DeviceTelemetryLog = sequelize.define('DeviceTelemetryLog', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    PID: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    IP: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    DEVICE_TYPE: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    CPU_USAGE: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    RAM_USAGE: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    TEMPERATURE: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    TRAFFIC_IN: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    TRAFFIC_OUT: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    PORT_DATA: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    RECORDED_AT: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'DeviceTelemetryLogs',
    timestamps: true,
    indexes: [
        {
            fields: ['PID', 'RECORDED_AT']
        },
        {
            fields: ['IP', 'RECORDED_AT']
        }
    ]
});

export default DeviceTelemetryLog;
