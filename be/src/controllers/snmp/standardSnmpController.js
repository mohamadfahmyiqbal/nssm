import snmp from 'net-snmp';
import { Op } from 'sequelize';
import Network from '../../models/Network.js';
import Asset from '../../models/Asset.js';
import { createSnmpSession, walkSubtree } from '../../services/snmpV3Service.js';
import { resolveDeviceSnmpCredential, checkPollingMethodOverride } from './snmpHelper.js';

// GET /api/devices/:ip/snmp
export const getDeviceSnmp = async (req, res) => {
    const { ip } = req.params;

    try {
        const device = await Network.findOne({ where: { IP: ip } });
        const pid = device ? device.PID : null;

        const methodOverride = await checkPollingMethodOverride(ip, pid);
        if (methodOverride && methodOverride !== 'snmp') {
            return res.status(200).json({
                success: false,
                message: `SNMP dinonaktifkan karena metode disetel ke ${methodOverride.toUpperCase()}`
            });
        }

        const credential = await resolveDeviceSnmpCredential(ip, device);
        const session = createSnmpSession(ip, credential, { retries: 1, timeout: 5000 });

        session.on('error', (err) => {
            try { session.close(); } catch (e) {}
            console.error(`❌ [SNMP Internal Error] on ${ip}:`, err.message);
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

        const getSysInfo = () => new Promise((resolve, reject) => {
            session.get(OID_SYS_INFO, (error, varbinds) => {
                if (error) return reject(error);
                resolve(varbinds);
            });
        });

        let varbinds;
        try {
            varbinds = await getSysInfo();
        } catch (snmpErr) {
            try { session.close(); } catch (e) {}
            console.error(`❌ [SNMP Error] on ${ip}:`, snmpErr.toString());
            return res.status(500).json({ success: false, error: 'Failed to fetch SNMP data', details: snmpErr.toString() });
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

        // Mengambil nama interface (ifDescr), ifAlias, dan status (ifOperStatus)
        const [ifDescrs, ifAliases, ifOperStatuses] = await Promise.all([
            walkSubtree(session, '1.3.6.1.2.1.2.2.1.2'),    // ifDescr
            walkSubtree(session, '1.3.6.1.2.1.31.1.1.1.18'), // ifAlias
            walkSubtree(session, '1.3.6.1.2.1.2.2.1.8')     // ifOperStatus
        ]);

        try { session.close(); } catch (e) {}

        const ports = [];
        for (const idx of Object.keys(ifOperStatuses)) {
            const descr = ifDescrs[idx] ? ifDescrs[idx].toString() : '';
            const descrLower = descr.toLowerCase();
            const alias = ifAliases[idx] ? ifAliases[idx].toString().trim() : '';
            const statusVal = ifOperStatuses[idx];

            const isPhysical = descrLower.includes('ethernet') || descrLower.includes('port-channel') || (descrLower.includes('port') && !descrLower.includes('stack'));
            const isLogical = descrLower.includes('vlan') || descrLower.includes('null') || descrLower.includes('loopback');

            if (isPhysical && !isLogical) {
                let shortName = descr
                    .replace(/^GigabitEthernet/i, 'Gi')
                    .replace(/^TenGigabitEthernet/i, 'Te')
                    .replace(/^FastEthernet/i, 'Fa')
                    .replace(/^Port-channel/i, 'Po')
                    .replace(/^Ethernet/i, 'Eth');

                ports.push({
                    index: idx,
                    name: descr,
                    shortName: shortName,
                    alias: alias,
                    status: statusVal === 1 ? 'up' : 'down'
                });
            }
        }

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
    } catch (error) {
        console.error('❌ [SNMP Controller Error]:', error);
        return res.status(500).json({ success: false, error: 'Server error during SNMP fetch' });
    }
};

// POST /api/devices/snmp-test
export const testSnmp = async (req, res) => {
    const { ip } = req.body;
    
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
