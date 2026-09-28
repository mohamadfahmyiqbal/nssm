import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import SnmpProfile from './SnmpProfile.js';

const SnmpProfileOid = sequelize.define('SnmpProfileOid', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    profile_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: SnmpProfile,
            key: 'id'
        }
    },
    metric_key: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    label: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    mib_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    object_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    oid: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    oid_type: {
        type: DataTypes.STRING(20),
        defaultValue: 'scalar',
    },
    value_type: {
        type: DataTypes.STRING(20),
        defaultValue: 'gauge',
    },
    unit: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    formula: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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
    tableName: 'snmp_profile_oids',
    schema: 'dbo',
    timestamps: false,
});

SnmpProfile.hasMany(SnmpProfileOid, { foreignKey: 'profile_id', as: 'oids', onDelete: 'CASCADE' });
SnmpProfileOid.belongsTo(SnmpProfile, { foreignKey: 'profile_id', as: 'profile' });

export default SnmpProfileOid;
