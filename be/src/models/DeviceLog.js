import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DeviceLog = sequelize.define('DeviceLog', {
    id: {
        type: DataTypes.INTEGER,
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
    PREVIOUS_STATUS: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    NEW_STATUS: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    METHOD: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    LATENCY: {
        type: DataTypes.INTEGER,
        allowNull: true
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
    }
}, {
    tableName: 'DeviceLogs',
    timestamps: true,
    indexes: [
        {
            fields: ['PID']
        }
    ]
});

export default DeviceLog;
