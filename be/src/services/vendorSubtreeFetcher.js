import snmp from 'net-snmp';

/**
 * Walk Subtree helper
 */
export const walkSubtreeList = (session, rootOid, maxRepetitions = 20, mapFn) => {
    return new Promise((resolve) => {
        const list = [];
        session.subtree(rootOid, maxRepetitions, (row) => {
            row.forEach(vb => {
                if (!snmp.isVarbindError(vb)) {
                    if (mapFn) {
                        const item = mapFn(vb);
                        if (item) list.push(item);
                    } else {
                        list.push({ status: vb.value.toString() });
                    }
                }
            });
        }, () => resolve(list));
    });
};

/**
 * Tarik Port Switch (Physical Interfaces dengan Alias, Speed, dan Akumulasi Trafik)
 */
export const fetchSwitchPorts = async (session) => {
    let ifNames = {};
    let ifDescrs = {};
    let ifAliases = {};
    let ifInOctets = {};
    let ifOutOctets = {};
    let portList = [];
    let totalOctetsIn = 0;
    let totalOctetsOut = 0;

    // 1. Ambil ifName (1.3.6.1.2.1.31.1.1.1.1) e.g. Gi1/0/1
    await new Promise((res) => {
        session.subtree('1.3.6.1.2.1.31.1.1.1.1', 48, (row) => {
            row.forEach(vb => {
                if (!snmp.isVarbindError(vb)) {
                    const idx = vb.oid.toString().split('.').pop();
                    ifNames[idx] = vb.value.toString();
                }
            });
        }, res);
    });

    // 2. Ambil ifDescr (1.3.6.1.2.1.2.2.1.2)
    await new Promise((res) => {
        session.subtree('1.3.6.1.2.1.2.2.1.2', 48, (row) => {
            row.forEach(vb => {
                if (!snmp.isVarbindError(vb)) {
                    const idx = vb.oid.toString().split('.').pop();
                    ifDescrs[idx] = vb.value.toString();
                }
            });
        }, res);
    });

    // 3. Ambil ifAlias (Label kabel / Deskripsi port)
    await new Promise((res) => {
        session.subtree('1.3.6.1.2.1.31.1.1.1.18', 48, (row) => {
            row.forEach(vb => {
                if (!snmp.isVarbindError(vb)) {
                    const idx = vb.oid.toString().split('.').pop();
                    const alias = vb.value ? vb.value.toString().trim() : '';
                    if (alias) ifAliases[idx] = alias;
                }
            });
        }, res);
    });

    // 4. Ambil ifInOctets (Traffic In)
    await new Promise((res) => {
        session.subtree('1.3.6.1.2.1.2.2.1.10', 48, (row) => {
            row.forEach(vb => {
                if (!snmp.isVarbindError(vb) && vb.value !== undefined) {
                    const idx = vb.oid.toString().split('.').pop();
                    const val = Number(vb.value) || 0;
                    ifInOctets[idx] = val;
                    totalOctetsIn += val;
                }
            });
        }, res);
    });

    // 5. Ambil ifOutOctets (Traffic Out)
    await new Promise((res) => {
        session.subtree('1.3.6.1.2.1.2.2.1.16', 48, (row) => {
            row.forEach(vb => {
                if (!snmp.isVarbindError(vb) && vb.value !== undefined) {
                    const idx = vb.oid.toString().split('.').pop();
                    const val = Number(vb.value) || 0;
                    ifOutOctets[idx] = val;
                    totalOctetsOut += val;
                }
            });
        }, res);
    });

    // 6. Ambil ifOperStatus & assemble ports
    await new Promise((res) => {
        session.subtree('1.3.6.1.2.1.2.2.1.8', 48, (row) => {
            row.forEach(vb => {
                if (!snmp.isVarbindError(vb)) {
                    const idx = vb.oid.toString().split('.').pop();
                    const rawName = ifNames[idx] || ifDescrs[idx] || '';
                    const descr = ifDescrs[idx] || rawName;
                    const descrLower = descr.toLowerCase();
                    const nameLower = rawName.toLowerCase();

                    const isPhysical = descrLower.includes('ethernet') || 
                                       descrLower.includes('port-channel') || 
                                       (descrLower.includes('port') && !descrLower.includes('stack')) || 
                                       nameLower.startsWith('gi') || 
                                       nameLower.startsWith('te') || 
                                       nameLower.startsWith('fa') || 
                                       nameLower.startsWith('po');
                    const isLogical = descrLower.includes('vlan') || descrLower.includes('null') || descrLower.includes('loopback');
                    
                    if (isPhysical && !isLogical) {
                        const portAlias = ifAliases[idx] || '';
                        
                        let shortName = rawName;
                        shortName = shortName
                            .replace(/^GigabitEthernet/i, 'Gi')
                            .replace(/^TenGigabitEthernet/i, 'Te')
                            .replace(/^FastEthernet/i, 'Fa')
                            .replace(/^Port-channel/i, 'Po')
                            .replace(/^Ethernet/i, 'Eth');

                        portList.push({
                            index: idx,
                            name: rawName || descr,
                            alias: portAlias,
                            shortName: shortName,
                            status: vb.value === 1 ? 'up' : 'down',
                            inOctets: ifInOctets[idx] || 0,
                            outOctets: ifOutOctets[idx] || 0
                        });
                    }
                }
            });
        }, res);
    });

    // Sort natural e.g. Gi1/0/1, Gi1/0/2 ... Gi1/0/24
    portList.sort((a, b) => {
        return (a.shortName || a.name).localeCompare(b.shortName || b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

    return {
        ports: portList,
        totalOctetsIn,
        totalOctetsOut
    };
};
