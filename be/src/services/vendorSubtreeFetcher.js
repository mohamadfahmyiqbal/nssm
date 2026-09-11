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
    let ifDescrs = {};
    let ifAliases = {};
    let ifInOctets = {};
    let ifOutOctets = {};
    let portList = [];
    let totalOctetsIn = 0;
    let totalOctetsOut = 0;

    // 1. Ambil ifDescr
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

    // 2. Ambil ifAlias (Label kabel / Deskripsi port)
    await new Promise((res) => {
        session.subtree('1.3.6.1.2.1.31.1.1.1.18', 48, (row) => {
            row.forEach(vb => {
                if (!snmp.isVarbindError(vb)) {
                    const idx = vb.oid.toString().split('.').pop();
                    const alias = vb.value ? vb.value.toString() : '';
                    if (alias) ifAliases[idx] = alias;
                }
            });
        }, res);
    });

    // 3. Ambil ifInOctets (Traffic In)
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

    // 4. Ambil ifOutOctets (Traffic Out)
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

    // 5. Ambil ifOperStatus & assemble ports
    await new Promise((res) => {
        session.subtree('1.3.6.1.2.1.2.2.1.8', 48, (row) => {
            row.forEach(vb => {
                if (!snmp.isVarbindError(vb)) {
                    const idx = vb.oid.toString().split('.').pop();
                    const descr = ifDescrs[idx] || '';
                    const descrLower = descr.toLowerCase();
                    const isPhysical = descrLower.includes('ethernet') || (descrLower.includes('port') && !descrLower.includes('stack')) || descrLower.startsWith('gi') || descrLower.startsWith('te') || descrLower.startsWith('fa');
                    const isLogical = descrLower.includes('vlan') || descrLower.includes('null') || descrLower.includes('loopback');
                    if (isPhysical && !isLogical) {
                        const portAlias = ifAliases[idx] || '';
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

                        portList.push({
                            index: idx,
                            name: descr,
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

    return {
        ports: portList,
        totalOctetsIn,
        totalOctetsOut
    };
};
