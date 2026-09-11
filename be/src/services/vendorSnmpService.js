import snmp from 'net-snmp';
import { createSnmpSession } from './snmpV3Service.js';
import { DEFAULT_VENDOR_PROFILES, resolveVendorProfile } from './vendorRegistry.js';
import { fetchStandardMetrics, formatHardwareStatus } from './vendorSnmpHelpers.js';
import { walkSubtreeList, fetchSwitchPorts } from './vendorSubtreeFetcher.js';

export { DEFAULT_VENDOR_PROFILES, resolveVendorProfile };

/**
 * Menarik metrik vendor spesifik secara terisolasi per OID
 */
const fetchSpecificOids = async (session, profile) => {
    const specificOids = [];
    const specificKeys = [];

    if (profile.cpuOid) { specificOids.push(profile.cpuOid); specificKeys.push('cpu'); }
    if (profile.temperatureOid) { specificOids.push(profile.temperatureOid); specificKeys.push('temperature'); }
    if (profile.voltageOid) { specificOids.push(profile.voltageOid); specificKeys.push('voltage'); }
    if (profile.memoryUsedOid) { specificOids.push(profile.memoryUsedOid); specificKeys.push('memUsed'); }
    if (profile.memoryFreeOid) { specificOids.push(profile.memoryFreeOid); specificKeys.push('memFree'); }

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

        specVarbinds.forEach((vb, idx) => {
            if (vb && !snmp.isVarbindError(vb)) {
                const key = specificKeys[idx];
                const val = vb.value ? vb.value.toString() : 'N/A';
                if (['cpu', 'temperature', 'voltage', 'memUsed', 'memFree'].includes(key)) {
                    resources[key] = val;
                } else {
                    info[key] = formatHardwareStatus(key, val);
                }
            }
        });
    }

    // --- FALLBACK UNTUK TABLE OID (CISCO IOS-XE / C9200L / C9300L / COMWARE) ---
    // 1. Fallback CPU jika get direct tidak berhasil (menggunakan subtree walk pada cpu table)
    if (!resources.cpu || resources.cpu === 'N/A' || resources.cpu === '-' || resources.cpu === '0%' || resources.cpu === '0') {
        const cpuRootOid = profile.id?.startsWith('cisco') ? '1.3.6.1.4.1.9.9.109.1.1.1.1.5' : 
                           (profile.id === 'hpe_comware' || profile.id?.includes('comware')) ? '1.3.6.1.4.1.25506.2.6.1.1.1.1.6' : null;
        if (cpuRootOid) {
            let foundCpu = null;
            await new Promise((res) => {
                session.subtree(cpuRootOid, 20, (vbs) => {
                    for (const vb of vbs) {
                        if (!snmp.isVarbindError(vb) && vb.value !== undefined && vb.value !== null) {
                            const val = Number(vb.value);
                            if (val >= 0 && val <= 100) {
                                if (foundCpu === null || val > 0) {
                                    foundCpu = `${val}%`;
                                    if (val > 0) break;
                                }
                            }
                        }
                    }
                }, res);
            });
            if (foundCpu !== null) resources.cpu = foundCpu;
        }
    }

    // 2. Fallback RAM untuk Cisco & Comware
    if (!resources.memory || resources.memory === 'N/A' || resources.memory === '-') {
        if (profile.id?.startsWith('cisco')) {
            let usedVal = null;
            let freeVal = null;
            await new Promise((res) => {
                session.subtree('1.3.6.1.4.1.9.9.48.1.1.1.5', 10, (vbs) => {
                    for (const vb of vbs) {
                        if (!snmp.isVarbindError(vb) && vb.value !== undefined && vb.value !== null) { 
                            usedVal = Number(vb.value); 
                            break; 
                        }
                    }
                }, res);
            });
            await new Promise((res) => {
                session.subtree('1.3.6.1.4.1.9.9.48.1.1.1.6', 10, (vbs) => {
                    for (const vb of vbs) {
                        if (!snmp.isVarbindError(vb) && vb.value !== undefined && vb.value !== null) { 
                            freeVal = Number(vb.value); 
                            break; 
                        }
                    }
                }, res);
            });
            if (usedVal !== null && freeVal !== null && (usedVal + freeVal) > 0) {
                resources.memUsed = usedVal;
                resources.memFree = freeVal;
                resources.memory = `${Math.round((usedVal / (usedVal + freeVal)) * 100)}%`;
            }
        } else if (profile.id === 'hpe_comware' || profile.id?.includes('comware')) {
            await new Promise((res) => {
                session.subtree('1.3.6.1.4.1.25506.2.6.1.1.1.1.8', 30, (vbs) => {
                    for (const vb of vbs) {
                        if (!snmp.isVarbindError(vb) && vb.value !== undefined && vb.value !== null) {
                            const val = Number(vb.value);
                            if (val > 0 && val <= 100) {
                                resources.memory = `${val}%`;
                                resources.memUsed = val;
                                break;
                            } else if (val === 0 && !resources.memory) {
                                resources.memory = `0%`;
                            }
                        }
                    }
                }, res);
            });
        }
    } else if (resources.memUsed && resources.memFree && !resources.memory) {
        const u = parseFloat(resources.memUsed);
        const f = parseFloat(resources.memFree);
        if (!isNaN(u) && !isNaN(f) && (u + f) > 0) {
            resources.memory = `${Math.round((u / (u + f)) * 100)}%`;
        }
    }

    // 3. Fallback Suhu untuk Cisco & Comware/HPE jika get direct OID tidak valid atau bernilai 65535
    if (!resources.temperature || resources.temperature === 'N/A' || Number(resources.temperature) > 120 || Number(resources.temperature) < 10) {
        if (profile.id?.startsWith('cisco')) {
            await new Promise((res) => {
                session.subtree('1.3.6.1.4.1.9.9.91.1.1.1.1.4', 20, (vbs) => {
                    for (const vb of vbs) {
                        if (!snmp.isVarbindError(vb) && vb.value !== undefined && vb.value !== null) {
                            const val = Number(vb.value);
                            if (val >= 15 && val <= 90) { // Rentang suhu normal sensor
                                resources.temperature = `${val}`;
                                break;
                            }
                        }
                    }
                }, res);
            });
        } else if (profile.id === 'hpe_comware' || profile.id?.includes('comware')) {
            await new Promise((res) => {
                session.subtree('1.3.6.1.4.1.25506.2.6.1.1.1.1.12', 30, (vbs) => {
                    for (const vb of vbs) {
                        if (!snmp.isVarbindError(vb) && vb.value !== undefined && vb.value !== null) {
                            const val = Number(vb.value);
                            // Saring nilai 65535 (sensor tidak terpasang/null pada Comware)
                            if (val >= 15 && val <= 95) {
                                resources.temperature = `${val}`;
                                break;
                            }
                        }
                    }
                }, res);
            });
        }
    }

    // 4. Fallback Model & Serial Number via entPhysicalTable (Cisco / Standard MIB)
    if (!info.model || info.model === 'N/A' || !info.serialNumber || info.serialNumber === 'N/A') {
        if (!info.model || info.model === 'N/A') {
            await new Promise((res) => {
                session.subtree('1.3.6.1.2.1.47.1.1.1.1.13', 10, (vbs) => {
                    for (const vb of vbs) {
                        if (!snmp.isVarbindError(vb) && vb.value) {
                            const val = vb.value.toString().trim();
                            if (val && val.length > 2 && !val.toLowerCase().includes('chassis slot')) {
                                info.model = val;
                                break;
                            }
                        }
                    }
                }, res);
            });
        }
        if (!info.serialNumber || info.serialNumber === 'N/A') {
            await new Promise((res) => {
                session.subtree('1.3.6.1.2.1.47.1.1.1.1.11', 10, (vbs) => {
                    for (const vb of vbs) {
                        if (!snmp.isVarbindError(vb) && vb.value) {
                            const val = vb.value.toString().trim();
                            if (val && val.length > 3) {
                                info.serialNumber = val;
                                break;
                            }
                        }
                    }
                }, res);
            });
        }
    }

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

            // 1b. Dynamic Profile Upgrade via sysDescr jika profil awal adalah generic
            let activeProfile = profile;
            const sysD = (stdData.info?.sysDescr || '').toLowerCase();
            if (profile.id === 'generic' || profile.id === 'endpoint' || !profile.isSwitch) {
                if (sysD.includes('cisco') || sysD.includes('catalyst') || sysD.includes('ios')) {
                    activeProfile = DEFAULT_VENDOR_PROFILES.cisco_ios;
                    result.vendor = activeProfile.name;
                    result.vendorId = activeProfile.id;
                } else if (sysD.includes('comware') || sysD.includes('5140') || sysD.includes('h3c')) {
                    activeProfile = DEFAULT_VENDOR_PROFILES.hpe_comware;
                    result.vendor = activeProfile.name;
                    result.vendorId = activeProfile.id;
                } else if (sysD.includes('aruba') || sysD.includes('procurve') || sysD.includes('6000')) {
                    activeProfile = DEFAULT_VENDOR_PROFILES.hpe_aruba;
                    result.vendor = activeProfile.name;
                    result.vendorId = activeProfile.id;
                } else if (sysD.includes('fortigate') || sysD.includes('fortinet')) {
                    activeProfile = DEFAULT_VENDOR_PROFILES.fortigate;
                    result.vendor = activeProfile.name;
                    result.vendorId = activeProfile.id;
                }
            }

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
            if (activeProfile.isSwitch || profile.isSwitch || sysD.includes('switch') || sysD.includes('catalyst')) {
                const portData = await fetchSwitchPorts(session);
                result.ports = portData.ports || portData;
                
                // Gunakan total octets aktual dari seluruh port aktif jika traffic standard MIB kosong / 0 MB
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
