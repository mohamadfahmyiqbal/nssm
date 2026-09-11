import snmp from 'net-snmp';

/**
 * Standard OID definitions (RFC1213 / IF-MIB / System)
 */
export const STD_OIDS = [
    '1.3.6.1.2.1.1.1.0',     // 0: sysDescr
    '1.3.6.1.2.1.1.3.0',     // 1: sysUpTime
    '1.3.6.1.2.1.1.5.0',     // 2: sysName
    '1.3.6.1.2.1.1.6.0',     // 3: sysLocation
    '1.3.6.1.2.1.2.1.0',     // 4: totalInterfaces
    '1.3.6.1.2.1.2.2.1.10.1', // 5: netIn
    '1.3.6.1.2.1.2.2.1.16.1'  // 6: netOut
];

/**
 * Tarik MIB-2 standar
 */
export const fetchStandardMetrics = (session) => {
    return new Promise((resolve) => {
        session.get(STD_OIDS, (err, vbs) => {
            if (err || !vbs || vbs.length === 0) return resolve({});

            const info = {};
            const resources = {};

            if (vbs[0] && !snmp.isVarbindError(vbs[0])) {
                info.sysDescr = vbs[0].value.toString().split('\n')[0];
            }
            if (vbs[1] && !snmp.isVarbindError(vbs[1])) {
                const sec = Math.floor(vbs[1].value / 100);
                const d = Math.floor(sec / 86400);
                const hr = Math.floor((sec % 86400) / 3600);
                const min = Math.floor((sec % 3600) / 60);
                info.uptime = `${d}d ${hr}h ${min}m`;
            }
            if (vbs[2] && !snmp.isVarbindError(vbs[2])) info.sysName = vbs[2].value.toString();
            if (vbs[3] && !snmp.isVarbindError(vbs[3])) info.sysLocation = vbs[3].value.toString();
            if (vbs[4] && !snmp.isVarbindError(vbs[4])) info.totalInterfaces = vbs[4].value.toString();
            if (vbs[5] && !snmp.isVarbindError(vbs[5])) resources.trafficIn = (Number(vbs[5].value) / (1024 * 1024)).toFixed(2) + ' MB';
            if (vbs[6] && !snmp.isVarbindError(vbs[6])) resources.trafficOut = (Number(vbs[6].value) / (1024 * 1024)).toFixed(2) + ' MB';

            resolve({ info, resources });
        });
    });
};

/**
 * Format status string human-readable
 */
export const formatHardwareStatus = (key, val) => {
    if (key === 'fanStatus') {
        return (val === '1' || val === '0' || val.toLowerCase().includes('ok') || val.toLowerCase().includes('normal')) ? 'Normal' : (val === 'N/A' ? 'N/A' : 'Warning/Error');
    }
    if (key === 'psuStatus') {
        return (val === '0' || val === '1' || val.toLowerCase().includes('ok') || val.toLowerCase().includes('normal')) ? 'Normal' : (val === 'N/A' ? 'N/A' : 'Fault');
    }
    if (key === 'recordingState') {
        return val === '1' ? 'Recording' : (val === '0' || val === '2' ? 'Idle / Standby' : (val === 'N/A' ? 'N/A' : val));
    }
    if (key === 'raidStatus') {
        return (val === '0' || val === '1') ? 'Normal (Healthy)' : (val === '2' ? 'Degraded/Rebuild' : val);
    }
    return val;
};
