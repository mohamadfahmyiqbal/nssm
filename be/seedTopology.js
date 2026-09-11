import { testDbConnection } from './src/config/database.js';
import TopologyNode from './src/models/TopologyNode.js';
import TopologyEdge from './src/models/TopologyEdge.js';
import { initialNodes, initialEdges } from '../FEntms/src/data/topologyData.js';

const seed = async () => {
    try {
        await testDbConnection();
        await TopologyNode.sync({ alter: true });
        await TopologyEdge.sync({ alter: true });

        // Seed Nodes
        for (const node of initialNodes) {
            await TopologyNode.upsert({
                id: node.id,
                type: node.type,
                label: node.data.label,
                layer: node.data.layer,
                ip: node.data.ip,
                category: node.data.category,
                subType: node.data.subType,
                vlan: node.data.vlan,
                location: node.data.location,
                floor: node.data.floor,
                x_pos: node.position.x,
                y_pos: node.position.y,
            });
        }
        console.log(`✅ Seeded ${initialNodes.length} Topology Nodes`);

        // Seed Edges
        for (const edge of initialEdges) {
            await TopologyEdge.upsert({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                animated: edge.animated || false,
                stroke_color: edge.style?.stroke,
                stroke_width: edge.style?.strokeWidth || 1.5,
                stroke_dasharray: edge.style?.strokeDasharray,
            });
        }
        console.log(`✅ Seeded ${initialEdges.length} Topology Edges`);
        
        console.log('🎉 Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seed();
