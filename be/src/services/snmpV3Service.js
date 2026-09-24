import snmp from 'net-snmp';
import dgram from 'dgram';

export const walkSubtree = (session, oid) => {
    return new Promise((resolve) => {
        let results = {};
        session.subtree(oid, 48, (row) => {
            row.forEach(vb => {
                if (!snmp.isVarbindError(vb)) {
                    let oidStr = vb.oid.toString();
                    let index = oidStr.split('.').pop();
                    results[index] = vb.value;
                }
            });
        }, () => {
            resolve(results);
        });
    });
};

export const createSnmpSession = (ip, credential = {}, customOptions = {}) => {
    const rawVersion = String(credential.version || credential.snmpVersion || 'v3').toLowerCase();
    const isV3 = rawVersion.includes('3');
    const isV1 = rawVersion === 'v1' || rawVersion === '1';
    const port = parseInt(credential.port || credential.snmpPort) || 161;

    const options = {
        port,
        retries: customOptions.retries !== undefined ? customOptions.retries : 2,
        timeout: customOptions.timeout !== undefined ? customOptions.timeout : 5000,
        transport: 'udp4',
        version: isV3 ? snmp.Version3 : (isV1 ? snmp.Version1 : snmp.Version2c),
        ...customOptions
    };

    if (isV3) {
        const username = credential.username || credential.user || credential.snmpUser || 'admin';
        const authProtoKey = (credential.authProtocol || credential.snmpAuthProto || 'sha').toLowerCase();
        const privProtoKey = (credential.privProtocol || credential.snmpPrivProto || 'aes').toLowerCase();
        const user = {
            name: username,
            level: snmp.SecurityLevel.authPriv,
            authProtocol: snmp.AuthProtocols[authProtoKey] || snmp.AuthProtocols.sha,
            authKey: credential.authKey || credential.snmpAuthKey || 'B@tokK4l4p4',
            privProtocol: snmp.PrivProtocols[privProtoKey] || snmp.PrivProtocols.aes,
            privKey: credential.privKey || credential.snmpPrivKey || 'B@tokK4l4p4'
        };
        return snmp.createV3Session(ip, user, options);
    } else {
        const community = credential.community || credential.snmpCommunity || 'public';
        return snmp.createSession(ip, community, options);
    }
};

export const getSwitchPortStatus = async (ip, credential) => {
    const session = createSnmpSession(ip, credential, { retries: 1, timeout: 3000 });
    
    // Mencegah crash Unhandled 'error' event dari UDP socket di library net-snmp
    session.on('error', (err) => {
        try { session.close(); } catch (e) {}
    });
    
    try {
        const [ifNames, ifDescrs, ifAliases, ifAdminStatuses, ifTypes, ifInHC, ifOutHC, ifIn32, ifOut32, ifInErrors, ifOutErrors, ifStatuses] = await Promise.all([
            walkSubtree(session, '1.3.6.1.2.1.31.1.1.1.1'),  // ifName (e.g. Gi1/0/1, Po40)
            walkSubtree(session, '1.3.6.1.2.1.2.2.1.2'),     // ifDescr (e.g. GigabitEthernet1/0/1)
            walkSubtree(session, '1.3.6.1.2.1.31.1.1.1.18'), // ifAlias (e.g. To-Port3-FortiGate)
            walkSubtree(session, '1.3.6.1.2.1.2.2.1.7'),     // ifAdminStatus (1=up, 2=down)
            walkSubtree(session, '1.3.6.1.2.1.2.2.1.3'),     // ifType
            walkSubtree(session, '1.3.6.1.2.1.31.1.1.1.6'),  // ifHCInOctets
            walkSubtree(session, '1.3.6.1.2.1.31.1.1.1.10'), // ifHCOutOctets
            walkSubtree(session, '1.3.6.1.2.1.2.2.1.10'),    // ifInOctets
            walkSubtree(session, '1.3.6.1.2.1.2.2.1.16'),    // ifOutOctets
            walkSubtree(session, '1.3.6.1.2.1.2.2.1.14'),    // ifInErrors
            walkSubtree(session, '1.3.6.1.2.1.2.2.1.20'),    // ifOutErrors
            walkSubtree(session, '1.3.6.1.2.1.2.2.1.8')      // ifOperStatus (1=up, 2=down)
        ]);

        const ports = {};
        Object.keys(ifNames).forEach(idx => {
            const inVal = ifInHC[idx] || ifIn32[idx] || 0;
            const outVal = ifOutHC[idx] || ifOut32[idx] || 0;
            const operStatus = ifStatuses[idx];
            const adminStatus = ifAdminStatuses[idx];
            const portName = ifNames[idx].toString();
            const portDescr = ifDescrs[idx] ? ifDescrs[idx].toString() : portName;
            const portAlias = ifAliases[idx] ? ifAliases[idx].toString() : '';

            let detailedStatus = 'DOWN';
            if (adminStatus === 2) {
                detailedStatus = 'DISABLED';
            } else if (operStatus === 1) {
                detailedStatus = 'CONNECTED';
            } else {
                detailedStatus = 'NOT_CONNECTED';
            }

            ports[portName] = {
                status: (operStatus === 1) ? 'UP' : 'DOWN',
                detailedStatus,
                alias: portAlias,
                ifDescr: portDescr,
                ifName: portName,
                rawIn: inVal,
                rawOut: outVal,
                inErrors: ifInErrors[idx] || 0,
                outErrors: ifOutErrors[idx] || 0
            };
        });

        session.close();
        return { isAlive: true, ports };
    } catch (e) {
        session.close();
        return { isAlive: false, ports: {} };
    }
};

export const checkSnmp = (ip, credential) => {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const session = createSnmpSession(ip, credential, { retries: 2, timeout: 5000 });
        let isClosed = false;
        const originalClose = session.close.bind(session);
        session.close = () => {
            if (!isClosed) {
                isClosed = true;
                try { originalClose(); } catch (e) {}
            }
        };

        // Tangkap event error internal untuk mencegah crash
        session.on('error', (err) => {
            session.close();
            resolve({ isAlive: false, ms: 0 });
        });

        session.get(['1.3.6.1.2.1.1.1.0', '1.3.6.1.2.1.1.2.0', '1.3.6.1.2.1.1.3.0'], (error, varbinds) => {
            const ms = Date.now() - startTime;
            session.close();

            if (error || !varbinds || varbinds.length === 0) {
                resolve({ isAlive: false, ms: 0 });
            } else {
                const hasValid = varbinds.some(vb => vb && !snmp.isVarbindError(vb));
                resolve({ isAlive: hasValid, ms: hasValid ? ms : 0 });
            }
        });
    });
};

export const fetchNvrData = (ip, credential) => {
    return new Promise((resolve) => {
        const session = createSnmpSession(ip, credential, { retries: 2, timeout: 5000 });
        let isClosed = false;
        const originalClose = session.close.bind(session);
        session.close = () => {
            if (!isClosed) {
                isClosed = true;
                try { originalClose(); } catch (e) {}
            }
        };
        session.on('error', () => { session.close(); resolve(null); });

        session.get(["1.3.6.1.2.1.1.2.0", "1.3.6.1.2.1.1.1.0"], (error, varbinds) => {
            if (error || snmp.isVarbindError(varbinds[0])) {
                session.close();
                return resolve(null);
            }

            let sysObjectID = varbinds[0].value.toString();
            let sysDescr = varbinds[1].value ? varbinds[1].value.toString() : "";
            let isPanasonic = sysObjectID.includes(".258");
            let isIpro = sysObjectID.includes(".57501");

            let OID_INFO = [];
            let labels = [];

            if (isPanasonic) {
                OID_INFO = [
                    "1.3.6.1.4.1.258.1.2.1.1.0", "1.3.6.1.4.1.258.1.2.1.2.0", "1.3.6.1.4.1.258.1.2.1.13.0",
                    "1.3.6.1.4.1.258.5100.1.1.0", "1.3.6.1.4.1.258.5100.1.2.0", "1.3.6.1.4.1.258.5100.200.1.16.2.1.0"
                ];
                labels = ["manufacturer", "model", "serialNumber", "userAccessCount", "alarmSummary", "temperature"];
            } else {
                OID_INFO = [
                    "1.3.6.1.4.1.57501.1.1.0", "1.3.6.1.4.1.57501.1.2.0", "1.3.6.1.4.1.57501.1.3.0",
                    "1.3.6.1.4.1.57501.1.4.0", "1.3.6.1.4.1.57501.200.1.2.1.0", "1.3.6.1.4.1.57501.200.1.2.2.0",
                    "1.3.6.1.4.1.57501.200.1.16.2.1.0"
                ];
                labels = ["manufacturer", "model", "serialNumber", "firmware", "userAccessCount", "alarmSummary", "temperature"];
            }

            session.get(OID_INFO, (error2, vbs) => {
                if (error2) {
                    session.close();
                    return resolve(null);
                }
                const data = {};
                for (let i = 0; i < vbs.length; i++) {
                    if (snmp.isVarbindError(vbs[i])) {
                        data[labels[i]] = "N/A";
                    } else {
                        data[labels[i]] = vbs[i].value ? vbs[i].value.toString() : "N/A";
                    }
                }

                if (isPanasonic && sysDescr) {
                    let match = sysDescr.match(/SWVer([\d\.]+)/i);
                    data.firmware = match ? match[1] : "N/A";
                }

                let hddData = [];
                let hddSubtree = isPanasonic ? "1.3.6.1.4.1.258.5100.200.1.13.1" : "1.3.6.1.4.1.57501.200.1.13.1";

                if (hddSubtree) {
                    session.subtree(hddSubtree, 10, (row) => {
                        row.forEach(vb => {
                            if (!snmp.isVarbindError(vb)) {
                                hddData.push(vb.value.toString());
                            }
                        });
                    }, (err) => {
                        session.close();
                        data.hdd = hddData;
                        resolve(data);
                    });
                } else {
                    session.close();
                    data.hdd = [];
                    resolve(data);
                }
            });
        });
    });
};

export const getCamerasFromNvr = (ip, credential) => {
    return new Promise((resolve) => {
        const session = createSnmpSession(ip, credential, { retries: 2, timeout: 5000 });
        let isClosed = false;
        const originalClose = session.close.bind(session);
        session.close = () => {
            if (!isClosed) {
                isClosed = true;
                try { originalClose(); } catch (e) {}
            }
        };
        session.on('error', () => { session.close(); resolve([]); });

        session.get(["1.3.6.1.2.1.1.2.0"], (error, varbinds) => {
            if (error || snmp.isVarbindError(varbinds[0])) {
                session.close();
                return resolve([]);
            }

            let sysObjectID = varbinds[0].value.toString();
            let camSubtree = null;

            if (sysObjectID.includes(".57501")) {
                camSubtree = "1.3.6.1.4.1.57501.200.1.15";
            } else if (sysObjectID.includes(".258")) {
                camSubtree = "1.3.6.1.4.1.258.5100.200.1.15";
            } else {
                session.close();
                return resolve([]);
            }

            let cameraData = {};
            session.subtree(camSubtree, 300, (camVarbinds) => {
                for (let i = 0; i < camVarbinds.length; i++) {
                    if (!snmp.isVarbindError(camVarbinds[i])) {
                        let oidStr = camVarbinds[i].oid.toString();
                        let valStr = camVarbinds[i].value ? camVarbinds[i].value.toString() : "";
                        let parts = oidStr.split(".");
                        let camIdx = parts[parts.length - 2]; 

                        if (!cameraData[camIdx]) cameraData[camIdx] = { status: "DOWN", channel: camIdx, ip: "" };

                        if (valStr === "1") {
                            cameraData[camIdx].status = "UP";
                        } else if (valStr === "0" || valStr === "2") {
                            cameraData[camIdx].status = "DOWN";
                        } else if (valStr.includes(".")) {
                            cameraData[camIdx].ip = valStr;
                        }
                    }
                }
            }, () => {
                session.close();
                let validCams = Object.values(cameraData);
                resolve(validCams);
            });
        });
    });
};



export const fetchDeviceSnmpData = (ip, credential) => {
    return new Promise((resolve) => {
        const session = createSnmpSession(ip, credential, { retries: 1, timeout: 5000 });
        let isClosed = false;
        const originalClose = session.close.bind(session);
        session.close = () => {
            if (!isClosed) {
                isClosed = true;
                try { originalClose(); } catch (e) {}
            }
        };
        session.on('error', () => { session.close(); resolve(null); });

        const OID_SYS_INFO = [
            '1.3.6.1.2.1.1.1.0', '1.3.6.1.2.1.1.3.0', '1.3.6.1.2.1.1.5.0',
            '1.3.6.1.2.1.1.6.0', '1.3.6.1.2.1.2.1.0', '1.3.6.1.2.1.7.1.0',
            '1.3.6.1.2.1.2.2.1.10.1', '1.3.6.1.2.1.2.2.1.16.1'
        ];

        session.get(OID_SYS_INFO, (error, varbinds) => {
            if (error) { session.close(); return resolve(null); }
            const sysDescr = (varbinds[0] && !snmp.isVarbindError(varbinds[0])) ? varbinds[0].value.toString().split('\n')[0] : 'N/A';
            const sysName = (varbinds[2] && !snmp.isVarbindError(varbinds[2])) ? varbinds[2].value.toString() : 'N/A';
            const sysLocation = (varbinds[3] && !snmp.isVarbindError(varbinds[3])) ? varbinds[3].value.toString() : 'N/A';
            
            let ifDescrs = {};
            let ports = [];
            
            session.subtree('1.3.6.1.2.1.2.2.1.2', 48, (row) => {
                row.forEach(vb => {
                    if (!snmp.isVarbindError(vb)) {
                        const idx = vb.oid.toString().split('.').pop();
                        ifDescrs[idx] = vb.value.toString();
                    }
                });
            }, () => {
                session.subtree('1.3.6.1.2.1.2.2.1.8', 48, (row) => {
                    row.forEach(vb => {
                        if (!snmp.isVarbindError(vb)) {
                            const idx = vb.oid.toString().split('.').pop();
                            const descr = ifDescrs[idx] || '';
                            const descrLower = descr.toLowerCase();
                            
                            const isPhysical = descrLower.includes('ethernet') || (descrLower.includes('port') && !descrLower.includes('stack'));
                            const isLogical = descrLower.includes('vlan') || descrLower.includes('null') || descrLower.includes('loopback');
                            
                            if (isPhysical && !isLogical) {
                                let shortName = idx;
                                const isSFP = descrLower.includes('tengigabit') || descrLower.includes('fortygigabit') || descrLower.includes('sfp');
                                const portMatch = descr.match(/(?:(\d+)\/)?(\d+)\/(\d+)$/);
                                
                                if (portMatch) {
                                    const module = portMatch[2];
                                    const portNum = portMatch[3];
                                    if (module === '0' && portNum === '0') shortName = 'MGT';
                                    else if (module !== '0' || isSFP) shortName = 'SFP' + portNum;
                                    else shortName = portNum;
                                } else {
                                    const endNumMatch = descr.match(/(\d+)$/);
                                    shortName = endNumMatch ? endNumMatch[1] : idx;
                                    if (isSFP) shortName = 'SFP' + shortName;
                                    else if (descrLower.includes('fastethernet')) shortName = 'Fa' + shortName;
                                }

                                ports.push({
                                    index: idx,
                                    name: descr,
                                    shortName: shortName,
                                    status: vb.value === 1 ? 'up' : 'down'
                                });
                            }
                        }
                    });
                }, () => {
                    session.close();
                    resolve({
                        sysName, sysDescr, sysLocation, ports
                    });
                });
            });
        });
    });
};
