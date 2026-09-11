export const DEFAULT_VENDOR_PROFILES = {
    // --- FIREWALL & SECURITY ---
    fortigate: {
        id: 'fortigate',
        name: 'Fortinet FortiGate',
        category: 'firewall',
        defaultMethod: 'snmp',
        aliases: ['fortigate', 'fortinet', 'fg-', 'fgt', '201e', '100f', '60f', '40f'],
        cpuOid: '1.3.6.1.4.1.12356.101.4.1.3.0', // Fortinet CPU usage (%)
        memoryUsedOid: '1.3.6.1.4.1.12356.101.4.1.4.0', // Fortinet RAM usage (%)
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
        cpuOid: '1.3.6.1.4.1.9.9.109.1.1.1.1.5.1', // cpmCPUTotal5minRev
        memoryUsedOid: '1.3.6.1.4.1.9.9.48.1.1.1.5.1', // ciscoMemoryPoolUsed
        memoryFreeOid: '1.3.6.1.4.1.9.9.48.1.1.1.6.1', // ciscoMemoryPoolFree
        temperatureOid: '1.3.6.1.4.1.9.9.13.1.3.1.3.1', // ciscoEnvMonTemperatureValue
        sysInfoOids: [
            { key: 'model', oid: '1.3.6.1.2.1.47.1.1.1.1.13.1' }, // entPhysicalModelName
            { key: 'serialNumber', oid: '1.3.6.1.2.1.47.1.1.1.1.11.1' }, // entPhysicalSerialNum
            { key: 'fanStatus', oid: '1.3.6.1.4.1.9.9.13.1.4.1.3.1' }, // ciscoEnvMonFanState (1=normal)
            { key: 'psuStatus', oid: '1.3.6.1.4.1.9.9.13.1.5.1.3.1' }  // ciscoEnvMonSupplyState (1=normal)
        ],
        isSwitch: true
    },

    // --- CISCO BUSINESS / CATALYST 1300 SERIES (C1300-24FP, C1300-16FP, CBS) ---
    cisco_cbs: {
        id: 'cisco_cbs',
        name: 'Cisco Catalyst 1300 / CBS',
        category: 'switch',
        defaultMethod: 'snmp',
        aliases: ['c1300', 'c1300-24fp', 'c1300-16fp', 'cbs', 'cbs350', 'cbs250', 'sg350', 'sg300', 'sg250'],
        cpuOid: '1.3.6.1.4.1.9.6.1.101.1.2.0', // rlCpuProcessHistoryUtilization5Min
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
        cpuOid: '1.3.6.1.4.1.25506.2.6.1.1.1.1.6.1', // hh3cEntityExtCpuUsage
        memoryUsedOid: '1.3.6.1.4.1.25506.2.6.1.1.1.1.8.1', // hh3cEntityExtMemUsage (%)
        temperatureOid: '1.3.6.1.4.1.25506.2.6.1.1.1.1.12.1', // hh3cEntityExtTemperature
        isSwitch: true
    },

    // --- HPE ARUBA CX / PROCURVE (HPE 6000, Aruba CX 6000) ---
    hpe_aruba: {
        id: 'hpe_aruba',
        name: 'HPE / Aruba CX 6000',
        category: 'switch',
        defaultMethod: 'snmp',
        aliases: ['6000', 'hpe 6000', 'aruba', 'aruba cx', 'cx6000', 'procurve', 'hp', 'hpe', '2930f', '2530', '2540'],
        cpuOid: '1.3.6.1.4.1.11.2.14.11.5.1.9.6.1.0', // hpGlobalStatAvgCpu5min
        memoryUsedOid: '1.3.6.1.4.1.11.2.14.11.5.1.1.2.1.1.1.5.1', // hpSwitchMemAllocBytes
        memoryFreeOid: '1.3.6.1.4.1.11.2.14.11.5.1.1.2.1.1.1.6.1', // hpSwitchMemFreeBytes
        isSwitch: true
    },

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
    },
    generic: {
        id: 'generic',
        name: 'Generic Device',
        category: 'endpoint',
        defaultMethod: 'tcp',
        aliases: ['generic', 'endpoint', 'server', 'windows', 'linux']
    }
};

/**
 * Mencocokkan input (vendor, type, hostname) dengan profil vendor / seri perangkat
 */
export const resolveVendorProfile = (vendorStr = '', typeStr = '', hostnameStr = '', customProfiles = {}) => {
    const v = String(vendorStr || '').trim().toLowerCase();
    const t = String(typeStr || '').trim().toLowerCase();
    const h = String(hostnameStr || '').trim().toLowerCase();

    // Normalisasi menghapus dash, spasi, dan underscore untuk pencocokan toleran
    const vNorm = v.replace(/[-_\s]/g, '');
    const hNorm = h.replace(/[-_\s]/g, '');

    const allProfiles = { ...DEFAULT_VENDOR_PROFILES, ...customProfiles };

    // 0. Deteksi spesifik Seri & Model Perangkat (High Priority)
    // FortiGate Firewall
    if (vNorm.includes('fortigate') || vNorm.includes('fortinet') || hNorm.includes('fortigate') || hNorm.includes('fgt') || /201e/i.test(v) || /201e/i.test(h)) {
        return allProfiles.fortigate || DEFAULT_VENDOR_PROFILES.fortigate;
    }

    // Cisco Catalyst 1300 / CBS Series (Small Business MIB)
    if (vNorm.includes('c1300') || hNorm.includes('c1300') || vNorm.includes('cbs') || hNorm.includes('cbs') || /c1300/i.test(v) || /c1300/i.test(h)) {
        return allProfiles.cisco_cbs || DEFAULT_VENDOR_PROFILES.cisco_cbs;
    }

    // Cisco Catalyst IOS-XE & Classic (C9300L, C9200L, 2960X)
    if (vNorm.includes('c9300') || hNorm.includes('c9300') || 
        vNorm.includes('c9200') || hNorm.includes('c9200') || 
        vNorm.includes('2960') || hNorm.includes('2960') || 
        /c9300l/i.test(v) || /c9300l/i.test(h) ||
        /c9200l/i.test(v) || /c9200l/i.test(h) ||
        /2960x/i.test(v) || /2960x/i.test(h) ||
        vNorm.includes('catalyst') || hNorm.includes('catalyst')) {
        return allProfiles.cisco_ios || DEFAULT_VENDOR_PROFILES.cisco_ios;
    }

    // HPE 5140 (Comware)
    if (vNorm.includes('5140') || hNorm.includes('5140') || vNorm.includes('comware') || hNorm.includes('comware')) {
        return allProfiles.hpe_comware || DEFAULT_VENDOR_PROFILES.hpe_comware;
    }

    // HPE 6000 / Aruba CX
    if (vNorm.includes('6000') || hNorm.includes('6000') || vNorm.includes('aruba') || hNorm.includes('aruba') || vNorm.includes('cx6000') || hNorm.includes('cx6000')) {
        return allProfiles.hpe_aruba || DEFAULT_VENDOR_PROFILES.hpe_aruba;
    }

    // Panasonic NVR Seri NX
    if (vNorm.includes('nx400') || vNorm.includes('nx300') || hNorm.includes('nx400') || hNorm.includes('nx300') || /wj[-_]?nx400/i.test(v) || /wj[-_]?nx400/i.test(h)) {
        return allProfiles.panasonic || DEFAULT_VENDOR_PROFILES.panasonic;
    }
    // i-PRO NVR Seri NX
    if (vNorm.includes('nx510') || vNorm.includes('nx410') || hNorm.includes('nx510') || hNorm.includes('nx410') || /wj[-_]?nx510/i.test(v) || /wj[-_]?nx510/i.test(h)) {
        return allProfiles.ipro || DEFAULT_VENDOR_PROFILES.ipro;
    }

    // 1. Pencocokan Merek (Vendor) dari data inventory
    for (const key of Object.keys(allProfiles)) {
        const profile = allProfiles[key];
        const aliases = profile.aliases || [key];
        if (v && aliases.some(alias => {
            const a = alias.toLowerCase();
            const aNorm = a.replace(/[-_\s]/g, '');
            return v.includes(a) || (aNorm && vNorm.includes(aNorm));
        })) {
            return profile;
        }
    }

    // 2. Jika field Vendor kosong, cocokkan hostname
    for (const key of Object.keys(allProfiles)) {
        const profile = allProfiles[key];
        const aliases = profile.aliases || [key];
        if (h && aliases.some(alias => {
            const a = alias.toLowerCase();
            const aNorm = a.replace(/[-_\s]/g, '');
            return h.includes(a) || (aNorm && hNorm.includes(aNorm));
        })) {
            return profile;
        }
    }

    // 3. Fallback berdasarkan jenis perangkat
    if (t.includes('nvr') || t.includes('cctv') || h.includes('nvr') || h.includes('cam')) {
        return {
            ...DEFAULT_VENDOR_PROFILES.ipro,
            name: vendorStr || 'Generic NVR / CCTV',
            id: 'nvr_generic'
        };
    }

    if (t.includes('firewall') || h.includes('fw-') || h.includes('firewall')) {
        return allProfiles.fortigate || DEFAULT_VENDOR_PROFILES.fortigate;
    }

    if (t.includes('switch') || h.includes('sw-') || h.includes('switch')) {
        return allProfiles.cisco_ios || DEFAULT_VENDOR_PROFILES.cisco_ios;
    }

    if (t.includes('router')) {
        return allProfiles.mikrotik || DEFAULT_VENDOR_PROFILES.mikrotik;
    }

    return DEFAULT_VENDOR_PROFILES.generic;
};
