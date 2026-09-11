// models/Network.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Network = sequelize.define('Network', {
    PID: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    HOSTNAME: DataTypes.STRING,
    IP: DataTypes.STRING,
    MAC: DataTypes.STRING,
    SWITCH: DataTypes.STRING,
    PORT: DataTypes.STRING,
    SEGMENT: DataTypes.STRING,
    AGENT_ID: DataTypes.STRING,
    TYPE: DataTypes.STRING,
    VENDOR: DataTypes.STRING,
    PING_METHOD: DataTypes.STRING,
    SNMP_VERSION: DataTypes.STRING,
    SNMP_PORT: DataTypes.STRING,
    SNMP_COMMUNITY: DataTypes.STRING,
    SNMP_USER: DataTypes.STRING,
    SNMP_AUTH_PROTO: DataTypes.STRING,
    SNMP_AUTH_KEY: DataTypes.STRING,
    SNMP_PRIV_PROTO: DataTypes.STRING,
    SNMP_PRIV_KEY: DataTypes.STRING,
}, {
    tableName: 'Network',
    schema: 'dbo',
    timestamps: false,
});

export default Network;