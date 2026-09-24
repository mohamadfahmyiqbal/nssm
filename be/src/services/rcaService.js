// services/rcaService.js
/**
 * Root Cause Analysis (RCA) Engine
 * Murni komputasi in-memory (O(N)), zero child process, aman dari deteksi EDR (Cybereason).
 */

/**
 * Membangun peta relasi Parent-Child berdasarkan atribut SWITCH pada perangkat
 * @param {Array} devices Daftar perangkat dari database
 * @returns {{ parentMap: Map, childrenMap: Map, deviceLookup: Map }}
 */
export const buildTopologyGraph = (devices = []) => {
    const parentMap = new Map();     // childPID -> parentPID
    const childrenMap = new Map();   // parentPID -> Set of childPIDs
    const deviceLookup = new Map();  // identifier (PID / HOSTNAME / IP) -> Device Object

    // 1. Indeks semua perangkat berdasarkan PID, HOSTNAME, dan IP
    devices.forEach((dev) => {
        if (dev.PID) deviceLookup.set(dev.PID.toLowerCase(), dev);
        if (dev.HOSTNAME) deviceLookup.set(dev.HOSTNAME.toLowerCase(), dev);
        if (dev.IP && dev.IP !== '-') deviceLookup.set(dev.IP, dev);
    });

    // 2. Hubungkan ketergantungan relasi uplink (child -> parent switch)
    devices.forEach((dev) => {
        if (!dev.PID) return;
        const switchRef = (dev.SWITCH || '').trim().toLowerCase();

        if (switchRef && switchRef !== '-' && switchRef !== 'none') {
            const parentDev = deviceLookup.get(switchRef);
            if (parentDev && parentDev.PID !== dev.PID) {
                parentMap.set(dev.PID, parentDev.PID);

                if (!childrenMap.has(parentDev.PID)) {
                    childrenMap.set(parentDev.PID, new Set());
                }
                childrenMap.get(parentDev.PID).add(dev.PID);
            }
        }
    });

    return { parentMap, childrenMap, deviceLookup };
};

/**
 * Melakukan Root Cause Analysis pada hasil polling status perangkat
 * @param {Array} validDevices Daftar perangkat yang dipolling
 * @param {Map} deviceStatusMap Map berisi status status saat ini (PID -> 'UP' | 'DOWN')
 * @returns {Object} Hasil analisis RCA
 */
export const performRootCauseAnalysis = (validDevices = [], deviceStatusMap = new Map()) => {
    const { parentMap, childrenMap, deviceLookup } = buildTopologyGraph(validDevices);

    const downDevices = validDevices.filter((dev) => {
        const status = deviceStatusMap.get(dev.PID);
        return status === 'DOWN';
    });

    const downPids = new Set(downDevices.map((d) => d.PID));
    const deviceRcaMap = {};
    const rootCauseIncidents = [];
    const isolatedFailures = [];

    // Helper untuk menemukan akar masalah dari simpul yang DOWN
    const findRootCause = (pid, visited = new Set()) => {
        if (visited.has(pid)) return pid; // Cegah circular loop
        visited.add(pid);

        const parentPid = parentMap.get(pid);
        if (!parentPid) return pid; // Tidak punya parent, simpul ini adalah akar

        // Jika parent juga DOWN, telusuri terus ke atas (upstream)
        if (downPids.has(parentPid)) {
            return findRootCause(parentPid, visited);
        }

        // Jika parent UP, maka simpul ini adalah akar kegagalan di cabangnya
        return pid;
    };

    // Helper untuk mengumpulkan seluruh node turunan yang terdampak di bawah suatu Root Cause
    const collectDownstreamImpact = (rootPid) => {
        const impacted = [];
        const queue = [rootPid];
        const visited = new Set([rootPid]);

        while (queue.length > 0) {
            const currPid = queue.shift();
            const children = childrenMap.get(currPid);
            if (children) {
                for (const childPid of children) {
                    if (!visited.has(childPid)) {
                        visited.add(childPid);
                        if (downPids.has(childPid)) {
                            const childDev = deviceLookup.get(childPid.toLowerCase());
                            if (childDev) {
                                impacted.push({
                                    PID: childDev.PID,
                                    HOSTNAME: childDev.HOSTNAME || childDev.PID,
                                    IP: childDev.IP || '-',
                                    TYPE: childDev.TYPE || 'UNKNOWN'
                                });
                            }
                            queue.push(childPid);
                        }
                    }
                }
            }
        }
        return impacted;
    };

    // Kelompokkan perangkat DOWN ke masing-masing Root Cause
    const rootCauseGroups = new Map(); // rootPid -> Array of childPids

    for (const dev of downDevices) {
        const rootPid = findRootCause(dev.PID);
        if (!rootCauseGroups.has(rootPid)) {
            rootCauseGroups.set(rootPid, []);
        }
        if (rootPid !== dev.PID) {
            rootCauseGroups.get(rootPid).push(dev.PID);
        }
    }

    // Klasifikasikan masing-masing grup insiden
    for (const [rootPid, directChildren] of rootCauseGroups.entries()) {
        const rootDev = deviceLookup.get(rootPid.toLowerCase());
        if (!rootDev) continue;

        const allImpacted = collectDownstreamImpact(rootPid);
        const hasChildren = (childrenMap.get(rootPid)?.size || 0) > 0;

        if (hasChildren && allImpacted.length > 0) {
            // Perangkat adalah Switch / Hub / Router yang menyebabkan kegagalan massal
            rootCauseIncidents.push({
                rootDevice: {
                    PID: rootDev.PID,
                    HOSTNAME: rootDev.HOSTNAME || rootDev.PID,
                    IP: rootDev.IP || '-',
                    TYPE: rootDev.TYPE || 'SWITCH',
                    VENDOR: rootDev.VENDOR || '-'
                },
                impactCount: allImpacted.length,
                impactedDevices: allImpacted
            });

            deviceRcaMap[rootDev.PID] = {
                classification: 'ROOT_CAUSE',
                isRootCause: true,
                rootCauseDevice: null,
                impactCount: allImpacted.length
            };

            for (const imp of allImpacted) {
                deviceRcaMap[imp.PID] = {
                    classification: 'CASCADING_DOWN',
                    isRootCause: false,
                    rootCauseDevice: {
                        PID: rootDev.PID,
                        HOSTNAME: rootDev.HOSTNAME || rootDev.PID,
                        IP: rootDev.IP || '-'
                    },
                    impactCount: 0
                };
            }
        } else {
            // Kegagalan endpoint tunggal (misal: 1 PC atau 1 CCTV mati mandiri)
            isolatedFailures.push({
                PID: rootDev.PID,
                HOSTNAME: rootDev.HOSTNAME || rootDev.PID,
                IP: rootDev.IP || '-',
                TYPE: rootDev.TYPE || 'ENDPOINT'
            });

            deviceRcaMap[rootDev.PID] = {
                classification: 'ISOLATED_DOWN',
                isRootCause: false,
                rootCauseDevice: null,
                impactCount: 0
            };
        }
    }

    // Set perangkat yang UP
    validDevices.forEach((dev) => {
        if (!downPids.has(dev.PID)) {
            deviceRcaMap[dev.PID] = {
                classification: 'UP',
                isRootCause: false,
                rootCauseDevice: null,
                impactCount: 0
            };
        }
    });

    return {
        timestamp: new Date().toISOString(),
        summary: {
            totalMonitored: validDevices.length,
            totalDown: downDevices.length,
            rootCausesCount: rootCauseIncidents.length,
            isolatedDownCount: isolatedFailures.length,
            cascadingDownCount: downDevices.length - (rootCauseIncidents.length + isolatedFailures.length)
        },
        rootCauses: rootCauseIncidents,
        isolatedFailures,
        deviceRcaMap
    };
};
