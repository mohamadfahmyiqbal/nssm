import Asset from '../models/Asset.js';
import DeviceLog from '../models/DeviceLog.js';
import { getSwitchPortStatus } from './snmpV3Service.js';

export const inferSwitchStatus = async (validDevices, deviceStatusMap, credentials, io, trafficCounterMap, prefetchedSwitchData = {}) => {
    // 1. Kumpulkan semua switch dari daftar perangkat
    const switches = validDevices.filter(dev => {
        const hostLower = (dev.HOSTNAME || '').toLowerCase();
        return hostLower.startsWith('sw') || hostLower.includes('switch');
    });

    // 2. Polling masing-masing switch dengan SNMP
    for (const sw of switches) {
        if (!sw.IP || sw.IP === '-') continue;

        const swCred = credentials[sw.IP];
        const switchData = prefetchedSwitchData[sw.IP] || await getSwitchPortStatus(sw.IP, swCred);
        
        const myStatus = deviceStatusMap.get(sw.PID);
        
        if (switchData && switchData.isAlive) {
            if (myStatus !== 'UP') {
                deviceStatusMap.set(sw.PID, 'UP');
            }

            const now = Date.now();
            if (trafficCounterMap && !trafficCounterMap.has(sw.IP)) {
                trafficCounterMap.set(sw.IP, {});
            }
            const deviceCounters = trafficCounterMap ? trafficCounterMap.get(sw.IP) : null;

            // Proses data raw dari switch dan kalkulasi delta
            for (const [portName, portStatus] of Object.entries(switchData.ports)) {
                let inBps = 0;
                let outBps = 0;

                if (deviceCounters && portStatus.rawIn !== null && portStatus.rawOut !== null) {
                    // Normalize to BigInt (handle Buffer from Counter64 or Number from Counter32)
                    const parseBigInt = (val) => {
                        if (typeof val === 'bigint') return val;
                        if (Buffer.isBuffer(val)) return BigInt('0x' + val.toString('hex'));
                        return BigInt(val || 0);
                    };

                    const currentIn = parseBigInt(portStatus.rawIn);
                    const currentOut = parseBigInt(portStatus.rawOut);

                    if (deviceCounters[portName]) {
                        const last = deviceCounters[portName];
                        const timeDiffSec = (now - last.time) / 1000;
                        const timeDiffSecFloor = Math.floor(timeDiffSec);
                        if (timeDiffSecFloor > 0) {
                            let inDiff = currentIn - last.inOctets;
                            if (inDiff < 0n) inDiff += 18446744073709551616n;
                            inBps = Number((inDiff * 8n) / BigInt(timeDiffSecFloor));

                            let outDiff = currentOut - last.outOctets;
                            if (outDiff < 0n) outDiff += 18446744073709551616n;
                            outBps = Number((outDiff * 8n) / BigInt(timeDiffSecFloor));
                        }
                    }
                    deviceCounters[portName] = { inOctets: currentIn, outOctets: currentOut, time: now };
                }

                // Topologi Override
                for (const dev of validDevices) {
                    if (dev.SWITCH && dev.SWITCH.toLowerCase() === (sw.HOSTNAME || '').toLowerCase() && dev.PORT === portName) {
                        const childStatus = deviceStatusMap.get(dev.PID);
                        if (portStatus.status === 'DOWN' && childStatus === 'UP') {
                            deviceStatusMap.set(dev.PID, 'DOWN');
                        }
                    }
                }
                
                // Update switchData.ports dengan nilai bps untuk emit (jika diperlukan)
                portStatus.inBps = inBps;
                portStatus.outBps = outBps;
            }

            // (Opsional) Jika Anda ingin memancarkan status port ke frontend melalui socket.io
            if (io) {
                io.emit('switch:port_traffic', { ip: sw.IP, ports: switchData.ports, timestamp: now });
            }
        }
    }

    // 3. Fallback: Inferensi Topologi lama (Child to Parent)
    // Jika SNMP ke switch gagal, tapi ada device anak yang UP, maka switch pasti UP
    let overrideOccurred = true;
    while (overrideOccurred) {
        overrideOccurred = false;
        for (const dev of validDevices) {
            const myStatus = deviceStatusMap.get(dev.PID);
            if (myStatus === 'UP' && dev.SWITCH && dev.SWITCH !== '-') {
                const switchLower = dev.SWITCH.toLowerCase();
                const parentSwitch = validDevices.find(d => 
                    (d.HOSTNAME || '').toLowerCase() === switchLower || 
                    (d.PID || '').toLowerCase() === switchLower
                );
                if (parentSwitch) {
                    const parentStatus = deviceStatusMap.get(parentSwitch.PID);
                    if (parentStatus !== 'UP') {
                        deviceStatusMap.set(parentSwitch.PID, 'UP');
                        overrideOccurred = true;
                    }
                }
            }
        }
    }
};

async function logAndUpdateStatus(dev, oldStatus, newStatus, method, io) {
    await DeviceLog.create({
        PID: dev.PID,
        HOSTNAME: dev.HOSTNAME,
        PREVIOUS_STATUS: oldStatus || 'UNKNOWN',
        NEW_STATUS: newStatus,
        METHOD: method,
        LATENCY: 0
    });

    await Asset.update({ STATUS: newStatus }, { where: { PID: dev.PID } });
    if (io) {
        io.emit('device:status_update', {
            pid: dev.PID,
            ip: dev.IP,
            hostname: dev.HOSTNAME,
            status: newStatus,
            latency: 0,
            updatedAt: new Date().toISOString()
        });
    }
}
