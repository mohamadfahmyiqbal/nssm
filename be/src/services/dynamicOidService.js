import snmp from 'net-snmp';
import SnmpProfile from '../models/SnmpProfile.js';
import SnmpProfileOid from '../models/SnmpProfileOid.js';

let profilesCache = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 menit cache in-memory

/**
 * Mengambil profil & OID aktif dari database dengan caching
 */
export const getActiveSnmpProfiles = async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && profilesCache && (now - lastCacheTime < CACHE_TTL_MS)) {
        return profilesCache;
    }

    try {
        const profiles = await SnmpProfile.findAll({
            include: [{
                model: SnmpProfileOid,
                as: 'oids',
                where: { is_active: true },
                required: false
            }]
        });

        profilesCache = profiles.map(p => p.toJSON());
        lastCacheTime = now;
        return profilesCache;
    } catch (err) {
        console.error('[DynamicOidService] Error loading dynamic profiles from DB:', err.message);
        return profilesCache || [];
    }
};

/**
 * Mencocokkan profil dinamis berdasarkan sysObjectID atau nama vendor/model
 */
export const resolveDynamicProfile = async (device = {}, sysObjId = null) => {
    const profiles = await getActiveSnmpProfiles();
    if (!profiles || profiles.length === 0) return null;

    // 1. Coba match regex sysoid_pattern jika ada sysObjectID
    if (sysObjId) {
        for (const prof of profiles) {
            if (prof.sysoid_pattern) {
                try {
                    const regex = new RegExp(prof.sysoid_pattern, 'i');
                    if (regex.test(sysObjId)) {
                        return prof;
                    }
                } catch (e) {
                    // Invalid regex fallback
                    if (sysObjId.startsWith(prof.sysoid_pattern)) {
                        return prof;
                    }
                }
            }
        }
    }

    // 2. Cocokkan nama vendor atau tipe perangkat
    const vendorStr = (device.VENDOR || device.vendor || '').toLowerCase();
    const hostnameStr = (device.HOSTNAME || device.hostname || '').toLowerCase();
    const typeStr = (device.TYPE || device.type || '').toLowerCase();

    for (const prof of profiles) {
        const pName = prof.name.toLowerCase();
        const pVendor = (prof.vendor || '').toLowerCase();

        if (pVendor && (vendorStr.includes(pVendor) || hostnameStr.includes(pVendor))) {
            return prof;
        }
        if (vendorStr.includes(pName) || hostnameStr.includes(pName) || typeStr.includes(pName)) {
            return prof;
        }
    }

    return null;
};

/**
 * Evaluasi rumus formula sederhana (cth: "val / 10", "(val * 8) / 1000")
 */
const evaluateFormula = (val, formula) => {
    if (!formula || typeof formula !== 'string') return val;
    try {
        const numericVal = parseFloat(val);
        if (isNaN(numericVal)) return val;

        // Bersihkan ekspresi, hanya perbolehkan angka, operator matematika dan variabel "val"
        const cleanFormula = formula.replace(/\bval\b/g, numericVal.toString());
        if (!/^[0-9\s\+\-\*\/\(\)\.\%]+$/.test(cleanFormula)) {
            return val;
        }

        // Evaluasi ekspresi aritmatika
        // eslint-disable-next-line no-new-func
        const evaluated = Function(`'use strict'; return (${cleanFormula})`)();
        return Number.isFinite(evaluated) ? Number(evaluated.toFixed(2)) : val;
    } catch (e) {
        return val;
    }
};

/**
 * Menarik seluruh OID metrik dinamis dari database untuk perangkat
 */
export const fetchDynamicOidMetrics = async (session, dynamicProfile) => {
    if (!dynamicProfile || !dynamicProfile.oids || dynamicProfile.oids.length === 0) {
        return { info: {}, resources: {} };
    }

    const oidsToFetch = dynamicProfile.oids.filter(o => o.oid && o.is_active);
    const info = {};
    const resources = {};

    const varbindPromises = oidsToFetch.map(item => new Promise((res) => {
        session.get([item.oid.trim()], (err, vbs) => {
            if (err || !vbs || vbs.length === 0 || snmp.isVarbindError(vbs[0])) {
                res({ item, vb: null });
            } else {
                res({ item, vb: vbs[0] });
            }
        });
    }));

    const results = await Promise.all(varbindPromises);

    results.forEach(({ item, vb }) => {
        if (!vb || snmp.isVarbindError(vb)) return;

        let rawVal = vb.value;
        if (Buffer.isBuffer(rawVal)) {
            rawVal = rawVal.toString('utf8');
        } else if (rawVal !== null && rawVal !== undefined) {
            rawVal = rawVal.toString();
        }

        // Terapkan rumus formula jika ada
        const finalVal = evaluateFormula(rawVal, item.formula);
        const displayVal = item.unit ? `${finalVal} ${item.unit}` : finalVal;

        // Klasifikasi metric ke resources atau info
        const key = item.metric_key;
        if (['cpu', 'cpu_usage', 'memory_used', 'memory_free', 'memUsed', 'memTotal', 'memFree', 'temperature', 'voltage', 'trafficIn', 'trafficOut'].includes(key)) {
            resources[key] = finalVal;
        } else {
            info[key] = displayVal;
        }
    });

    return { info, resources };
};
