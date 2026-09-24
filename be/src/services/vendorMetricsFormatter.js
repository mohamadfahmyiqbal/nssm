/**
 * Format metrik spesifik vendor AP (Ubiquiti UniFi)
 */
export const formatUnifiApMetrics = (profile, resources) => {
    if (profile.id !== 'unifi_ap') return;

    // Ubiquiti UniFi AP: Format CPU load average (mis. "0.15" -> "15%")
    if (resources.cpu && resources.cpu !== 'N/A') {
        const loadVal = parseFloat(resources.cpu);
        if (!isNaN(loadVal)) {
            if (loadVal <= 1.0 && loadVal >= 0) {
                resources.cpu = `${Math.round(loadVal * 100)}%`;
            } else if (!resources.cpu.includes('%')) {
                resources.cpu = `${Math.round(loadVal)}%`;
            }
        }
    }

    // Ubiquiti UniFi AP: Hitung RAM jika ada memTotal dan memFree (UCD-SNMP)
    if (resources.memTotal && resources.memFree && !resources.memory) {
        const tot = parseFloat(resources.memTotal);
        const free = parseFloat(resources.memFree);
        if (!isNaN(tot) && !isNaN(free) && tot > 0) {
            const used = Math.max(0, tot - free);
            resources.memUsed = used;
            resources.memory = `${Math.round((used / tot) * 100)}%`;
        }
    }
};

/**
 * Format metrik UPS Schneider / APC (PowerNet MIB & RFC1628 UPS-MIB)
 */
export const formatUpsMetrics = (profile, info, resources) => {
    if (!profile.isUps) return;

    // 1. Kapasitas Baterai
    const batCap = resources.batteryCapacity || resources.stdBatteryCapacity;
    if (batCap && batCap !== 'N/A') {
        resources.batteryCapacity = String(batCap).includes('%') ? batCap : `${batCap}%`;
    }

    // 2. Beban Output (Load)
    const outLoad = resources.outputLoad || resources.stdOutputPercent;
    if (outLoad && outLoad !== 'N/A') {
        resources.outputLoad = outLoad;
        resources.load = String(outLoad).includes('%') ? outLoad : `${outLoad}%`;
        resources.cpu = resources.load;
    }

    // 3. Estimasi Runtime
    const rtVal = resources.batteryRuntime || resources.stdBatteryRuntime;
    if (rtVal && rtVal !== 'N/A') {
        const ticks = parseInt(rtVal, 10);
        if (!isNaN(ticks)) {
            const mins = ticks > 1000 ? Math.floor(ticks / 6000) : ticks;
            const hours = Math.floor(mins / 60);
            const remMins = mins % 60;
            resources.runtimeRemaining = hours > 0 ? `${hours}h ${remMins}m` : `${remMins}m`;
        }
    }

    // 4. Tegangan Baterai
    const batVolt = resources.batteryVoltage || resources.stdBatteryVoltage;
    if (batVolt && batVolt !== 'N/A') {
        const bv = parseFloat(batVolt);
        resources.batteryVoltage = bv > 1000 ? (bv / 10).toFixed(1) : bv.toString();
    }

    // 5. Tegangan Output & Input
    if (!resources.outputVoltage && resources.stdOutputVoltage) {
        resources.outputVoltage = resources.stdOutputVoltage;
    }
    if (!resources.inputVoltage && resources.stdInputVoltage) {
        resources.inputVoltage = resources.stdInputVoltage;
    }
    if (!resources.inputFrequency && resources.stdInputFrequency) {
        const f = parseFloat(resources.stdInputFrequency);
        resources.inputFrequency = f > 100 ? (f / 10).toFixed(1) : f.toString();
    }

    // 6. Suhu Baterai
    const temp = resources.batteryTemp || resources.stdBatteryTemp || resources.temperature;
    if (temp && temp !== 'N/A') {
        resources.temperature = temp;
    }

    // 7. Info Model & Status Fallback
    if ((!info.model || info.model === 'N/A') && info.stdModel) {
        info.model = info.stdModel;
    }
    if ((!info.batteryStatus || info.batteryStatus === 'N/A') && info.stdBatteryStatus) {
        info.batteryStatus = info.stdBatteryStatus === '2' ? 'Normal (Good)' : (info.stdBatteryStatus === '3' ? 'Low Battery' : info.stdBatteryStatus);
    }
};

/**
 * Format metrik Rack ATS APC / Schneider (AP4423A)
 */
export const formatAtsMetrics = (profile, resources) => {
    if (!profile.isAts) return;

    if (resources.outputLoad) {
        const amps = parseFloat(resources.outputLoad) / 10;
        resources.current = `${amps.toFixed(1)} A`;
        resources.cpu = `${amps.toFixed(1)} A`;
    }
};

/**
 * Upgrade profil vendor secara dinamis jika profil awal adalah generic / endpoint
 */
export const upgradeProfileFromSysDescr = (profile, sysDescr, defaultProfiles) => {
    const sysD = (sysDescr || '').toLowerCase();
    if (profile.id !== 'generic' && profile.id !== 'endpoint' && profile.isSwitch) {
        return profile;
    }

    if (sysD.includes('cisco') || sysD.includes('catalyst') || sysD.includes('ios')) {
        return defaultProfiles.cisco_ios;
    }
    if (sysD.includes('comware') || sysD.includes('5140') || sysD.includes('h3c')) {
        return defaultProfiles.hpe_comware;
    }
    if (sysD.includes('aruba') || sysD.includes('procurve') || sysD.includes('6000')) {
        return defaultProfiles.hpe_aruba;
    }
    if (sysD.includes('fortigate') || sysD.includes('fortinet')) {
        return defaultProfiles.fortigate;
    }
    if (sysD.includes('unifi') || sysD.includes('ubiquiti') || sysD.includes('uap') || sysD.includes('airmax')) {
        return defaultProfiles.unifi_ap;
    }

    return profile;
};
