const snmp = require("net-snmp");

const targetIP = "172.17.0.201"; // IP Switch Cisco C9200L

const options = {
    port: 161,
    retries: 2,
    timeout: 5000,
    transport: "udp4",
    version: snmp.Version3
};

const user = {
    name: "admin",
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "B@tokK4l4p4",
    privProtocol: snmp.PrivProtocols.aes,
    privKey: "B@tokK4l4p4"
};

const session = snmp.createV3Session(targetIP, user, options);

// --- OID TABLE & DYNAMIC MIBs ---
const OIDS = {
    BASE: {
        sysDesc: "1.3.6.1.2.1.1.1.0",
        sysName: "1.3.6.1.2.1.1.5.0",
        ifDescr: "1.3.6.1.2.1.2.2.1.2",
        ifStatus: "1.3.6.1.2.1.2.2.1.8"
    },
    CISCO: {
        cpuTable: "1.3.6.1.4.1.9.9.109.1.1.1.1.5",
        memUsed: "1.3.6.1.4.1.9.9.48.1.1.1.5.1",
        memFree: "1.3.6.1.4.1.9.9.48.1.1.1.6.1",
        entSensorValue: "1.3.6.1.4.1.9.9.91.1.1.1.1.4"
    },
    COMWARE: { // HPE 5140
        cpuTable: "1.3.6.1.4.1.25506.2.6.1.1.1.1.6", // hh3cEntityExtCpuUsage
        memUsage: "1.3.6.1.4.1.25506.2.6.1.1.1.1.8", // hh3cEntityExtMemUsage
        entSensorValue: "1.3.6.1.4.1.25506.2.6.1.1.1.1.12" // hh3cEntityExtTemperature
    },
    ARUBA: { // Aruba 6000 / 1930
        cpuTable: "1.3.6.1.2.1.25.3.3.1.2", // hrProcessorLoad
        memUsage: "1.3.6.1.2.1.25.2.3.1.6", // hrStorageUsed (Need calculation with units)
        entSensorValue: "1.3.6.1.2.1.99.1.1.1.4" // entPhySensorValue
    }
};

// --- HELPER UNTUK PROMISE SNMP ---
function getSnmp(session, oids) {
    return new Promise((resolve, reject) => {
        session.get(oids, (error, varbinds) => {
            if (error) reject(error);
            else resolve(varbinds);
        });
    });
}

function subtreeSnmp(session, oid) {
    return new Promise((resolve, reject) => {
        let results = [];
        session.subtree(oid, 48, (row) => {
            row.forEach(vb => {
                if (!snmp.isVarbindError(vb)) results.push(vb);
            });
        }, (error) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
}

async function monitorSwitchDynamic() {
    console.clear();
    console.log(`==================================================`);
    console.log(`   MULTI-VENDOR SWITCH MONITORING                `);
    console.log(`==================================================`);
    console.log(`Target IP Switch : ${targetIP}`);
    console.log(`Waktu Pengecekan : ${new Date().toLocaleString()}\n`);

    try {
        // 1. IDENTIFIKASI VENDOR
        const baseData = await getSnmp(session, [OIDS.BASE.sysDesc, OIDS.BASE.sysName]);
        const sysDesc = baseData[0].value ? baseData[0].value.toString() : "N/A";
        const sysName = baseData[1].value ? baseData[1].value.toString() : "N/A";

        let vendor = "UNKNOWN";
        let vOids = null;
        if (sysDesc.includes("Cisco")) {
            vendor = "CISCO";
            vOids = OIDS.CISCO;
        } else if (sysDesc.includes("Comware") || sysDesc.includes("HPE 5140") || sysDesc.includes("H3C")) {
            vendor = "COMWARE";
            vOids = OIDS.COMWARE;
        } else if (sysDesc.includes("Aruba") || sysDesc.includes("HPE 6000")) {
            vendor = "ARUBA";
            vOids = OIDS.ARUBA;
        } else {
            // Default fallback if not recognized
            vendor = "CISCO";
            vOids = OIDS.CISCO;
        }

        console.log("--------------------------------------------------");
        console.log(" 1. INFORMASI PERANGKAT & IDENTITAS               ");
        console.log("--------------------------------------------------");
        console.log(`Hostname           : ${sysName}`);
        console.log(`Vendor Terdeteksi  : ${vendor}`);
        console.log(`Deskripsi OS       : ${sysDesc.substring(0, 70)}...`);

        console.log("\n--------------------------------------------------");
        console.log(" 2. KESEHATAN HARDWARE & RESOURCING               ");
        console.log("--------------------------------------------------");

        // 2. AMBIL RESOURCE SESUAI VENDOR
        if (vendor === "CISCO") {
            const memData = await getSnmp(session, [vOids.memUsed, vOids.memFree]);
            const memUsedBytes = Number(memData[0].value);
            const memFreeBytes = Number(memData[1].value);
            const totalMem = memUsedBytes + memFreeBytes;
            const memPercent = ((memUsedBytes / totalMem) * 100).toFixed(2);
            console.log(`Penggunaan RAM     : ${memPercent}% (Terpakai: ${(memUsedBytes / 1024 / 1024).toFixed(2)} MB)`);
        } else if (vendor === "COMWARE") {
            const memData = await subtreeSnmp(session, vOids.memUsage);
            let memVal = memData.length > 0 ? memData[0].value : "N/A";
            console.log(`Penggunaan RAM     : ${memVal}% (Berdasarkan Entity Ext)`);
        } else if (vendor === "ARUBA") {
            console.log(`Penggunaan RAM     : (Menggunakan hrStorage - Memerlukan kalkulasi spesifik)`);
        }

        const cpuData = await subtreeSnmp(session, vOids.cpuTable);
        let cpuVal = cpuData.length > 0 ? cpuData[0].value : "N/A";
        console.log(`CPU Usage          : ${cpuVal}${cpuVal !== "N/A" ? "%" : ""}`);

        const sensorData = await subtreeSnmp(session, vOids.entSensorValue);
        if (sensorData.length > 0) {
            sensorData.forEach((s, i) => {
                let idx = s.oid.toString().split('.').pop();
                console.log(`Sensor Hardware [${i + 1}] : ${s.value} (Index: ${idx})`);
            });
        } else {
            console.log(`Sensor Hardware    : Tidak ada data terekspos via SNMP`);
        }

        // 3. STATUS PORT INTERFACE (Standar MIB II - Berlaku Semua)
        console.log("\n--------------------------------------------------");
        console.log(" 3. STATUS PORT INTERFACE                         ");
        console.log("--------------------------------------------------");
        const ifNames = await subtreeSnmp(session, OIDS.BASE.ifDescr);
        const ifStatus = await subtreeSnmp(session, OIDS.BASE.ifStatus);

        let statusMap = {};
        ifStatus.forEach(s => {
            let idx = s.oid.toString().split('.').pop();
            statusMap[idx] = s.value;
        });

        ifNames.forEach(n => {
            let idx = n.oid.toString().split('.').pop();
            let pStatus = statusMap[idx] === 1 ? "🟢 Up (Connected)" : "🔴 Down (Disconnected)";
            console.log(`Port [${n.value.toString().padEnd(15)}] : ${pStatus}`);
        });

        console.log("--------------------------------------------------");
        console.log("Status Koneksi     : 🟢 Pengecekan Selesai");
        console.log("--------------------------------------------------");

    } catch (err) {
        console.error("❌ Terjadi Kesalahan:", err.toString());
    } finally {
        session.close();
    }
}

monitorSwitchDynamic();