import Floorplan from '../models/Floorplan.js';
import Network from '../models/Network.js';
import Asset from '../models/Asset.js';
import { Op } from 'sequelize';

// Ambil daftar ringkas seluruh denah
export const getAllFloorplans = async (req, res) => {
    try {
        // ⚠️ JANGAN PANGGIL Floorplan.sync() DI SINI
        let floorplans = await Floorplan.findAll({
            attributes: ['id', 'name', 'type', 'description', 'updatedAt'],
            order: [['type', 'ASC'], ['id', 'ASC']]
        });

        // Buat 1 Master Plan default jika database masih kosong
        if (floorplans.length === 0) {
            const defaultMaster = await Floorplan.create({
                name: 'Master Facility Blueprint',
                type: 'MASTER',
                description: 'Denah Utama Seluruh Area Site Facility',
                lines: [],
                rooms: [],
                devices: []
            });
            floorplans = [defaultMaster];
        }

        return res.status(200).json({
            success: true,
            data: floorplans
        });
    } catch (error) {
        console.error('❌ Error getAllFloorplans:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Ambil 1 denah lengkap berdasarkan ID
export const getFloorplanById = async (req, res) => {
    try {
        const { id } = req.params;
        const floorplan = await Floorplan.findByPk(id);

        if (!floorplan) {
            return res.status(404).json({ success: false, message: 'Denah tidak ditemukan' });
        }

        return res.status(200).json({ success: true, data: floorplan });
    } catch (error) {
        console.error('❌ Error getFloorplanById:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Simpan atau Perbarui Denah (Create / Update)
export const saveFloorplan = async (req, res) => {
    try {
        const { id, name, type = 'DETAIL', description, lines, rooms, devices } = req.body;

        let floorplan;

        if (id) {
            floorplan = await Floorplan.findByPk(id);
        }

        if (!floorplan) {
            floorplan = await Floorplan.create({
                name: name || 'Denah Baru',
                type,
                description,
                lines: lines || [],
                rooms: rooms || [],
                devices: []
            });
        } else {
            if (name) floorplan.name = name;
            if (type) floorplan.type = type;
            if (description !== undefined) floorplan.description = description;
            floorplan.lines = lines || [];
            floorplan.rooms = rooms || [];
        }

        // Auto-sync devices placed on floorplan to Network & Asset DB
        if (devices && Array.isArray(devices) && devices.length > 0) {
            for (const dev of devices) {
                const hostname = String(dev.label || dev.name || '').trim();
                const devPid = String(dev.PID || dev.id || '').trim();
                if (!devPid && !hostname) continue;

                const cleanDevIp = dev.ip && dev.ip !== 'N/A' && dev.ip !== '192.168.1.100' ? dev.ip : (dev.ip || '192.168.1.100');

                try {
                    let existingNet = null;

                    // 1. Cari via PID jika valid (bukan id sementara canvas dev-)
                    if (devPid && !devPid.startsWith('dev-')) {
                        existingNet = await Network.findOne({
                            where: {
                                [Op.or]: [
                                    { PID: devPid },
                                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('PID')), devPid.toLowerCase())
                                ]
                            }
                        });
                    }

                    // 2. Fallback: Cari via HOSTNAME jika PID belum terikat agar tidak menduplikasi perangkat Inventory
                    if (!existingNet && hostname) {
                        existingNet = await Network.findOne({
                            where: Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('HOSTNAME')), hostname.toLowerCase())
                        });
                    }

                    // 3. Fallback: Cari via IP unik jika tersedia
                    if (!existingNet && cleanDevIp && cleanDevIp !== '192.168.1.100') {
                        existingNet = await Network.findOne({
                            where: { IP: cleanDevIp }
                        });
                    }

                    let netPid;

                    if (!existingNet) {
                        // Perangkat benar-benar baru dibuat di kanvas
                        netPid = (devPid && !devPid.startsWith('dev-') && devPid.startsWith('P-')) ? devPid : null;
                        if (!netPid) {
                            const candidate = `P-${(hostname || 'DEV').replace(/[^a-zA-Z0-9]/g, '')}`.substring(0, 12);
                            netPid = `${candidate}-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`.substring(0, 20);

                            let count = 0;
                            while (await Network.findByPk(netPid) && count < 5) {
                                netPid = `P-${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 900 + 100)}`.substring(0, 20);
                                count++;
                            }
                        }

                        // Berikan PID ke objek dev denah agar tersimpan permanen di JSON floorplan
                        dev.PID = netPid;
                        dev.id = netPid;

                        existingNet = await Network.create({
                            PID: netPid,
                            HOSTNAME: hostname || netPid,
                            IP: cleanDevIp,
                            MAC: dev.mac || '-',
                            SWITCH: '-',
                            PORT: '-',
                            SEGMENT: name || 'DEFAULT',
                            TYPE: dev.type || 'server',
                            VENDOR: dev.vendor || 'Generic'
                        });
                    } else {
                        // Perangkat sudah ada di Inventory -> ikat PID-nya
                        netPid = existingNet.PID;
                        dev.PID = netPid;
                        dev.id = netPid;

                        let needsUpdate = false;
                        if (name && existingNet.SEGMENT !== name) {
                            existingNet.SEGMENT = name;
                            needsUpdate = true;
                        }
                        if (cleanDevIp && cleanDevIp !== '192.168.1.100' && existingNet.IP !== cleanDevIp) {
                            existingNet.IP = cleanDevIp;
                            needsUpdate = true;
                        }
                        if (dev.type && existingNet.TYPE !== dev.type) {
                            existingNet.TYPE = dev.type;
                            needsUpdate = true;
                        }
                        if (dev.vendor && dev.vendor !== 'Generic' && existingNet.VENDOR !== dev.vendor) {
                            existingNet.VENDOR = dev.vendor;
                            needsUpdate = true;
                        }
                        if (needsUpdate) {
                            await existingNet.save();
                        }
                    }

                    // Sinkronisasi tabel Asset
                    let existingAsset = await Asset.findOne({
                        where: {
                            [Op.or]: [
                                { PID: netPid },
                                Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('PID')), netPid.toLowerCase())
                            ]
                        }
                    });

                    if (!existingAsset) {
                        await Asset.create({
                            PID: netPid,
                            ASSET: dev.vendor || 'Generic',
                            STATUS: 'UP',
                            HOSTNAME: existingNet.HOSTNAME || hostname || netPid
                        });
                    } else {
                        let assetNeedsUpdate = false;
                        if (existingNet.HOSTNAME && existingAsset.HOSTNAME !== existingNet.HOSTNAME) {
                            existingAsset.HOSTNAME = existingNet.HOSTNAME;
                            assetNeedsUpdate = true;
                        }
                        if (dev.vendor && dev.vendor !== 'Generic' && existingAsset.ASSET !== dev.vendor) {
                            existingAsset.ASSET = dev.vendor;
                            assetNeedsUpdate = true;
                        }
                        if (assetNeedsUpdate) {
                            await existingAsset.save();
                        }
                    }
                } catch (dbErr) {
                    const detailMsg = dbErr.errors ? dbErr.errors.map(e => e.message).join(', ') : dbErr.message;
                    console.error(`⚠️ Sync device ${devPid || hostname} skipped:`, detailMsg);
                }
            }
        }

        // Simpan floorplan BESERTA PID devices yang sudah tersinkronisasi permanen
        floorplan.devices = devices || [];
        await floorplan.save();

        return res.status(200).json({
            success: true,
            message: 'Denah & Perangkat berhasil disimpan dan disinkronisasi!',
            data: floorplan
        });
    } catch (error) {
        console.error('❌ Error saveFloorplan:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Hapus Denah Detail
export const deleteFloorplan = async (req, res) => {
    try {
        const { id } = req.params;
        const floorplan = await Floorplan.findByPk(id);

        if (!floorplan) {
            return res.status(404).json({ success: false, message: 'Denah tidak ditemukan' });
        }

        // Validasi MASTER dihapus sesuai permintaan

        await floorplan.destroy();

        return res.status(200).json({
            success: true,
            message: 'Denah berhasil dihapus'
        });
    } catch (error) {
        console.error('❌ Error deleteFloorplan:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};