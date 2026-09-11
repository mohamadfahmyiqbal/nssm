import snmp from 'net-snmp';
import { Op, Sequelize } from 'sequelize';
import Network from '../models/Network.js';
import Asset from '../models/Asset.js';
import Setting from '../models/Setting.js';
import { createSnmpSession } from '../services/snmpV3Service.js';
import { resolveVendorProfile, fetchVendorMetrics } from '../services/vendorSnmpService.js';

// GET /api/devices/:ip/snmp
export const getDeviceSnmp = async (req, res) => {
    const { ip } = req.params;

    try {
        // Ambil PID perangkat berdasarkan IP untuk pengecekan override
        const device = await Network.findOne({ where: { IP: ip } });
        const pid = device ? device.PID : null;

        // Cek override metode koneksi dari database
        const methodSetting = await Setting.findOne({ where: { key: 'polling_methods' } });
        if (methodSetting && methodSetting.value) {
            try {
                const pollingOverrides = JSON.parse(methodSetting.value);
                const methodOverride = pollingOverrides[ip] || (pid ? pollingOverrides[pid] : null);
                
                if (methodOverride && methodOverride !== 'snmp') {
                    return res.status(200).json({
                        success: false,
                        message: `SNMP dinonaktifkan karena metode disetel ke ${methodOverride.toUpperCase()}`
                    });
                }
            } catch (e) {
                console.error('Gagal parsing JSON polling_methods dari Settings');
            }
        }

        // Cek credentials di tabel Settings (key: 'snmp_credentials')
        const snmpSetting = await Setting.findOne({ where: { key: 'snmp_credentials' } });
        let credentials = {};

        if (snmpSetting && snmpSetting.value) {
            try {
                credentials = JSON.parse(snmpSetting.value);
            } catch (e) {
                console.error('Gagal parsing JSON snmp_credentials dari Settings');
            }
        }

        let credential = { ...(credentials[ip] || {}) };

        // Gunakan kredensial spesifik perangkat dari tabel Network jika tersedia
        if (device) {
            if (device.SNMP_VERSION) credential.version = device.SNMP_VERSION;
            if (device.SNMP_PORT) credential.port = parseInt(device.SNMP_PORT);
            if (device.SNMP_COMMUNITY) credential.community = device.SNMP_COMMUNITY;
            if (device.SNMP_USER) credential.username = device.SNMP_USER;
            if (device.SNMP_AUTH_PROTO) credential.authProtocol = device.SNMP_AUTH_PROTO;
            if (device.SNMP_AUTH_KEY) credential.authKey = device.SNMP_AUTH_KEY;
            if (device.SNMP_PRIV_PROTO) credential.privProtocol = device.SNMP_PRIV_PROTO;
            if (device.SNMP_PRIV_KEY) credential.privKey = device.SNMP_PRIV_KEY;
        }

        const session = createSnmpSession(ip, credential, { retries: 1, timeout: 5000 });

        // Menangkap event error internal dari net-snmp untuk mencegah crash Unhandled 'error'
        session.on('error', (err) => {
            session.close();
            console.error(`❌ [SNMP Internal Error] on ${ip}:`, err.message);
            // Jangan return res.status(500) di sini jika sudah dikirim dari callback get()
        });

        const OID_SYS_INFO = [
            '1.3.6.1.2.1.1.1.0',      // 0: System Description
            '1.3.6.1.2.1.1.3.0',      // 1: System Uptime
            '1.3.6.1.2.1.1.5.0',      // 2: System Name
            '1.3.6.1.2.1.1.6.0',      // 3: System Location
            '1.3.6.1.2.1.2.1.0',      // 4: Total Interfaces
            '1.3.6.1.2.1.7.1.0',      // 5: UDP In Datagrams
            '1.3.6.1.2.1.2.2.1.10.1', // 6: Network In
            '1.3.6.1.2.1.2.2.1.16.1'  // 7: Network Out
        ];

        session.get(OID_SYS_INFO, (error, varbinds) => {
            if (error) {
                session.close();
                console.error(`❌ [SNMP Error] on ${ip}:`, error.toString());
                return res.status(500).json({ success: false, error: 'Failed to fetch SNMP data', details: error.toString() });
            }

            const sysDescr = (varbinds[0] && !snmp.isVarbindError(varbinds[0])) ? varbinds[0].value.toString().split('\n')[0] : 'N/A';
            
            let uptimeFormatted = 'N/A';
            if (varbinds[1] && varbinds[1].value !== undefined && !snmp.isVarbindError(varbinds[1])) {
                const uptimeTicks = varbinds[1].value;
                const uptimeSeconds = Math.floor(uptimeTicks / 100);
                const days = Math.floor(uptimeSeconds / (3600 * 24));
                const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
                const minutes = Math.floor((uptimeSeconds % 3600) / 60);
                uptimeFormatted = `${days}d ${hours}h ${minutes}m`;
            }

            const sysName = (varbinds[2] && !snmp.isVarbindError(varbinds[2])) ? varbinds[2].value.toString() : 'N/A';
            const sysLocation = (varbinds[3] && !snmp.isVarbindError(varbinds[3])) ? varbinds[3].value.toString() : 'N/A';
            const totalInterfaces = (varbinds[4] && !snmp.isVarbindError(varbinds[4])) ? varbinds[4].value.toString() : 'N/A';
            const udpDatagrams = (varbinds[5] && !snmp.isVarbindError(varbinds[5])) ? varbinds[5].value.toString() : 'N/A';
            const netIn = (varbinds[6] && !snmp.isVarbindError(varbinds[6])) ? (Number(varbinds[6].value) / (1024 * 1024)).toFixed(2) + ' MB' : 'N/A';
            const netOut = (varbinds[7] && !snmp.isVarbindError(varbinds[7])) ? (Number(varbinds[7].value) / (1024 * 1024)).toFixed(2) + ' MB' : 'N/A';

            // Mengambil nama interface (ifDescr) dan status (ifStatus) secara berurutan
            let ifDescrs = {};
            let ports = [];
            
            session.subtree('1.3.6.1.2.1.2.2.1.2', 48, (row) => {
                row.forEach(vb => {
                    if (!snmp.isVarbindError(vb)) {
                        const idx = vb.oid.toString().split('.').pop();
                        ifDescrs[idx] = vb.value.toString();
                    }
                });
            }, (err1) => {
                session.subtree('1.3.6.1.2.1.2.2.1.8', 48, (row) => {
                    row.forEach(vb => {
                        if (!snmp.isVarbindError(vb)) {
                            const idx = vb.oid.toString().split('.').pop();
                            const descr = ifDescrs[idx] || '';
                            const descrLower = descr.toLowerCase();
                            
                            // Hanya masukkan port fisik (Ethernet/Port) dan abaikan Vlan, Null, Loopback, Stack
                            const isPhysical = descrLower.includes('ethernet') || (descrLower.includes('port') && !descrLower.includes('stack'));
                            const isLogical = descrLower.includes('vlan') || descrLower.includes('null') || descrLower.includes('loopback');
                            
                            if (isPhysical && !isLogical) {
                                let shortName = idx;
                                const isSFP = descrLower.includes('tengigabit') || descrLower.includes('fortygigabit') || descrLower.includes('sfp');
                                
                                // Deteksi format Cisco/HPE: e.g. GigabitEthernet1/0/24 atau GigabitEthernet0/0
                                const portMatch = descr.match(/(?:(\d+)\/)?(\d+)\/(\d+)$/);
                                
                                if (portMatch) {
                                    const module = portMatch[2];
                                    const portNum = portMatch[3];
                                    
                                    if (module === '0' && portNum === '0') {
                                        shortName = 'MGT';
                                    } else if (module !== '0' || isSFP) {
                                        // Modul > 0 pada Catalyst (misal 1/1/1) adalah modul SFP/Uplink, meskipun speednya masih Gigabit.
                                        shortName = 'SFP' + portNum;
                                    } else {
                                        shortName = portNum;
                                    }
                                } else {
                                    // Fallback format umum yang hanya berakhiran angka
                                    const endNumMatch = descr.match(/(\d+)$/);
                                    shortName = endNumMatch ? endNumMatch[1] : idx;
                                    
                                    if (isSFP) {
                                        shortName = 'SFP' + shortName;
                                    } else if (descrLower.includes('fastethernet')) {
                                        shortName = 'Fa' + shortName;
                                    }
                                }

                                ports.push({
                                    index: idx,
                                    name: descr,
                                    shortName: shortName,
                                    status: vb.value === 1 ? 'up' : 'down'
                                });
                            }
                        }
                    });
                }, (err2) => {
                    session.close();
                    
                    if (device) {
                        Asset.update({ STATUS: 'UP' }, {
                            where: {
                                [Op.or]: [
                                    { PID: device.PID },
                                    { HOSTNAME: device.HOSTNAME }
                                ]
                            }
                        }).catch(() => {});
                    }

                    return res.status(200).json({
                        success: true,
                        data: {
                            uptime: uptimeFormatted,
                            sysName,
                            sysDescr,
                            sysLocation,
                            totalInterfaces,
                            udpDatagrams,
                            networkTraffic: { in: netIn, out: netOut },
                            cpu: 'N/A',
                            memory: 'N/A',
                            storage: 'N/A',
                            storageUsed: '0%',
                            ports: ports
                        }
                    });
                });
            });
        });
    } catch (error) {
        console.error('❌ [SNMP Controller Error]:', error);
        res.status(500).json({ success: false, error: 'Server error during SNMP fetch' });
    }
};

// GET /api/devices/:ip/nvr-snmp
export const getNvrSnmp = async (req, res) => {
    const { ip } = req.params;
    
    // Cek credentials di tabel Settings (key: 'snmp_credentials')
    const snmpSetting = await Setting.findOne({ where: { key: 'snmp_credentials' } });
    let credentials = {};

    if (snmpSetting && snmpSetting.value) {
        try {
            credentials = JSON.parse(snmpSetting.value);
        } catch (e) {
            console.error('Gagal parsing JSON snmp_credentials dari Settings');
        }
    }

    const device = await Network.findOne({ where: { IP: ip } });
    let credential = { ...(credentials[ip] || {}) };
    if (device) {
        if (device.SNMP_VERSION) credential.version = device.SNMP_VERSION;
        if (device.SNMP_PORT) credential.port = parseInt(device.SNMP_PORT);
        if (device.SNMP_COMMUNITY) credential.community = device.SNMP_COMMUNITY;
        if (device.SNMP_USER) credential.username = device.SNMP_USER;
        if (device.SNMP_AUTH_PROTO) credential.authProtocol = device.SNMP_AUTH_PROTO;
        if (device.SNMP_AUTH_KEY) credential.authKey = device.SNMP_AUTH_KEY;
        if (device.SNMP_PRIV_PROTO) credential.privProtocol = device.SNMP_PRIV_PROTO;
        if (device.SNMP_PRIV_KEY) credential.privKey = device.SNMP_PRIV_KEY;
    }

    try {
        const customProfileSetting = await Setting.findOne({ where: { key: 'vendor_profiles' } });
        let customProfiles = {};
        if (customProfileSetting && customProfileSetting.value) {
            try { customProfiles = JSON.parse(customProfileSetting.value); } catch (e) {}
        }

        const profile = resolveVendorProfile(device?.VENDOR, device?.TYPE || 'nvr', device?.HOSTNAME, customProfiles);
        const metrics = await fetchVendorMetrics(ip, credential, profile);

        if (device) {
            Asset.update({ STATUS: 'UP' }, {
                where: {
                    [Op.or]: [
                        { PID: device.PID },
                        { HOSTNAME: device.HOSTNAME }
                    ]
                }
            }).catch(() => {});
        }

        return res.status(200).json({
            success: true,
            data: {
                info: {
                    manufacturer: metrics.info.manufacturer || metrics.vendor,
                    model: metrics.info.model || metrics.info.deviceModel || 'N/A',
                    serialNumber: metrics.info.serialNumber || 'N/A',
                    firmware: metrics.info.firmware || 'N/A',
                    userAccessCount: metrics.info.userAccessCount || '0',
                    alarmSummary: metrics.info.alarmSummary || 'Normal',
                    temperature: metrics.info.temperature || metrics.resources.temperature || null,
                    sysDescr: metrics.info.sysDescr || 'N/A',
                    uptime: metrics.info.uptime || 'N/A'
                },
                hdd: metrics.hdd || [],
                cameras: metrics.cameras || [],
                resources: metrics.resources || {},
                vendor: metrics.vendor
            }
        });
    } catch (error) {
        console.error(`❌ [NVR SNMP Error] on ${ip}:`, error.toString());
        return res.status(500).json({ success: false, error: 'Gagal mengambil data NVR', details: error.toString() });
    }
};

// POST /api/devices/snmp-test
export const testSnmp = async (req, res) => {
    const { ip, snmpVersion, snmpPort, snmpCommunity, snmpUser, snmpAuthProto, snmpAuthKey, snmpPrivProto, snmpPrivKey } = req.body;
    
    try {
        const session = createSnmpSession(ip, req.body, { retries: 1, timeout: 5000 });

        session.on('error', (err) => {
            console.error(`[SNMP Test Error] on ${ip}:`, err.message);
        });

        const OIDs = ['1.3.6.1.2.1.1.1.0', '1.3.6.1.2.1.1.5.0'];

        session.get(OIDs, (error, varbinds) => {
            if (error) {
                session.close();
                return res.status(500).json({ success: false, error: 'Koneksi SNMP Gagal', details: error.toString() });
            }

            let sysDescr = 'N/A';
            let sysName = 'N/A';

            if (varbinds[0] && !snmp.isVarbindError(varbinds[0])) sysDescr = varbinds[0].value.toString();
            if (varbinds[1] && !snmp.isVarbindError(varbinds[1])) sysName = varbinds[1].value.toString();

            session.close();
            return res.status(200).json({
                success: true,
                data: {
                    sysName,
                    sysDescr
                }
            });
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// GET /api/devices/:ip/metrics
export const getDeviceVendorMetrics = async (req, res) => {
    const { ip } = req.params;

    try {
        const cleanIp = String(ip).trim();
        const device = await Network.findOne({ 
            where: { 
                [Op.or]: [
                    { IP: cleanIp },
                    Sequelize.where(Sequelize.fn('TRIM', Sequelize.col('IP')), cleanIp)
                ]
            } 
        });
        
        const customProfileSetting = await Setting.findOne({ where: { key: 'vendor_profiles' } });
        let customProfiles = {};
        if (customProfileSetting && customProfileSetting.value) {
            try { customProfiles = JSON.parse(customProfileSetting.value); } catch (e) {}
        }

        const profile = resolveVendorProfile(device?.VENDOR, device?.TYPE, device?.HOSTNAME, customProfiles);

        const snmpSetting = await Setting.findOne({ where: { key: 'snmp_credentials' } });
        let credentials = {};
        if (snmpSetting && snmpSetting.value) {
            try { credentials = JSON.parse(snmpSetting.value); } catch (e) {}
        }

        let credential = { ...(credentials[ip] || {}) };
        if (device) {
            if (device.SNMP_VERSION) credential.version = device.SNMP_VERSION;
            if (device.SNMP_PORT) credential.port = parseInt(device.SNMP_PORT);
            if (device.SNMP_COMMUNITY) credential.community = device.SNMP_COMMUNITY;
            if (device.SNMP_USER) credential.username = device.SNMP_USER;
            if (device.SNMP_AUTH_PROTO) credential.authProtocol = device.SNMP_AUTH_PROTO;
            if (device.SNMP_AUTH_KEY) credential.authKey = device.SNMP_AUTH_KEY;
            if (device.SNMP_PRIV_PROTO) credential.privProtocol = device.SNMP_PRIV_PROTO;
            if (device.SNMP_PRIV_KEY) credential.privKey = device.SNMP_PRIV_KEY;
        }

        const metrics = await fetchVendorMetrics(ip, credential, profile);
        console.log(`🔍 [Vendor Metrics Fetch] IP: ${ip}, Device Vendor: "${device?.VENDOR}", Resolved Profile: "${profile.id}", Success: ${!!metrics}`);
        if (metrics) {
            console.log(`   Data Info:`, JSON.stringify(metrics.info));
        }

        if (metrics && device) {
            await Asset.update({ STATUS: 'UP' }, {
                where: {
                    [Op.or]: [
                        { PID: device.PID },
                        { HOSTNAME: device.HOSTNAME }
                    ]
                }
            }).catch(() => {});

            if (req.io) {
                req.io.emit('device:status_update', {
                    pid: device.PID,
                    ip: device.IP,
                    hostname: device.HOSTNAME,
                    status: 'UP',
                    updatedAt: new Date().toISOString(),
                    snmpData: {
                        ...metrics.info,
                        ports: metrics.ports || [],
                        ...metrics.resources
                    }
                });
            }
        }

        return res.status(200).json({
            success: true,
            data: metrics
        });
    } catch (error) {
        console.error('❌ [Vendor Metrics Error]:', error);
        return res.status(500).json({ success: false, error: 'Gagal mengambil metrik vendor perangkat' });
    }
};
