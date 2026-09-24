import TopologyNode from '../models/TopologyNode.js';
import TopologyEdge from '../models/TopologyEdge.js';
import TopologyDrawing from '../models/TopologyDrawing.js';
import Setting from '../models/Setting.js';
import Network from '../models/Network.js';
import Asset from '../models/Asset.js';
import { performRootCauseAnalysis } from '../services/rcaService.js';

export const getTopology = async (req, res) => {
    try {
        const nodesData = await TopologyNode.findAll();
        const edgesData = await TopologyEdge.findAll();

        const formattedNodes = nodesData.map(node => ({
            id: node.id,
            type: node.type,
            data: {
                label: node.label,
                layer: node.layer,
                ip: node.ip,
                category: node.category,
                subType: node.subType,
                vlan: node.vlan,
                location: node.location,
                floor: node.floor,
                status: 'down',
                cpu: '0%'
            },
            position: {
                x: node.x_pos,
                y: node.y_pos
            }
        }));

        const formattedEdges = edgesData.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            animated: edge.animated,
            style: {
                stroke: edge.stroke_color,
                strokeWidth: edge.stroke_width,
                strokeDasharray: edge.stroke_dasharray
            }
        }));

        res.status(200).json({ success: true, nodes: formattedNodes, edges: formattedEdges });
    } catch (error) {
        console.error('❌ [Get Topology Error]:', error);
        res.status(500).json({ success: false, error: 'Gagal mengambil data topologi.' });
    }
};

/* ==========================================================================
   MULTI-DRAWING TOPOLOGY CONTROLLERS
   ========================================================================== */

// Ambil daftar seluruh drawing topology
export const getAllTopologyDrawings = async (req, res) => {
    try {
        let drawings = await TopologyDrawing.findAll({
            attributes: ['id', 'name', 'type', 'description', 'updatedAt'],
            order: [['type', 'ASC'], ['id', 'ASC']]
        });

        // Jika belum ada drawing sama sekali, inisialisasi Master Topology dari setting eksisting jika ada
        if (drawings.length === 0) {
            let initialNodes = {};
            let initialEdges = [];

            try {
                const settingNodes = await Setting.findOne({ where: { key: 'topology_layout' } });
                if (settingNodes?.value) {
                    initialNodes = typeof settingNodes.value === 'string' ? JSON.parse(settingNodes.value) : settingNodes.value;
                }
                const settingEdges = await Setting.findOne({ where: { key: 'topology_edges' } });
                if (settingEdges?.value) {
                    initialEdges = typeof settingEdges.value === 'string' ? JSON.parse(settingEdges.value) : settingEdges.value;
                }
            } catch (e) {
                console.error('Failed to migrate legacy topology settings:', e);
            }

            const defaultMaster = await TopologyDrawing.create({
                name: 'Master Network Topology',
                type: 'MASTER',
                description: 'Topologi Jaringan Utama Seluruh Perangkat',
                nodes: initialNodes,
                edges: initialEdges
            });
            drawings = [defaultMaster];
        }

        return res.status(200).json({
            success: true,
            data: drawings
        });
    } catch (error) {
        console.error('❌ Error getAllTopologyDrawings:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Ambil 1 drawing detail berdasarkan ID
export const getTopologyDrawingById = async (req, res) => {
    try {
        const { id } = req.params;
        const drawing = await TopologyDrawing.findByPk(id);

        if (!drawing) {
            return res.status(404).json({ success: false, message: 'Drawing topologi tidak ditemukan' });
        }

        return res.status(200).json({ success: true, data: drawing });
    } catch (error) {
        console.error('❌ Error getTopologyDrawingById:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Simpan atau Perbarui Drawing Topologi (Create / Update)
export const saveTopologyDrawing = async (req, res) => {
    try {
        const { id, name, type = 'DETAIL', description, nodes, edges } = req.body;

        let drawing;

        if (id) {
            drawing = await TopologyDrawing.findByPk(id);
            if (drawing) {
                if (name) drawing.name = name;
                if (type) drawing.type = type;
                if (description !== undefined) drawing.description = description;
                drawing.nodes = nodes || {};
                drawing.edges = edges || [];
                drawing.changed('nodes', true);
                drawing.changed('edges', true);
                await drawing.save();
            }
        }

        if (!drawing) {
            drawing = await TopologyDrawing.create({
                name: name || 'Drawing Topologi Baru',
                type,
                description,
                nodes: nodes || {},
                edges: edges || []
            });
        }

        // Simpan juga ke settings key topology_layout / topology_edges sebagai backup jika master
        if (drawing.type === 'MASTER') {
            try {
                const saveSettingHelper = async (key, val) => {
                    let s = await Setting.findOne({ where: { key } });
                    const strVal = typeof val === 'object' ? JSON.stringify(val) : val;
                    if (s) {
                        s.value = strVal;
                        await s.save();
                    } else {
                        await Setting.create({ key, value: strVal });
                    }
                };
                await saveSettingHelper('topology_layout', drawing.nodes);
                await saveSettingHelper('topology_edges', drawing.edges);
            } catch (e) {}
        }

        return res.status(200).json({
            success: true,
            message: 'Drawing topologi berhasil disimpan!',
            data: drawing
        });
    } catch (error) {
        console.error('❌ Error saveTopologyDrawing:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Hapus Drawing Topologi
export const deleteTopologyDrawing = async (req, res) => {
    try {
        const { id } = req.params;
        const drawing = await TopologyDrawing.findByPk(id);

        if (!drawing) {
            return res.status(404).json({ success: false, message: 'Drawing topologi tidak ditemukan' });
        }

        await drawing.destroy();

        return res.status(200).json({
            success: true,
            message: 'Drawing topologi berhasil dihapus'
        });
    } catch (error) {
        console.error('❌ Error deleteTopologyDrawing:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Ambil Laporan Root Cause Analysis (RCA) Terkini
export const getRootCauseAnalysis = async (req, res) => {
    try {
        const [devices, assets] = await Promise.all([
            Network.findAll(),
            Asset.findAll()
        ]);

        const validDevices = devices.filter(d => d.IP && d.IP !== '-');
        const statusMap = new Map();
        
        assets.forEach(a => {
            statusMap.set(a.PID, a.STATUS || 'DOWN');
        });

        const rcaReport = performRootCauseAnalysis(validDevices, statusMap);

        return res.status(200).json({
            success: true,
            data: rcaReport
        });
    } catch (error) {
        console.error('❌ Error getRootCauseAnalysis:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
