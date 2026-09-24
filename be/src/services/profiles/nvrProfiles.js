/**
 * Profil OID untuk NVR, CCTV & Storage (i-PRO, Panasonic, Hikvision, Dahua)
 */
export const NVR_PROFILES = {
    ipro: {
        id: 'ipro',
        name: 'i-PRO',
        category: 'nvr',
        defaultMethod: 'snmp',
        aliases: ['ipro', 'i-pro', 'nx510', 'nx-510', 'nx410', 'nx-410'],
        sysInfoOids: [
            { key: 'manufacturer', oid: '1.3.6.1.4.1.57501.1.1.0' },
            { key: 'model', oid: '1.3.6.1.4.1.57501.1.2.0' },
            { key: 'serialNumber', oid: '1.3.6.1.4.1.57501.1.3.0' },
            { key: 'firmware', oid: '1.3.6.1.4.1.57501.1.4.0' },
            { key: 'userAccessCount', oid: '1.3.6.1.4.1.57501.200.1.2.1.0' },
            { key: 'alarmSummary', oid: '1.3.6.1.4.1.57501.200.1.2.2.0' },
            { key: 'temperature', oid: '1.3.6.1.4.1.57501.200.1.16.2.1.0' },
            { key: 'fanStatus', oid: '1.3.6.1.4.1.57501.200.1.16.1.1.0' },
            { key: 'psuStatus', oid: '1.3.6.1.4.1.57501.200.1.16.3.1.0' },
            { key: 'raidStatus', oid: '1.3.6.1.4.1.57501.200.1.13.2.1.0' },
            { key: 'recordingState', oid: '1.3.6.1.4.1.57501.200.1.14.1.0' },
        ],
        hddSubtree: '1.3.6.1.4.1.57501.200.1.13.1',
        cameraSubtree: '1.3.6.1.4.1.57501.200.1.15',
        isNvr: true
    },
    panasonic: {
        id: 'panasonic',
        name: 'Panasonic',
        category: 'nvr',
        defaultMethod: 'snmp',
        aliases: ['panasonic', 'wv-', 'wj-', 'wj-nx', 'nx400', 'nx-400', 'nx300', 'nx-300'],
        sysInfoOids: [
            { key: 'manufacturer', oid: '1.3.6.1.4.1.258.1.2.1.1.0' },
            { key: 'model', oid: '1.3.6.1.4.1.258.1.2.1.2.0' },
            { key: 'serialNumber', oid: '1.3.6.1.4.1.258.1.2.1.13.0' },
            { key: 'userAccessCount', oid: '1.3.6.1.4.1.258.5100.1.1.0' },
            { key: 'alarmSummary', oid: '1.3.6.1.4.1.258.5100.1.2.0' },
            { key: 'temperature', oid: '1.3.6.1.4.1.258.5100.200.1.16.2.1.0' },
            { key: 'fanStatus', oid: '1.3.6.1.4.1.258.5100.200.1.16.1.1.0' },
            { key: 'psuStatus', oid: '1.3.6.1.4.1.258.5100.200.1.16.3.1.0' },
            { key: 'raidStatus', oid: '1.3.6.1.4.1.258.5100.200.1.13.2.1.0' },
            { key: 'recordingState', oid: '1.3.6.1.4.1.258.5100.200.1.14.1.0' },
        ],
        hddSubtree: '1.3.6.1.4.1.258.5100.200.1.13.1',
        cameraSubtree: '1.3.6.1.4.1.258.5100.200.1.15',
        isNvr: true
    },
    hikvision: {
        id: 'hikvision',
        name: 'Hikvision',
        category: 'nvr',
        defaultMethod: 'snmp',
        aliases: ['hikvision', 'hik'],
        sysInfoOids: [
            { key: 'model', oid: '1.3.6.1.4.1.39165.1.1.0' },
            { key: 'serialNumber', oid: '1.3.6.1.4.1.39165.1.2.0' },
            { key: 'firmware', oid: '1.3.6.1.4.1.39165.1.3.0' },
        ],
        hddSubtree: '1.3.6.1.4.1.39165.1.4.1',
        cameraSubtree: '1.3.6.1.4.1.39165.1.5.1',
        isNvr: true
    },
    dahua: {
        id: 'dahua',
        name: 'Dahua Technology',
        category: 'nvr',
        defaultMethod: 'snmp',
        aliases: ['dahua', 'dh-'],
        sysInfoOids: [
            { key: 'model', oid: '1.3.6.1.4.1.10046.1.1.0' },
            { key: 'serialNumber', oid: '1.3.6.1.4.1.10046.1.2.0' },
        ],
        hddSubtree: '1.3.6.1.4.1.10046.1.3',
        cameraSubtree: '1.3.6.1.4.1.10046.1.4',
        isNvr: true
    }
};
