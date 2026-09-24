import { NETWORK_PROFILES } from './profiles/networkProfiles.js';
import { NVR_PROFILES } from './profiles/nvrProfiles.js';
import { POWER_PROFILES } from './profiles/powerProfiles.js';

export const GENERIC_PROFILE = {
    generic: {
        id: 'generic',
        name: 'Generic Device',
        category: 'endpoint',
        defaultMethod: 'tcp',
        aliases: ['generic', 'endpoint', 'server', 'windows', 'linux']
    }
};

/**
 * Registry master seluruh profil vendor SNMP yang didukung
 */
export const DEFAULT_VENDOR_PROFILES = {
    ...NETWORK_PROFILES,
    ...NVR_PROFILES,
    ...POWER_PROFILES,
    ...GENERIC_PROFILE
};

/**
 * Helper pencocokan prioritas tinggi (Seri & Model spesifik)
 */
const matchHighPriorityModel = (vNorm, hNorm, v, h, allProfiles) => {
    // Ubiquiti UniFi AP
    if (
        vNorm.includes('unifi') || vNorm.includes('ubiquiti') || vNorm.includes('acmesh') ||
        vNorm.includes('u6lr') || vNorm.includes('u6pro') || vNorm.includes('u6lite') ||
        hNorm.includes('unifi') || hNorm.includes('ubnt') || hNorm.includes('uap') ||
        hNorm.includes('acmesh') || hNorm.includes('u6lr') ||
        /ac[-_\s]?mesh[-_\s]?pro/i.test(v) || /ac[-_\s]?mesh[-_\s]?pro/i.test(h) ||
        /u6[-_\s]?lr/i.test(v) || /u6[-_\s]?lr/i.test(h)
    ) {
        return allProfiles.unifi_ap || DEFAULT_VENDOR_PROFILES.unifi_ap;
    }

    // FortiGate Firewall
    if (vNorm.includes('fortigate') || vNorm.includes('fortinet') || hNorm.includes('fortigate') || hNorm.includes('fgt') || /201e/i.test(v) || /201e/i.test(h)) {
        return allProfiles.fortigate || DEFAULT_VENDOR_PROFILES.fortigate;
    }

    // Schneider Easy UPS (SRVPM10KRI / SRVM10KRI / SRPM10KRI / SRV Series)
    if (
        vNorm.includes('srvpm10kri') || hNorm.includes('srvpm10kri') ||
        vNorm.includes('srpm10kri') || hNorm.includes('srpm10kri') ||
        vNorm.includes('srvm10kri') || hNorm.includes('srvm10kri') ||
        vNorm.includes('srvpm10kr') || hNorm.includes('srvpm10kr') ||
        vNorm.includes('srpm10kr') || hNorm.includes('srpm10kr') ||
        vNorm.includes('srvm10k') || hNorm.includes('srvm10k') ||
        vNorm.includes('srpm10k') || hNorm.includes('srpm10k') ||
        /sr[vp]m?10k/i.test(v) || /sr[vp]m?10k/i.test(h) ||
        ((vNorm.includes('schneider') || vNorm.includes('apc')) && (vNorm.includes('ups') || hNorm.includes('ups')))
    ) {
        return allProfiles.schneider_ups || DEFAULT_VENDOR_PROFILES.schneider_ups;
    }

    // APC Rack ATS (AP4423A / AP44XX)
    if (
        vNorm.includes('ap4423a') || hNorm.includes('ap4423a') ||
        vNorm.includes('ap4423') || hNorm.includes('ap4423') ||
        /ap44\d{2}[a-z]?/i.test(v) || /ap44\d{2}[a-z]?/i.test(h) ||
        vNorm.includes('ats') || hNorm.includes('ats')
    ) {
        return allProfiles.apc_ats || DEFAULT_VENDOR_PROFILES.apc_ats;
    }

    // Cisco Catalyst 1300 / CBS Series
    if (vNorm.includes('c1300') || hNorm.includes('c1300') || vNorm.includes('cbs') || hNorm.includes('cbs') || /c1300/i.test(v) || /c1300/i.test(h)) {
        return allProfiles.cisco_cbs || DEFAULT_VENDOR_PROFILES.cisco_cbs;
    }

    // Cisco Catalyst IOS-XE & Classic (C9300L, C9200L, 2960X)
    if (
        vNorm.includes('c9300') || hNorm.includes('c9300') ||
        vNorm.includes('c9200') || hNorm.includes('c9200') ||
        vNorm.includes('2960') || hNorm.includes('2960') ||
        /c9300l/i.test(v) || /c9300l/i.test(h) ||
        /c9200l/i.test(v) || /c9200l/i.test(h) ||
        /2960x/i.test(v) || /2960x/i.test(h) ||
        vNorm.includes('catalyst') || hNorm.includes('catalyst')
    ) {
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

    return null;
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
    const highPriorityMatch = matchHighPriorityModel(vNorm, hNorm, v, h, allProfiles);
    if (highPriorityMatch) return highPriorityMatch;

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

    // 3. Fallback berdasarkan jenis perangkat (Device Type)
    if (t.includes('ap') || t.includes('access point') || t.includes('wifi') || h.includes('ap-') || h.includes('uap')) {
        return allProfiles.unifi_ap || DEFAULT_VENDOR_PROFILES.unifi_ap;
    }

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

    if (t.includes('ups') || h.includes('ups-') || h.includes('ups')) {
        return allProfiles.schneider_ups || DEFAULT_VENDOR_PROFILES.schneider_ups;
    }

    if (t.includes('ats') || h.includes('ats-') || h.includes('ats')) {
        return allProfiles.apc_ats || DEFAULT_VENDOR_PROFILES.apc_ats;
    }

    return DEFAULT_VENDOR_PROFILES.generic;
};
