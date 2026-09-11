// services/snmpService.js
import snmp from 'net-snmp';

// Standard MIB OID Constants
const OIDS = {
    sysName: '1.3.6.1.2.1.1.5.0',
    sysUptime: '1.3.6.1.2.1.1.3.0',
    sysDescr: '1.3.6.1.2.1.1.1.0'
};

/**
 * Query SNMP GET ke IP target
 * @param {string} ipAddress 
 * @param {string} community - Default 'public'
 * @returns {Promise<Object>}
 */
export const getSnmpData = (ipAddress, community = 'public') => {
    return new Promise((resolve) => {
        const session = snmp.createSession(ipAddress, community, {
            port: 161,
            timeout: 3000,
            retries: 1,
            version: snmp.Version2c
        });

        const oidList = [OIDS.sysName, OIDS.sysUptime, OIDS.sysDescr];

        session.get(oidList, (error, varbinds) => {
            if (error) {
                session.close();
                return resolve({ success: false, error: error.toString() });
            }

            const result = {};
            for (let i = 0; i < varbinds.length; i++) {
                if (snmp.isError(varbinds[i])) {
                    result[`oid_${i}`] = null;
                } else {
                    result[varbinds[i].oid] = varbinds[i].value.toString();
                }
            }

            session.close();
            resolve({
                success: true,
                sysName: result[OIDS.sysName] || '-',
                sysUptime: result[OIDS.sysUptime] || 0,
                sysDescr: result[OIDS.sysDescr] || '-'
            });
        });
    });
};