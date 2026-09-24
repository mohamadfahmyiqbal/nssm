import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DeviceAlert = sequelize.define('DeviceAlert', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    PID: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    HOSTNAME: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    IP: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    ALERT_TYPE: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    SEVERITY: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    METRIC_VALUE: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    THRESHOLD_VALUE: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    MESSAGE: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    IS_ACKNOWLEDGED: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    ACK_BY: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    ACK_AT: {
        type: DataTypes.DATE,
        allowNull: true
    },
    ACK_NOTE: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    RECORDED_AT: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'DeviceAlerts',
    timestamps: true,
    indexes: [
        {
            fields: ['PID', 'RECORDED_AT']
        },
        {
            fields: ['SEVERITY', 'IS_ACKNOWLEDGED']
        }
    ]
});

export default DeviceAlert;
