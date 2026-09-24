import snmp from 'net-snmp';
import { createSnmpSession } from './snmpV3Service.js';
import { DEFAULT_VENDOR_PROFILES, resolveVendorProfile } from './vendorRegistry.js';
import { fetchStandardMetrics, formatHardwareStatus } from './vendorSnmpHelpers.js';
import { walkSubtreeList, fetchSwitchPorts } from './vendorSubtreeFetcher.js';
import {
    fetchUpsTableFallbacks,
    fetchCpuTableFallback,
    fetchMemoryTableFallback,
    fetchTemperatureTableFallback,
    fetchEntityPhysicalFallback
} from './vendorSnmpTableFallbacks.js';
import {
    formatUnifiApMetrics,
    formatUpsMetrics,
    formatAtsMetrics,
    upgradeProfileFromSysDescr
} from './vendorMetricsFormatter.js';

export { DEFAULT_VENDOR_PROFILES, resolveVendorProfile };

/**
 * Tarik OID individual vendor spesifik
 */
const fetchSpecificOids = async (session, profile) => {
    const specificOids = [];
    const specificKeys = [];

    if (profile.cpuOid) { specificOids.push(profile.cpuOid); specificKeys.push('cpu'); }
    if (profile.temperatureOid) { specificOids.push(profile.temperatureOid); specificKeys.push('temperature'); }
    if (profile.voltageOid) { specificOids.push(profile.voltageOid); specificKeys.push('voltage'); }
    if (profile.memoryUsedOid) { specificOids.push(profile.memoryUsedOid); specificKeys.push('memUsed'); }
    if (profile.memoryTotalOid) { specificOids.push(profile.memoryTotalOid); specificKeys.push('memTotal'); }
    if (profile.memoryFreeOid) { specificOids.push(profile.memoryFreeOid); specificKeys.push('memFree'); }

    // UPS & ATS Dedicated OIDs
    if (profile.batteryCapacityOid) { specificOids.push(profile.batteryCapacityOid); specificKeys.push('batteryCapacity'); }
    if (profile.batteryRuntimeOid) { specificOids.push(profile.batteryRuntimeOid); specificKeys.push('batteryRuntime'); }
    if (profile.batteryVoltageOid) { specificOids.push(profile.batteryVoltageOid); specificKeys.push('batteryVoltage'); }
    if (profile.batteryTempOid) { specificOids.push(profile.batteryTempOid); specificKeys.push('batteryTemp'); }
    if (profile.outputLoadOid) { specificOids.push(profile.outputLoadOid); specificKeys.push('outputLoad'); }
    if (profile.outputVoltageOid) { specificOids.push(profile.outputVoltageOid); specificKeys.push('outputVoltage'); }
    if (profile.inputVoltageOid) { specificOids.push(profile.inputVoltageOid); specificKeys.push('inputVoltage'); }
    if (profile.inputFrequencyOid) { specificOids.push(profile.inputFrequencyOid); specificKeys.push('inputFrequency'); }

    // Fallback RFC1628 UPS-MIB OIDs
    if (profile.stdBatteryCapacityOid) { specificOids.push(profile.stdBatteryCapacityOid); specificKeys.push('stdBatteryCapacity'); }
    if (profile.stdBatteryRuntimeOid) { specificOids.push(profile.stdBatteryRuntimeOid); specificKeys.push('stdBatteryRuntime'); }
    if (profile.stdBatteryVoltageOid) { specificOids.push(profile.stdBatteryVoltageOid); specificKeys.push('stdBatteryVoltage'); }
    if (profile.stdBatteryTempOid) { specificOids.push(profile.stdBatteryTempOid); specificKeys.push('stdBatteryTemp'); }
    if (profile.stdOutputPercentOid) { specificOids.push(profile.stdOutputPercentOid); specificKeys.push('stdOutputPercent'); }
    if (profile.stdOutputVoltageOid) { specificOids.push(profile.stdOutputVoltageOid); specificKeys.push('stdOutputVoltage'); }
    if (profile.stdInputVoltageOid) { specificOids.push(profile.stdInputVoltageOid); specificKeys.push('stdInputVoltage'); }
    if (profile.stdInputFrequencyOid) { specificOids.push(profile.stdInputFrequencyOid); specificKeys.push('stdInputFrequency'); }

    if (profile.sysInfoOids && Array.isArray(profile.sysInfoOids)) {
        profile.sysInfoOids.forEach(item => {
            specificOids.push(item.oid);
            specificKeys.push(item.key);
        });
    }

    const info = {};
    const resources = {};

    if (specificOids.length > 0) {
        const specVarbinds = await Promise.all(
            specificOids.map(oid => new Promise(res => {
                session.get([oid], (err, vbs) => {
                    if (err || !vbs || vbs.length === 0 || snmp.isVarbindError(vbs[0])) {
                        res(null);
                    } else {
                        res(vbs[0]);
                    }
                });
            }))
        );

        const validOids = [];
        specVarbinds.forEach((vb, idx) => {
            if (vb && !snmp.isVarbindError(vb)) {
                const key = specificKeys[idx];
                const val = vb.value ? vb.value.toString() : 'N/A';
                validOids.push(`${key}=${val}`);
                if ([
                    'cpu', 'temperature', 'voltage', 'memUsed', 'memTotal', 'memFree',
                    'batteryCapacity', 'batteryRuntime', 'batteryVoltage', 'batteryTemp',
                    'outputLoad', 'outputVoltage', 'inputVoltage', 'inputFrequency',
                    'stdBatteryCapacity', 'stdBatteryRuntime', 'stdBatteryVoltage', 'stdBatteryTemp',
                    'stdOutputPercent', 'stdOutputVoltage', 'stdInputVoltage', 'stdInputFrequency'
                ].includes(key)) {
                    resources[key] = val;
                } else {
                    info[key] = formatHardwareStatus(key, val);
                }
            }
        });
        if (validOids.length > 0) {
            console.log(`   [Specific OIDs Matched]:`, validOids.join(', '));
        }
    }

    // Subtree Fallback Handlers
    if (profile.isUps) {
        await fetchUpsTableFallbacks(session, resources);
    } else if (!profile.isAts) {
        await fetchCpuTableFallback(session, profile, resources);
        await fetchMemoryTableFallback(session, profile, resources);
        await fetchTemperatureTableFallback(session, profile, resources);
        await fetchEntityPhysicalFallback(session, info);
    }

    // Format metrik spesifik vendor
    formatUnifiApMetrics(profile, resources);
    formatUpsMetrics(profile, info, resources);
    formatAtsMetrics(profile, resources);

    return { info, resources };
};

/**
 * Controller utama penarikan metrik perangkat
 */
export const fetchVendorMetrics = async (ip, credential, profile) => {
    return new Promise(async (resolve) => {
        const session = createSnmpSession(ip, credential, { retries: 2, timeout: 5000 });
        let isClosed = false;
        const originalClose = session.close.bind(session);
        session.close = () => {
            if (!isClosed) {
                isClosed = true;
                try { originalClose(); } catch (e) {}
            }
        };

        session.on('error', () => {
            session.close();
            resolve(null);
        });

        const result = {
            vendor: profile.name,
            vendorId: profile.id,
            category: profile.category,
            info: {},
            resources: {},
            hdd: [],
            cameras: [],
            ports: []
        };

        try {
            // 1. MIB-2 Standar
            const stdData = await fetchStandardMetrics(session);
            result.info = { ...result.info, ...(stdData.info || {}) };
            result.resources = { ...result.resources, ...(stdData.resources || {}) };

            // 1b. Dynamic Profile Upgrade via sysDescr
            const activeProfile = upgradeProfileFromSysDescr(profile, stdData.info?.sysDescr, DEFAULT_VENDOR_PROFILES);
            result.vendor = activeProfile.name;
            result.vendorId = activeProfile.id;

            // 2. Metrik Vendor Spesifik (CPU / RAM / Suhu / Hardware status)
            const specData = await fetchSpecificOids(session, activeProfile);
            result.info = { ...result.info, ...(specData.info || {}) };
            result.resources = { ...result.resources, ...(specData.resources || {}) };

            // Sinkronkan key cpuUsage & memoryUsage untuk kompatibilitas frontend
            if (result.resources.cpu && !result.resources.cpuUsage) {
                result.resources.cpuUsage = result.resources.cpu;
            }
            if (result.resources.memory && !result.resources.memoryUsage) {
                result.resources.memoryUsage = result.resources.memory;
            }

            // 3. Fallback Firmware Panasonic jika di sysDescr
            if (activeProfile.id === 'panasonic' && (!result.info.firmware || result.info.firmware === 'N/A') && result.info.sysDescr) {
                const match = result.info.sysDescr.match(/SWVer([\d\.]+)/i) || result.info.sysDescr.match(/Ver\.?\s*([\d\.]+)/i);
                if (match) result.info.firmware = match[1];
            }

            // 4. Subtree HDD
            if (activeProfile.hddSubtree) {
                result.hdd = await walkSubtreeList(session, activeProfile.hddSubtree, 10);
            }

            // 5. Subtree Kamera (Channels & Camera IPs)
            if (activeProfile.cameraSubtree) {
                const cameraMap = {};
                await new Promise((res) => {
                    session.subtree(activeProfile.cameraSubtree, 300, (camVarbinds) => {
                        camVarbinds.forEach(vb => {
                            if (!snmp.isVarbindError(vb)) {
                                const oidStr = vb.oid.toString();
                                const valStr = vb.value ? vb.value.toString() : '';
                                const parts = oidStr.split('.');
                                const camIdx = parts[parts.length - 2] || parts[parts.length - 1];

                                if (!cameraMap[camIdx]) cameraMap[camIdx] = { channel: camIdx, status: 'Disconnected', ip: '' };

                                if (valStr === '1') {
                                    cameraMap[camIdx].status = 'Connected';
                                } else if (valStr === '0' || valStr === '2') {
                                    cameraMap[camIdx].status = 'Disconnected';
                                } else if (valStr.includes('.')) {
                                    cameraMap[camIdx].ip = valStr;
                                }
                            }
                        });
                    }, () => {
                        result.cameras = Object.values(cameraMap);
                        res();
                    });
                });
            }

            // 6. Interfaces / Ports & Traffic Total (Switch)
            const sysD = (stdData.info?.sysDescr || '').toLowerCase();
            if (activeProfile.isSwitch || profile.isSwitch || sysD.includes('switch') || sysD.includes('catalyst')) {
                const portData = await fetchSwitchPorts(session);
                result.ports = portData.ports || portData;

                if (portData.totalOctetsIn > 0) {
                    result.resources.trafficIn = (portData.totalOctetsIn / (1024 * 1024)).toFixed(2) + ' MB';
                }
                if (portData.totalOctetsOut > 0) {
                    result.resources.trafficOut = (portData.totalOctetsOut / (1024 * 1024)).toFixed(2) + ' MB';
                }
            }

            session.close();
            resolve(result);
        } catch (err) {
            session.close();
            resolve(result);
        }
    });
};
