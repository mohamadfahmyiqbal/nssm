import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TopologyNode = sequelize.define('TopologyNode', {
    id: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    label: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    layer: DataTypes.STRING(50),
    ip: DataTypes.STRING(50),
    category: DataTypes.STRING(50),
    subType: DataTypes.STRING(50),
    vlan: DataTypes.STRING(50),
    location: DataTypes.STRING(150),
    floor: DataTypes.STRING(50),
    x_pos: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    y_pos: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    }
}, {
    tableName: 'TopologyNodes',
    schema: 'dbo',
    timestamps: false,
});

export default TopologyNode;
