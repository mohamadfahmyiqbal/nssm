import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TopologyDrawing = sequelize.define('TopologyDrawing', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    nodes: {
        type: DataTypes.TEXT,
        get() {
            const val = this.getDataValue('nodes');
            return val ? (typeof val === 'string' ? JSON.parse(val) : val) : {};
        },
        set(val) {
            this.setDataValue('nodes', typeof val === 'string' ? val : JSON.stringify(val));
        }
    },
    edges: {
        type: DataTypes.TEXT,
        get() {
            const val = this.getDataValue('edges');
            return val ? (typeof val === 'string' ? JSON.parse(val) : val) : [];
        },
        set(val) {
            this.setDataValue('edges', typeof val === 'string' ? val : JSON.stringify(val));
        }
    },
}, {
    tableName: 'TopologyDrawings',
    timestamps: true,
});

export default TopologyDrawing;
