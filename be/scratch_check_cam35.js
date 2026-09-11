import Network from './src/models/Network.js';
import Asset from './src/models/Asset.js';
import TopologyDrawing from './src/models/TopologyDrawing.js';
import Floorplan from './src/models/Floorplan.js';

const check = async () => {
    try {
        const net = await Network.findAll();
        const matches = net.filter(n => (n.HOSTNAME || '').toLowerCase().includes('cam-35') || (n.PID || '').toLowerCase().includes('cam-35'));
        console.log("=== NETWORK MATCHES ===");
        console.log(matches.map(m => m.toJSON()));

        const drawings = await TopologyDrawing.findAll();
        console.log("=== TOPOLOGY DRAWINGS ===");
        drawings.forEach(d => {
            const rawNodes = d.nodes || {};
            const keys = Object.keys(rawNodes).filter(k => {
                const node = rawNodes[k];
                return k.toLowerCase().includes('cam-35') || (node?.label && node.label.toLowerCase().includes('cam-35')) || (node?.ip && matches.some(m => m.IP === node.ip));
            });
            console.log(`Drawing [${d.id}] "${d.name}": matching node keys:`, keys, keys.map(k => rawNodes[k]));
        });

        const floorplans = await Floorplan.findAll();
        console.log("=== FLOORPLANS ===");
        floorplans.forEach(f => {
            const devs = (f.devices || []).filter(d => (d.label || '').toLowerCase().includes('cam-35') || (d.name || '').toLowerCase().includes('cam-35'));
            console.log(`Floorplan [${f.id}] "${f.name}": matching devs:`, devs);
        });
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
};

check();
