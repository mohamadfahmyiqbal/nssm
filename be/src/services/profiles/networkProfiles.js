/**
 * Profil OID untuk Switch, Router & Firewall
 */
export const NETWORK_PROFILES = {
    // --- FIREWALL & SECURITY ---
    fortigate: {
        id: 'fortigate',
        name: 'Fortinet FortiGate',
        category: 'firewall',
        defaultMethod: 'snmp',
        aliases: ['fortigate', 'fortinet', 'fg-', 'fgt', '201e', '100f', '60f', '40f'],
        cpuOid: '1.3.6.1.4.1.12356.101.4.1.3.0',
        memoryUsedOid: '1.3.6.1.4.1.12356.101.4.1.4.0',
        sysInfoOids: [
            { key: 'serialNumber', oid: '1.3.6.1.4.1.12356.100.1.1.1.0' },
            { key: 'firmware', oid: '1.3.6.1.4.1.12356.101.4.1.1.0' },
            { key: 'activeSessions', oid: '1.3.6.1.4.1.12356.101.4.1.8.0' }
        ],
        isSwitch: true
    },

    // --- CISCO ENTERPRISE (IOS-XE & Catalyst Classic: C9300L, C9200L, 2960X) ---
    cisco_ios: {
        id: 'cisco_ios',
        name: 'Cisco Catalyst (IOS-XE / Classic)',
        category: 'switch',
        defaultMethod: 'snmp',
        aliases: ['cisco', 'catalyst', 'c9300', 'c9300l', 'c9200', 'c9200l', '2960', '2960x', 'c2960', 'c2960x', 'ws-c2960x', 'nexus'],
        cpuOid: '1.3.6.1.4.1.9.9.109.1.1.1.1.5.1',
        memoryUsedOid: '1.3.6.1.4.1.9.9.48.1.1.1.5.1',
        memoryFreeOid: '1.3.6.1.4.1.9.9.48.1.1.1.6.1',
        temperatureOid: '1.3.6.1.4.1.9.9.13.1.3.1.3.1',
        sysInfoOids: [
            { key: 'model', oid: '1.3.6.1.2.1.47.1.1.1.1.13.1' },
            { key: 'serialNumber', oid: '1.3.6.1.2.1.47.1.1.1.1.11.1' },
            { key: 'fanStatus', oid: '1.3.6.1.4.1.9.9.13.1.4.1.3.1' },
            { key: 'psuStatus', oid: '1.3.6.1.4.1.9.9.13.1.5.1.3.1' }
        ],
        isSwitch: true
    },

    // --- CISCO BUSINESS / CATALYST 1300 SERIES ---
    cisco_cbs: {
        id: 'cisco_cbs',
        name: 'Cisco Catalyst 1300 / CBS',
        category: 'switch',
        defaultMethod: 'snmp',
        aliases: ['c1300', 'c1300-24fp', 'c1300-16fp', 'cbs', 'cbs350', 'cbs250', 'sg350', 'sg300', 'sg250'],
        cpuOid: '1.3.6.1.4.1.9.6.1.101.1.2.0',
        memoryUsedOid: '1.3.6.1.4.1.9.6.1.101.1.6.0',
        memoryFreeOid: '1.3.6.1.4.1.9.6.1.101.1.7.0',
        sysInfoOids: [
            { key: 'model', oid: '1.3.6.1.2.1.47.1.1.1.1.13.1' },
            { key: 'serialNumber', oid: '1.3.6.1.2.1.47.1.1.1.1.11.1' }
        ],
        isSwitch: true
    },

    // --- HPE COMWARE (HPE 5140, H3C) ---
    hpe_comware: {
        id: 'hpe_comware',
        name: 'HPE 5140 (Comware)',
        category: 'switch',
        defaultMethod: 'snmp',
        aliases: ['5140', 'hpe 5140', 'h3c', 'comware', 'a5120', '5130', '5510'],
        cpuOid: '1.3.6.1.4.1.25506.2.6.1.1.1.1.6.1',
        memoryUsedOid: '1.3.6.1.4.1.25506.2.6.1.1.1.1.8.1',
        temperatureOid: '1.3.6.1.4.1.25506.2.6.1.1.1.1.12.1',
        isSwitch: true
    },

    // --- HPE ARUBA CX / PROCURVE (HPE 6000) ---
    hpe_aruba: {
        id: 'hpe_aruba',
        name: 'HPE / Aruba CX 6000',
        category: 'switch',
        defaultMethod: 'snmp',
        aliases: ['6000', 'hpe 6000', 'aruba', 'aruba cx', 'cx6000', 'procurve', 'hp', 'hpe', '2930f', '2530', '2540'],
        cpuOid: '1.3.6.1.4.1.11.2.14.11.5.1.9.6.1.0',
        memoryUsedOid: '1.3.6.1.4.1.11.2.14.11.5.1.1.2.1.1.1.5.1',
        memoryFreeOid: '1.3.6.1.4.1.11.2.14.11.5.1.1.2.1.1.1.6.1',
        isSwitch: true
    },

    // --- RUIJIE / REYEE ---
    ruijie: {
        id: 'ruijie',
        name: 'Ruijie Networks / Reyee',
        category: 'switch',
        defaultMethod: 'snmp',
        aliases: ['ruijie', 'reyee'],
        cpuOid: '1.3.6.1.4.1.4881.1.1.10.2.36.1.1.1.0',
        memoryUsedOid: '1.3.6.1.4.1.4881.1.1.10.2.35.1.1.1.2.0',
        memoryFreeOid: '1.3.6.1.4.1.4881.1.1.10.2.35.1.1.1.3.0',
        isSwitch: true
    },

    // --- MIKROTIK ROUTEROS ---
    mikrotik: {
        id: 'mikrotik',
        name: 'MikroTik RouterOS',
        category: 'router',
        defaultMethod: 'snmp',
        aliases: ['mikrotik', 'routerboard', 'ccr', 'crs', 'rb'],
        cpuOid: '1.3.6.1.4.1.14988.1.1.1.2.1.1.0',
        temperatureOid: '1.3.6.1.4.1.14988.1.1.3.10.0',
        voltageOid: '1.3.6.1.4.1.14988.1.1.3.8.0',
        isSwitch: true
    },

    // --- UBIQUITI UNIFI ACCESS POINT ---
    unifi_ap: {
        id: 'unifi_ap',
        name: 'Ubiquiti UniFi AP',
        category: 'ap',
        defaultMethod: 'snmp',
        aliases: [
            'unifi', 'ubiquiti', 'uap', 'ac mesh pro', 'ac-mesh-pro', 'acmeshpro',
            'u6-lr', 'u6 lr', 'u6lr', 'u6-pro', 'u6 pro', 'u6-lite', 'u6 lite',
            'uap-ac-pro', 'uap-ac-mesh', 'uap-ac-lr', 'u6', 'unifi-ap', 'unifi ap'
        ],
        cpuOid: '1.3.6.1.4.1.2021.10.1.3.1',
        memoryTotalOid: '1.3.6.1.4.1.2021.4.5.0',
        memoryFreeOid: '1.3.6.1.4.1.2021.4.6.0',
        sysInfoOids: [
            { key: 'model', oid: '1.3.6.1.4.1.41112.1.4.1.1.2.1' },
            { key: 'firmware', oid: '1.3.6.1.4.1.41112.1.4.1.1.3.1' },
            { key: 'connectedClients', oid: '1.3.6.1.4.1.41112.1.6.1.2.1.8.1' }
        ],
        isAp: true
    }
};
