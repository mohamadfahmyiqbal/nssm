import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import TopologyNode from './TopologyNode.js';

const TopologyEdge = sequelize.define('TopologyEdge', {
    id: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        allowNull: false,
    },
    source: {
        type: DataTypes.STRING(50),
        allowNull: false,
        references: {
            model: TopologyNode,
            key: 'id'
        }
    },
    target: {
        type: DataTypes.STRING(50),
        allowNull: false,
        references: {
            model: TopologyNode,
            key: 'id'
        }
    },
    animated: {
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
    },
    stroke_color: DataTypes.STRING(20),
    stroke_width: {
        type: DataTypes.FLOAT,
        defaultValue: 1.5,
    },
    stroke_dasharray: DataTypes.STRING(20)
}, {
    tableName: 'TopologyEdges',
    schema: 'dbo',
    timestamps: false,
});

TopologyNode.hasMany(TopologyEdge, { foreignKey: 'source', as: 'sourceEdges' });
TopologyNode.hasMany(TopologyEdge, { foreignKey: 'target', as: 'targetEdges' });
TopologyEdge.belongsTo(TopologyNode, { foreignKey: 'source', as: 'sourceNode' });
TopologyEdge.belongsTo(TopologyNode, { foreignKey: 'target', as: 'targetNode' });

export default TopologyEdge;
