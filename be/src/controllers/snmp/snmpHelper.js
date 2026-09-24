import Setting from '../../models/Setting.js';

/**
 * Resolusi kredensial SNMP per IP / Device dari tabel Settings dan database Network
 */
export const resolveDeviceSnmpCredential = async (ip, device) => {
    const snmpSetting = await Setting.findOne({ where: { key: 'snmp_credentials' } });
    let credentials = {};

    if (snmpSetting && snmpSetting.value) {
        try {
            credentials = JSON.parse(snmpSetting.value);
        } catch (e) {
            console.error('Gagal parsing JSON snmp_credentials dari Settings');
        }
    }

    const credential = { ...(credentials[ip] || {}) };

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

    return credential;
};

/**
 * Ambil custom vendor profiles dari Settings
 */
export const getCustomVendorProfiles = async () => {
    const customProfileSetting = await Setting.findOne({ where: { key: 'vendor_profiles' } });
    if (customProfileSetting && customProfileSetting.value) {
        try {
            return JSON.parse(customProfileSetting.value);
        } catch (e) {
            return {};
        }
    }
    return {};
};

/**
 * Cek apakah SNMP dinonaktifkan oleh polling_methods override
 */
export const checkPollingMethodOverride = async (ip, pid) => {
    const methodSetting = await Setting.findOne({ where: { key: 'polling_methods' } });
    if (methodSetting && methodSetting.value) {
        try {
            const pollingOverrides = JSON.parse(methodSetting.value);
            return pollingOverrides[ip] || (pid ? pollingOverrides[pid] : null);
        } catch (e) {
            console.error('Gagal parsing JSON polling_methods dari Settings');
        }
    }
    return null;
};
