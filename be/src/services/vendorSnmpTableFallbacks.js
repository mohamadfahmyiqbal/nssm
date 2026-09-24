import snmp from 'net-snmp';

/**
 * Helper safeSubtree dengan hard timeout agar tidak menggantung jika device lambat
 */
const safeSubtree = (session, rootOid, maxRepetitions, rowCallback, timeoutMs = 3000) => {
    return new Promise((resolve) => {
        let isDone = false;
        const timer = setTimeout(() => {
            if (!isDone) {
                isDone = true;
                resolve();
            }
        }, timeoutMs);

        try {
            session.subtree(rootOid, maxRepetitions, (vbs) => {
                if (!isDone && rowCallback) {
                    rowCallback(vbs);
                }
            }, (err) => {
                if (!isDone) {
                    isDone = true;
                    clearTimeout(timer);
                    if (err) {
                        // Jangan biarkan error unhandled mematikan alur
                    }
                    resolve();
                }
            });
        } catch (e) {
            if (!isDone) {
                isDone = true;
                clearTimeout(timer);
                resolve();
            }
        }
    });
};

/**
 * Fallback penelusuran tabel dinamis (RFC1628 UPS-MIB) untuk UPS On-Line multi-fase
 */
export const fetchUpsTableFallbacks = async (session, resources) => {
    // 1. Output Table (Voltage & Percent Load)
    if (!resources.outputVoltage || !resources.outputLoad) {
        await safeSubtree(session, '1.3.6.1.2.1.33.1.4.4.1', 15, (vbs) => {
            for (const vb of vbs) {
                if (!snmp.isVarbindError(vb) && vb.value !== undefined && vb.value !== null) {
                    const oidStr = vb.oid.toString();
                    const val = vb.value.toString();
                    // upsOutputVoltage (1.3.6.1.2.1.33.1.4.4.1.2.x)
                    if (oidStr.includes('1.3.6.1.2.1.33.1.4.4.1.2.') && !resources.outputVoltage) {
                        resources.outputVoltage = val;
                    }
                    // upsOutputPercentLoad (1.3.6.1.2.1.33.1.4.4.1.5.x)
                    if (oidStr.includes('1.3.6.1.2.1.33.1.4.4.1.5.') && !resources.outputLoad) {
                        resources.outputLoad = val;
                        resources.load = `${val}%`;
                        resources.cpu = `${val}%`;
                    }
                }
            }
        });
    }

    // 2. Input Table (Frequency & Voltage PLN)
    if (!resources.inputVoltage || !resources.inputFrequency) {
        await safeSubtree(session, '1.3.6.1.2.1.33.1.3.3.1', 15, (vbs) => {
            for (const vb of vbs) {
                if (!snmp.isVarbindError(vb) && vb.value !== undefined && vb.value !== null) {
                    const oidStr = vb.oid.toString();
                    const val = vb.value.toString();
                    // upsInputFrequency (1.3.6.1.2.1.33.1.3.3.1.2.x)
                    if (oidStr.includes('1.3.6.1.2.1.33.1.3.3.1.2.') && !resources.inputFrequency) {
                        const f = parseFloat(val);
                        resources.inputFrequency = f > 100 ? (f / 10).toFixed(1) : f.toString();
                    }
                    // upsInputVoltage (1.3.6.1.2.1.33.1.3.3.1.3.x)
                    if (oidStr.includes('1.3.6.1.2.1.33.1.3.3.1.3.') && !resources.inputVoltage) {
                        resources.inputVoltage = val;
                    }
                }
            }
        });
    }

    // 3. Battery Table / Scalar Fallback (RFC1628 1.3.6.1.2.1.33.1.2)
    const discoveredBatteryOids = [];
    await safeSubtree(session, '1.3.6.1.2.1.33.1.2', 20, (vbs) => {
        for (const vb of vbs) {
            if (!snmp.isVarbindError(vb) && vb.value !== undefined && vb.value !== null) {
                const oidStr = vb.oid.toString();
                const val = vb.value.toString();
                discoveredBatteryOids.push(`${oidStr}=${val}`);
                // upsEstimatedChargeRemaining (1.3.6.1.2.1.33.1.2.4)
                if (oidStr.includes('.1.3.6.1.2.1.33.1.2.4') && !resources.batteryCapacity) {
                    resources.batteryCapacity = `${val}%`;
                }
                // upsEstimatedMinutesRemaining (1.3.6.1.2.1.33.1.2.3)
                if (oidStr.includes('.1.3.6.1.2.1.33.1.2.3') && !resources.batteryRuntime) {
                    resources.batteryRuntime = val;
                }
                // upsBatteryVoltage (1.3.6.1.2.1.33.1.2.5)
                if (oidStr.includes('.1.3.6.1.2.1.33.1.2.5') && !resources.batteryVoltage) {
                    const bv = parseFloat(val);
                    resources.batteryVoltage = bv > 1000 ? (bv / 10).toFixed(1) : bv.toString();
                }
                // upsBatteryTemperature (1.3.6.1.2.1.33.1.2.7)
                if (oidStr.includes('.1.3.6.1.2.1.33.1.2.7') && !resources.temperature) {
                    resources.temperature = val;
                }
            }
        }
    });

    // 4. PowerNet Battery Root Fallback (1.3.6.1.4.1.318.1.1.1.2)
    await safeSubtree(session, '1.3.6.1.4.1.318.1.1.1.2', 20, (vbs) => {
        for (const vb of vbs) {
            if (!snmp.isVarbindError(vb) && vb.value !== undefined && vb.value !== null) {
                const oidStr = vb.oid.toString();
                const val = vb.value.toString();
                discoveredBatteryOids.push(`${oidStr}=${val}`);
                // upsAdvBatteryCapacity (1.3.6.1.4.1.318.1.1.1.2.2.1.x)
                if (oidStr.includes('.1.3.6.1.4.1.318.1.1.1.2.2.1') && !resources.batteryCapacity) {
                    resources.batteryCapacity = `${val}%`;
                }
                // upsAdvBatteryRunTimeRemaining (1.3.6.1.4.1.318.1.1.1.2.2.3.x)
                if (oidStr.includes('.1.3.6.1.4.1.318.1.1.1.2.2.3') && !resources.batteryRuntime) {
                    resources.batteryRuntime = val;
                }
                // upsAdvBatteryActualVoltage (1.3.6.1.4.1.318.1.1.1.2.2.8.x)
                if (oidStr.includes('.1.3.6.1.4.1.318.1.1.1.2.2.8') && !resources.batteryVoltage) {
                    const bv = parseFloat(val);
                    resources.batteryVoltage = bv > 1000 ? (bv / 10).toFixed(1) : bv.toString();
                }
                // upsAdvBatteryTemperature (1.3.6.1.4.1.318.1.1.1.2.2.2.x)
                if (oidStr.includes('.1.3.6.1.4.1.318.1.1.1.2.2.2') && !resources.temperature) {
                    resources.temperature = val;
                }
            }
        }
    });

    if (discoveredBatteryOids.length > 0) {
        console.log(`   [Discovered Battery OIDs]:`, discoveredBatteryOids.join(', '));
    }

    console.log(`   [UPS Fallback Processed]:`, {
        outputLoad: resources.outputLoad,
        outputVoltage: resources.outputVoltage,
        inputVoltage: resources.inputVoltage,
        inputFrequency: resources.inputFrequency,
        batteryCapacity: resources.batteryCapacity,
        batteryVoltage: resources.batteryVoltage
    });
};

/**
 * Fallback penelusuran CPU untuk switch Cisco IOS-XE / Catalyst & HPE Comware
 */
export const fetchCpuTableFallback = async (session, profile, resources) => {
    if (resources.cpu && resources.cpu !== 'N/A' && resources.cpu !== '-' && resources.cpu !== '0%' && resources.cpu !== '0') {
        return;
    }

    const cpuRootOid = profile.id?.startsWith('cisco')
        ? '1.3.6.1.4.1.9.9.109.1.1.1.1.5'
        : (profile.id === 'hpe_comware' || profile.id?.includes('comware'))
            ? '1.3.6.1.4.1.25506.2.6.1.1.1.1.6'
            : null;

    if (!cpuRootOid) return;

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
};

/**
 * Fallback penelusuran memori RAM untuk Cisco IOS-XE & HPE Comware
 */
export const fetchMemoryTableFallback = async (session, profile, resources) => {
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
};

/**
 * Fallback penelusuran suhu sensor untuk Cisco CISCO-ENVMON & HPE Comware
 */
export const fetchTemperatureTableFallback = async (session, profile, resources) => {
    if (!resources.temperature || resources.temperature === 'N/A' || Number(resources.temperature) > 120 || Number(resources.temperature) < 10) {
        if (profile.id?.startsWith('cisco')) {
            await new Promise((res) => {
                session.subtree('1.3.6.1.4.1.9.9.91.1.1.1.1.4', 20, (vbs) => {
                    for (const vb of vbs) {
                        if (!snmp.isVarbindError(vb) && vb.value !== undefined && vb.value !== null) {
                            const val = Number(vb.value);
                            if (val >= 15 && val <= 90) {
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
};

/**
 * Fallback penelusuran entPhysicalTable untuk Model dan Serial Number
 */
export const fetchEntityPhysicalFallback = async (session, info) => {
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
};
