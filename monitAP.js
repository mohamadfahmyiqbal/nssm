const snmp = require("net-snmp");

const targetIP = "172.17.225.5"; // IP UniFi Access Point (contoh: PIK1ACP001)

const options = {
    port: 161,
    retries: 2,
    timeout: 5000,
    transport: "udp4",
    version: snmp.Version3
};

// Sesuaikan user, level, auth, dan priv dengan setting SNMPv3 di UniFi Controller Anda
const user = {
    name: "admin",
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "B@tokK4l4p4",
    privProtocol: snmp.PrivProtocols.aes,
    privKey: "B@tokK4l4p4"
};

const session = snmp.createV3Session(targetIP, user, options);

// --- OID UNTUK UNIFA ACCESS POINT (MIB-II & Host Resources) ---
const OIDS = {
    BASE: {
        sysDesc: "1.3.6.1.2.1.1.1.0",        // Deskripsi Sistem / Firmware
        sysName: "1.3.6.1.2.1.1.5.0",        // Hostname AP
        sysUpTime: "1.3.6.1.2.1.1.3.0",      // Uptime perangkat
        ifDescr: "1.3.6.1.2.1.2.2.1.2",      // Nama Interface (ethernet, wifi)
        ifStatus: "1.3.6.1.2.1.2.2.1.8",     // Status Up/Down Interface
        ifInOctets: "1.3.6.1.2.1.2.2.1.10",  // Bytes Masuk (RX)
        ifOutOctets: "1.3.6.1.2.1.2.2.1.16" // Bytes Keluar (TX)
    },
    // Host Resources MIB (Biasanya dipakai AP berbasis Linux/BusyBox untuk RAM & CPU)
    HOST: {
        hrProcessorLoad: "1.3.6.1.2.1.25.3.3.1.2", // Penggunaan CPU per Core
        hrStorageDescr: "1.3.6.1.2.1.25.2.3.1.2",  // Deskripsi Storage/RAM
        hrStorageAllocationUnits: "1.3.6.1.2.1.25.2.3.1.4",
        hrStorageSize: "1.3.6.1.2.1.25.2.3.1.5",
        hrStorageUsed: "1.3.6.1.2.1.25.2.3.1.6"
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

async function monitorUniFiAP() {
    console.clear();
    console.log(`==================================================`);
    console.log(`    UNIFI ACCESS POINT SNMP MONITORING            `);
    console.log(`==================================================`);
    console.log(`Target IP AP     : ${targetIP}`);
    console.log(`Waktu Pengecekan : ${new Date().toLocaleString()}\n`);

    try {
        // 1. INFORMASI DASAR & SYSTEM
        const baseData = await getSnmp(session, [
            OIDS.BASE.sysDesc,
            OIDS.BASE.sysName,
            OIDS.BASE.sysUpTime
        ]);

        const sysDesc = baseData[0].value ? baseData[0].value.toString() : "N/A";
        const sysName = baseData[1].value ? baseData[1].value.toString() : "N/A";
        const uptimeTicks = baseData[2].value ? Number(baseData[2].value) : 0;

        // Konversi timeticks ke format jam/hari
        const uptimeSeconds = Math.floor(uptimeTicks / 100);
        const days = Math.floor(uptimeSeconds / (3600 * 24));
        const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);

        console.log("--------------------------------------------------");
        console.log(" 1. INFORMASI PERANGKAT & IDENTITAS               ");
        console.log("--------------------------------------------------");
        console.log(`Hostname AP        : ${sysName}`);
        console.log(`Uptime             : ${days} hari, ${hours} jam, ${minutes} menit`);
        console.log(`Deskripsi Firmware : ${sysDesc.substring(0, 70)}...`);

        console.log("\n--------------------------------------------------");
        console.log(" 2. KESEHATAN HARDWARE (RESOURCE)                ");
        console.log("--------------------------------------------------");

        // CPU Usage via Host Resources MIB
        try {
            const cpuData = await subtreeSnmp(session, OIDS.HOST.hrProcessorLoad);
            if (cpuData.length > 0) {
                let totalLoad = 0;
                cpuData.forEach((cpu, idx) => {
                    console.log(`CPU Core [${idx + 1}]      : ${cpu.value}%`);
                    totalLoad += Number(cpu.value);
                });
                if (cpuData.length > 1) {
                    console.log(`Rata-rata CPU      : ${(totalLoad / cpuData.length).toFixed(2)}%`);
                }
            } else {
                console.log(`CPU Usage          : Tidak tersedia via SNMP`);
            }
        } catch (e) {
            console.log(`CPU Usage          : Gagal mengambil data (${e.message})`);
        }

        // Memory / Storage Usage via Host Resources MIB
        try {
            const storDescr = await subtreeSnmp(session, OIDS.HOST.hrStorageDescr);
            const storAlloc = await subtreeSnmp(session, OIDS.HOST.hrStorageAllocationUnits);
            const storSize = await subtreeSnmp(session, OIDS.HOST.hrStorageSize);
            const storUsed = await subtreeSnmp(session, OIDS.HOST.hrStorageUsed);

            // Cari storage yang merepresentasikan RAM fisik (biasanya mengandung kata "Physical Memory" atau "Memory")
            let foundMem = false;
            for (let i = 0; i < storDescr.length; i++) {
                let desc = storDescr[i].value.toString();
                if (desc.toLowerCase().includes("memory") || desc.toLowerCase().includes("ram")) {
                    let idx = storDescr[i].oid.toString().split('.').pop();

                    // Cari unit, size, dan used berdasarkan index yang sama
                    let allocUnit = Number(storAlloc.find(x => x.oid.toString().split('.').pop() === idx)?.value || 1);
                    let totalUnits = Number(storSize.find(x => x.oid.toString().split('.').pop() === idx)?.value || 0);
                    let usedUnits = Number(storUsed.find(x => x.oid.toString().split('.').pop() === idx)?.value || 0);

                    let totalBytes = totalUnits * allocUnit;
                    let usedBytes = usedUnits * allocUnit;
                    let memPercent = totalBytes > 0 ? ((usedBytes / totalBytes) * 100).toFixed(2) : 0;

                    console.log(`Penggunaan RAM     : ${memPercent}% (Terpakai: ${(usedBytes / 1024 / 1024).toFixed(2)} MB dari ${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
                    foundMem = true;
                    break;
                }
            }
            if (!foundMem) {
                console.log(`Penggunaan RAM     : Data memori spesifik tidak ditemukan`);
            }
        } catch (e) {
            console.log(`Penggunaan RAM     : Gagal mengambil data (${e.message})`);
        }

        // 3. STATUS PORT INTERFACE & TRAFFIC
        console.log("\n--------------------------------------------------");
        console.log(" 3. STATUS INTERFACE & TRAFFIC (LAN / WLAN)       ");
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
            console.log(`Interface [${n.value.toString().padEnd(12)}] : ${pStatus}`);
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

monitorUniFiAP();