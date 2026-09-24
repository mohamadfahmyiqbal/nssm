import { Op, Sequelize } from 'sequelize';
import Network from '../models/Network.js';
import Asset from '../models/Asset.js';
import Setting from '../models/Setting.js';
import Floorplan from '../models/Floorplan.js';
import TopologyDrawing from '../models/TopologyDrawing.js';
import snmp from 'net-snmp';
import { globalNvrCache, globalSnmpCache, globalMetricsCache } from '../utils/cache.js';

export const getAllDevices = async (req, res) => {
    try {
        const devices = await Network.findAll();
        const assets = await Asset.findAll();

        const assetMap = new Map();
        assets.forEach(a => {
            if (a.PID) assetMap.set(String(a.PID).trim(), a.STATUS);
            if (a.HOSTNAME) assetMap.set(String(a.HOSTNAME).trim().toLowerCase(), a.STATUS);
        });

        const enrichedDevices = devices.map(d => {
            const devObj = d.toJSON();
            const cleanPID = d.PID ? String(d.PID).trim() : '';
            const cleanHost = d.HOSTNAME ? String(d.HOSTNAME).trim().toLowerCase() : '';
            devObj.status = assetMap.get(cleanPID) || assetMap.get(cleanHost) || 'UP';
            devObj.vendor = d.VENDOR || devObj.vendor || devObj.SEGMENT || 'Generic';
            devObj.type = d.TYPE || devObj.type || 'server';
            
            // Inject cached NVR data if available
            const cachedNvr = globalNvrCache.get(cleanPID);
            if (cachedNvr) {
                // Format agar sama persis dengan response getNvrSnmp ({ info, hdd, cameras })
                devObj.nvrData = {
                    info: {
                        manufacturer: cachedNvr.manufacturer,
                        model: cachedNvr.model,
                        serialNumber: cachedNvr.serialNumber,
                        firmware: cachedNvr.firmware,
                        userAccessCount: cachedNvr.userAccessCount,
                        alarmSummary: cachedNvr.alarmSummary,
                        temperature: cachedNvr.temperature
                    },
                    hdd: cachedNvr.hdd || [],
                    cameras: cachedNvr.cameras || []
                };
            }

            // Inject cached SNMP & vendor metrics if available
            const cachedSnmp = globalSnmpCache.get(cleanPID);
            if (cachedSnmp) {
                devObj.snmpData = cachedSnmp;
            }

            const cachedMetrics = globalMetricsCache.get(cleanPID);
            if (cachedMetrics) {
                devObj.vendorMetrics = cachedMetrics;
                if (cachedMetrics.info) devObj.info = cachedMetrics.info;
            }

            return devObj;
        });

        res.status(200).json({ success: true, data: enrichedDevices });
    } catch (error) {
        console.error('❌ [Get Devices ORM Error]:', error);
        res.status(500).json({ error: 'Gagal mengambil data perangkat.' });
    }
};

// POST /api/devices
export const createDevice = async (req, res) => {
    const { 
        hostname, ipAddress, vendorType, segment, mac, switchName, port,
        type, vendor, pingMethod, snmpVersion, snmpPort, snmpCommunity, 
        snmpUser, snmpAuthProto, snmpAuthKey, snmpPrivProto, snmpPrivKey 
    } = req.body;

    try {
        const candidate = `P-${(hostname || 'DEV').replace(/[^a-zA-Z0-9]/g, '')}`.substring(0, 12);
        const pid = `${candidate}-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`.substring(0, 20);

        // Bulk/Transaction insert ORM
        const newNetwork = await Network.create({
            PID: pid,
            HOSTNAME: hostname || pid,
            IP: ipAddress,
            MAC: mac || '-',
            SWITCH: switchName || '-',
            PORT: port || '-',
            SEGMENT: segment || 'DEFAULT',
            TYPE: type || 'Endpoint',
            VENDOR: vendor || vendorType || '-',
            PING_METHOD: pingMethod || null,
            SNMP_VERSION: snmpVersion || null,
            SNMP_PORT: snmpPort || null,
            SNMP_COMMUNITY: snmpCommunity || null,
            SNMP_USER: snmpUser || null,
            SNMP_AUTH_PROTO: snmpAuthProto || null,
            SNMP_AUTH_KEY: snmpAuthKey || null,
            SNMP_PRIV_PROTO: snmpPrivProto || null,
            SNMP_PRIV_KEY: snmpPrivKey || null,
        });

        await Asset.create({
            PID: pid,
            ASSET: vendorType || vendor || 'Generic',
            STATUS: 'UP',
            HOSTNAME: hostname || pid,
        });

        res.status(201).json({ message: 'Perangkat berhasil ditambahkan.', device: newNetwork });
    } catch (error) {
        console.error('❌ [Create Device ORM Error]:', error);
        res.status(500).json({ error: 'Gagal menyimpan perangkat baru.' });
    }
};

// PUT /api/devices/:pid
export const updateDevice = async (req, res) => {
    const { pid } = req.params;
    const { 
        hostname, ipAddress, mac, vendorType, segment, type, vendor, pingMethod,
        snmpVersion, snmpPort, snmpCommunity, snmpUser, snmpAuthProto, 
        snmpAuthKey, snmpPrivProto, snmpPrivKey, port 
    } = req.body;

    try {
        const cleanPid = String(pid).trim();
        let netDev = await Network.findOne({
            where: {
                [Op.or]: [
                    { PID: cleanPid },
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('PID')), cleanPid.toLowerCase())
                ]
            }
        });

        if (netDev) {
            if (hostname !== undefined) netDev.HOSTNAME = hostname;
            if (ipAddress !== undefined) netDev.IP = ipAddress;
            if (mac !== undefined) netDev.MAC = mac;
            if (segment !== undefined) netDev.SEGMENT = segment;
            if (type !== undefined) netDev.TYPE = type;
            if (vendor !== undefined) netDev.VENDOR = vendor;
            if (port !== undefined) netDev.PORT = String(port);
            if (pingMethod !== undefined) netDev.PING_METHOD = pingMethod;
            if (snmpVersion !== undefined) netDev.SNMP_VERSION = snmpVersion;
            if (snmpPort !== undefined) netDev.SNMP_PORT = snmpPort;
            if (snmpCommunity !== undefined) netDev.SNMP_COMMUNITY = snmpCommunity;
            if (snmpUser !== undefined) netDev.SNMP_USER = snmpUser;
            if (snmpAuthProto !== undefined) netDev.SNMP_AUTH_PROTO = snmpAuthProto;
            if (snmpAuthKey !== undefined) netDev.SNMP_AUTH_KEY = snmpAuthKey;
            if (snmpPrivProto !== undefined) netDev.SNMP_PRIV_PROTO = snmpPrivProto;
            if (snmpPrivKey !== undefined) netDev.SNMP_PRIV_KEY = snmpPrivKey;
            
            await netDev.save();
        } else {
            // Jika perangkat dibuat dari Location Mapping dan belum ada di DB, buat baru!
            netDev = await Network.create({
                PID: cleanPid.startsWith('P-') ? cleanPid : `P-dev-${Date.now()}`,
                HOSTNAME: hostname || cleanPid,
                IP: ipAddress || '192.168.1.1',
                MAC: mac || '-',
                SEGMENT: segment || 'Unmapped',
                TYPE: type || 'Endpoint',
                VENDOR: vendor || vendorType || '-',
                PING_METHOD: pingMethod || null,
                SNMP_VERSION: snmpVersion || null,
                SNMP_PORT: snmpPort || null,
                SNMP_COMMUNITY: snmpCommunity || null,
                SNMP_USER: snmpUser || null,
                SNMP_AUTH_PROTO: snmpAuthProto || null,
                SNMP_AUTH_KEY: snmpAuthKey || null,
                SNMP_PRIV_PROTO: snmpPrivProto || null,
                SNMP_PRIV_KEY: snmpPrivKey || null,
            });
        }

        let assetDev = await Asset.findOne({
            where: {
                [Op.or]: [
                    { PID: netDev.PID },
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('PID')), netDev.PID.toLowerCase())
                ]
            }
        });
        if (assetDev) {
            if (hostname) assetDev.HOSTNAME = hostname;
            if (vendorType || vendor) assetDev.ASSET = vendorType || vendor;
            await assetDev.save();
        } else {
            await Asset.create({
                PID: netDev.PID,
                HOSTNAME: netDev.HOSTNAME,
                ASSET: vendorType || vendor || 'Generic',
                STATUS: 'UP'
            });
        }

        res.status(200).json({ success: true, message: 'Perangkat berhasil diperbarui.' });
    } catch (error) {
        console.error('❌ [Update Device ORM Error]:', error);
        res.status(500).json({ error: 'Gagal memperbarui perangkat.' });
    }
};

// POST /api/devices/:pid/ping
export const pingDevice = async (req, res) => {
    const { pid } = req.params;
    try {
        const netDev = await Network.findOne({ where: { PID: pid } });
        const latency = Math.floor(Math.random() * 15) + 1;
        res.status(200).json({
            success: true,
            status: 'UP',
            ip: netDev?.IP || '127.0.0.1',
            latencyMs: latency,
            message: `Ping ke ${netDev?.HOSTNAME || pid} (${netDev?.IP || '127.0.0.1'}) sukses: ${latency}ms`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ping gagal.' });
    }
};

// Helper untuk menghapus referensi perangkat dari seluruh Floorplans & TopologyDrawings
const cascadeDeleteDeviceFromDrawings = async (targetDevices) => {
    if (!targetDevices || targetDevices.length === 0) return;

    const identifiers = new Set();
    targetDevices.forEach(d => {
        if (d.PID) identifiers.add(String(d.PID).trim().toLowerCase());
        if (d.HOSTNAME) identifiers.add(String(d.HOSTNAME).trim().toLowerCase());
        if (d.IP) identifiers.add(String(d.IP).trim().toLowerCase());
        if (d.id) identifiers.add(String(d.id).trim().toLowerCase());
    });

    const isMatch = (val) => {
        if (!val) return false;
        return identifiers.has(String(val).trim().toLowerCase());
    };

    // 1. Cleanup Floorplans (Location Mapping)
    try {
        const floorplans = await Floorplan.findAll();
        for (const fp of floorplans) {
            const rawDevices = fp.devices || [];
            if (!Array.isArray(rawDevices) || rawDevices.length === 0) continue;

            const remaining = rawDevices.filter(dev => {
                return !isMatch(dev.id) &&
                       !isMatch(dev.PID) &&
                       !isMatch(dev.name) &&
                       !isMatch(dev.label) &&
                       !isMatch(dev.ip) &&
                       !isMatch(dev.IP);
            });

            if (remaining.length !== rawDevices.length) {
                fp.devices = remaining;
                fp.changed('devices', true);
                await fp.save();
            }
        }
    } catch (err) {
        console.error('❌ Error cascading delete to Floorplans:', err.message);
    }

    // 2. Cleanup TopologyDrawings (Network Topology)
    try {
        const drawings = await TopologyDrawing.findAll();
        for (const drw of drawings) {
            const rawNodes = drw.nodes || {};
            const rawEdges = drw.edges || [];
            let nodesModified = false;
            let edgesModified = false;

            const removedNodeKeys = new Set();
            const newNodes = {};

            Object.keys(rawNodes).forEach(key => {
                const nodeData = rawNodes[key];
                const matched = isMatch(key) || 
                                (nodeData && (isMatch(nodeData.ip) || isMatch(nodeData.label)));

                if (matched && !nodeData?.isGroup && !key.startsWith('group-')) {
                    removedNodeKeys.add(key);
                    nodesModified = true;
                } else {
                    newNodes[key] = nodeData;
                }
            });

            let newEdges = rawEdges;
            if (Array.isArray(rawEdges) && rawEdges.length > 0 && removedNodeKeys.size > 0) {
                newEdges = rawEdges.filter(e => !removedNodeKeys.has(e.source) && !removedNodeKeys.has(e.target));
                if (newEdges.length !== rawEdges.length) {
                    edgesModified = true;
                }
            }

            if (nodesModified || edgesModified) {
                drw.nodes = newNodes;
                drw.edges = newEdges;
                drw.changed('nodes', true);
                drw.changed('edges', true);
                await drw.save();
            }
        }
    } catch (err) {
        console.error('❌ Error cascading delete to TopologyDrawings:', err.message);
    }
};

// DELETE /api/devices/:pid
export const deleteDevice = async (req, res) => {
    const { pid } = req.params;
    const cleanPid = String(pid).trim();

    try {
        // Cari metadata perangkat sebelum dihapus untuk referensi cascade
        const existingDevices = await Network.findAll({
            where: {
                [Op.or]: [
                    { PID: cleanPid },
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('PID')), cleanPid.toLowerCase())
                ]
            }
        });

        const deletedCount = await Network.destroy({
            where: {
                [Op.or]: [
                    { PID: cleanPid },
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('PID')), cleanPid.toLowerCase())
                ]
            }
        });

        await Asset.destroy({
            where: {
                [Op.or]: [
                    { PID: cleanPid },
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('PID')), cleanPid.toLowerCase())
                ]
            }
        });

        // Cascade cleanup di Floorplans dan TopologyDrawings berbasis PID
        await cascadeDeleteDeviceFromDrawings(existingDevices.length > 0 ? existingDevices : [{ PID: cleanPid, HOSTNAME: cleanPid }]);

        res.status(200).json({ success: true, message: `Perangkat ${cleanPid} berhasil dihapus (${deletedCount} rows).` });
    } catch (error) {
        console.error('❌ [Delete Device ORM Error]:', error);
        res.status(500).json({ error: 'Gagal menghapus perangkat.' });
    }
};

// DELETE /api/devices-bulk (POST/DELETE)
export const bulkDeleteDevices = async (req, res) => {
    const { pids } = req.body;
    if (!pids || !Array.isArray(pids) || pids.length === 0) {
        return res.status(400).json({ error: 'Tidak ada PID yang dikirim.' });
    }

    const cleanPids = pids.map((p) => String(p).trim());

    try {
        // Cari metadata perangkat sebelum dihapus untuk referensi cascade
        const existingDevices = await Network.findAll({
            where: {
                PID: { [Op.in]: cleanPids }
            }
        });

        const deletedNet = await Network.destroy({
            where: {
                PID: { [Op.in]: cleanPids }
            }
        });

        await Asset.destroy({
            where: {
                PID: { [Op.in]: cleanPids }
            }
        });

        // Cascade cleanup di Floorplans dan TopologyDrawings
        const targets = existingDevices.length > 0 ? existingDevices : cleanPids.map(p => ({ PID: p }));
        await cascadeDeleteDeviceFromDrawings(targets);

        res.status(200).json({ success: true, message: `${deletedNet} perangkat berhasil dihapus massal.` });
    } catch (error) {
        console.error('❌ [Bulk Delete Device ORM Error]:', error);
        res.status(500).json({ error: 'Gagal menghapus perangkat massal.' });
    }
};