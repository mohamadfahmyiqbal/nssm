/**
 * Profil OID untuk UPS (Schneider Easy UPS On-Line) & Transfer Switch (APC Rack ATS)
 */
export const POWER_PROFILES = {
    // --- SCHNEIDER ELECTRIC / APC EASY UPS (srvpm10kri, SRV Series, PowerNet / UPS-MIB) ---
    schneider_ups: {
        id: 'schneider_ups',
        name: 'Schneider Easy UPS On-Line (srvpm10kri)',
        category: 'ups',
        defaultMethod: 'snmp',
        aliases: [
            'schneider', 'srvpm10kri', 'srvpm10kr', 'srpm10kri', 'srpm10k', 'srvm10kri', 'srvm10k', 'srv10k', 'srv', 'easy ups', 'easy-ups',
            'apc ups', 'smart-ups', 'symmetra', 'ap9630', 'ap9640', 'ap9641'
        ],
        // Metrik Utama UPS (PowerNet MIB & RFC1628 UPS-MIB Standar)
        batteryCapacityOid: '1.3.6.1.4.1.318.1.1.1.2.2.1.0',    // upsAdvBatteryCapacity (%)
        batteryRuntimeOid: '1.3.6.1.4.1.318.1.1.1.2.2.3.0',     // upsAdvBatteryRunTimeRemaining
        batteryVoltageOid: '1.3.6.1.4.1.318.1.1.1.2.2.8.0',     // upsAdvBatteryActualVoltage (0.1 V)
        batteryTempOid: '1.3.6.1.4.1.318.1.1.1.2.2.2.0',        // upsAdvBatteryTemperature (deg C)
        outputLoadOid: '1.3.6.1.4.1.318.1.1.1.4.2.3.0',         // upsAdvOutputLoad (%)
        outputVoltageOid: '1.3.6.1.4.1.318.1.1.1.4.2.1.0',      // upsAdvOutputVoltage (VAC)
        inputVoltageOid: '1.3.6.1.4.1.318.1.1.1.3.2.1.0',       // upsAdvInputLineVoltage (VAC)
        inputFrequencyOid: '1.3.6.1.4.1.318.1.1.1.3.2.4.0',     // upsAdvInputFrequency (Hz)
        temperatureOid: '1.3.6.1.4.1.318.1.1.1.2.2.2.0',
        voltageOid: '1.3.6.1.4.1.318.1.1.1.4.2.1.0',

        // Fallback RFC1628 UPS-MIB OIDs
        stdBatteryCapacityOid: '1.3.6.1.2.1.33.1.2.4.0',         // upsEstimatedChargeRemaining (%)
        stdBatteryRuntimeOid: '1.3.6.1.2.1.33.1.2.3.0',          // upsEstimatedMinutesRemaining (Minutes)
        stdBatteryVoltageOid: '1.3.6.1.2.1.33.1.2.5.0',          // upsBatteryVoltage (0.1 VDC)
        stdBatteryTempOid: '1.3.6.1.2.1.33.1.2.7.0',             // upsBatteryTemperature (deg C)
        stdOutputPercentOid: '1.3.6.1.2.1.33.1.4.4.1.5.1',       // upsOutputPercentLoad (%)
        stdOutputVoltageOid: '1.3.6.1.2.1.33.1.4.4.1.2.1',       // upsOutputVoltage (VAC)
        stdInputVoltageOid: '1.3.6.1.2.1.33.1.3.3.1.3.1',        // upsInputVoltage (VAC)
        stdInputFrequencyOid: '1.3.6.1.2.1.33.1.3.3.1.2.1',      // upsInputFrequency (0.1 Hz)

        sysInfoOids: [
            { key: 'model', oid: '1.3.6.1.4.1.318.1.1.1.1.1.1.0' },
            { key: 'serialNumber', oid: '1.3.6.1.4.1.318.1.1.1.1.2.3.0' },
            { key: 'firmware', oid: '1.3.6.1.4.1.318.1.1.1.1.2.1.0' },
            { key: 'batteryStatus', oid: '1.3.6.1.4.1.318.1.1.1.2.1.1.0' },
            { key: 'batteryReplace', oid: '1.3.6.1.4.1.318.1.1.1.2.2.4.0' },
            { key: 'outputStatus', oid: '1.3.6.1.4.1.318.1.1.1.4.1.1.0' },
            { key: 'lastTransferReason', oid: '1.3.6.1.4.1.318.1.1.1.3.2.5.0' },
            // Fallback RFC1628
            { key: 'stdModel', oid: '1.3.6.1.2.1.33.1.1.2.0' },
            { key: 'stdFirmware', oid: '1.3.6.1.2.1.33.1.1.3.0' },
            { key: 'stdBatteryStatus', oid: '1.3.6.1.2.1.33.1.2.1.0' }
        ],
        isUps: true
    },

    // --- APC RACK AUTOMATIC TRANSFER SWITCH (AP4423A / AP44XX ATS) ---
    apc_ats: {
        id: 'apc_ats',
        name: 'Schneider APC Rack ATS (AP4423A)',
        category: 'ats',
        defaultMethod: 'snmp',
        aliases: [
            'ap4423a', 'ap4423', 'ap4421', 'ap4422', 'ap4424', 'ap44xx',
            'apc ats', 'rack ats', 'transfer switch', 'ats'
        ],
        voltageOid: '1.3.6.1.4.1.318.1.1.8.5.4.3.1.4.1.1.1',   // Source A Voltage (0.1 VAC)
        outputLoadOid: '1.3.6.1.4.1.318.1.1.8.5.4.3.1.7.1.1.1', // Output Phase Current (0.1 A)
        sysInfoOids: [
            { key: 'model', oid: '1.3.6.1.4.1.318.1.1.8.1.4.0' },
            { key: 'serialNumber', oid: '1.3.6.1.4.1.318.1.1.8.1.5.0' },
            { key: 'firmware', oid: '1.3.6.1.4.1.318.1.1.8.1.3.0' },
            { key: 'selectedSource', oid: '1.3.6.1.4.1.318.1.1.8.5.1.2.0' },
            { key: 'powerSourceAStatus', oid: '1.3.6.1.4.1.318.1.1.8.5.3.2.1.4.1' },
            { key: 'powerSourceBStatus', oid: '1.3.6.1.4.1.318.1.1.8.5.3.2.1.4.2' },
            { key: 'sourceAVoltage', oid: '1.3.6.1.4.1.318.1.1.8.5.3.2.1.5.1' },
            { key: 'sourceBVoltage', oid: '1.3.6.1.4.1.318.1.1.8.5.3.2.1.5.2' },
            { key: 'redundancyStatus', oid: '1.3.6.1.4.1.318.1.1.8.5.1.3.0' },
            { key: 'outputCurrent', oid: '1.3.6.1.4.1.318.1.1.8.5.4.3.1.7.1.1.1' }
        ],
        isAts: true
    }
};
