const snmp = require("net-snmp");

const targetIP = "172.17.101.102"; // Ganti IP sesuai target pengujian

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

// OID untuk mengambil System Description, System Name, & Panasonic Enterprise Model
const OID_SYS_DESC = ["1.3.6.1.2.1.1.1.0", "1.3.6.1.2.1.1.5.0", "1.3.6.1.4.1.258.1.1.1.0"];

function fetchWjNd400Data() {
    const session = snmp.createV3Session(targetIP, user, options);

    session.on('error', (err) => {
        console.error("❌ [SNMP Internal Error]:", err.message);
    });
    
    console.clear();
    console.log(`==================================================`);
    console.log(` PANASONIC WJ-ND400 - MONITORING SNMP (SNMP v3)  `);
    console.log(`==================================================`);
    console.log(`Target IP NVR   : ${targetIP}`);
    console.log(`Waktu Pengecekan: ${new Date().toLocaleTimeString()}\n`);

    session.get(OID_SYS_DESC, function (error, varbinds) {
        if (error) {
            console.error("❌ Gagal Mengambil Data Awal NVR:", error.toString());
            session.close();
            return;
        }

        let sysDesc = varbinds[0].value ? varbinds[0].value.toString() : "";
        let sysName = varbinds[1].value ? varbinds[1].value.toString() : "";
        let deviceModel = varbinds[2].value ? varbinds[2].value.toString() : "";

        console.log("--------------------------------------------------");
        console.log("             INFORMASI UMUM PERANGKAT             ");
        console.log("--------------------------------------------------");
        console.log(`System Description        : ${sysDesc}`);
        console.log(`System Hostname           : ${sysName}`);
        console.log(`Device Model (Enterprise) : ${deviceModel || "N/A"}`);

        let hddOidSubtree = "";
        let camOidSubtree = "";
        let tempOid = "";
        let maxCamChannels = 64; // Default limit channel WJ-ND400

        // PEMISAHAN OID BERDASARKAN HASIL DETEKSI MODEL (WJ-ND400 vs Seri Lain)
        if (sysDesc.includes("ND400") || deviceModel.includes("ND400")) {
            console.log(`Deteksi Model             : Terdeteksi Seri WJ-ND400`);
            // Set OID khusus untuk Seri WJ-ND400 berdasarkan spesifikasi MIB
            hddOidSubtree = "1.3.6.1.4.1.258.5100.200.1.13";
            camOidSubtree = "1.3.6.1.4.1.258.5100.200.1.15";
            tempOid = "1.3.6.1.4.1.258.5100.200.1.16.0";
            maxCamChannels = 64;
        } else {
            console.log(`Deteksi Model             : Seri Lain / Default (WJ-ND400 Fallback)`);
            // Fallback OID ke WJ-ND400
            hddOidSubtree = "1.3.6.1.4.1.258.5100.200.1.13";
            camOidSubtree = "1.3.6.1.4.1.258.5100.200.1.15";
            tempOid = "1.3.6.1.4.1.258.5100.200.1.16.0";
            maxCamChannels = 64;
        }

        // Ambil data temperatur berdasarkan OID perangkat
        session.get([tempOid], function (tempErr, tempVarbinds) {
            let temperature = "N/A";
            if (!tempErr && tempVarbinds[0] && !snmp.isVarbindError(tempVarbinds[0])) {
                temperature = tempVarbinds[0].value.toString();
            }
            console.log(`Temperature (°C)          : ${temperature}`);

            // Proses Pengambilan Status Hard Disk (HDD) - Mendukung hingga 62 slot
            console.log("--------------------------------------------------");
            console.log("             STATUS HARD DISK (HDD)               ");
            console.log("--------------------------------------------------");

            let hddData = [];
            session.subtree(hddOidSubtree, 62, function (row) {
                row.forEach(vb => {
                    if (!snmp.isVarbindError(vb)) {
                        hddData.push(vb.value.toString());
                    }
                });
            }, function (err) {
                if (err || hddData.length === 0) {
                    console.log("Status HDD                : Tidak ada data / Slot kosong");
                } else {
                    hddData.forEach((valHdd, idx) => {
                        console.log(`HDD Slot [${idx + 1}]                 : ${valHdd}`);
                    });
                }

                // Proses Pengambilan Status Koneksi Kamera
                console.log("--------------------------------------------------");
                console.log("       STATUS KONEKSI & IP ADDRESS KAMERA         ");
                console.log("--------------------------------------------------");

                let camData = [];
                session.subtree(camOidSubtree, maxCamChannels, function (row) {
                    row.forEach(vb => {
                        if (!snmp.isVarbindError(vb)) {
                            camData.push(vb.value.toString());
                        }
                    });
                }, function (walkErr) {
                    if (camData.length === 0) {
                        console.log("Kamera                    : Tidak ada data kamera terdeteksi");
                    } else {
                        camData.forEach((rawVal, index) => {
                            let camStatus = rawVal === "0" ? "🟢 Connected" : "🔴 Disconnected";
                            let camIdx = String(index + 1).padStart(3, '0');
                            console.log(`Kamera [${camIdx}]          : ${camStatus}`);
                        });
                    }

                    console.log("--------------------------------------------------");
                    console.log("Status Koneksi        : 🟢 SELESAI (Pengecekan Selesai)");
                    console.log("--------------------------------------------------");

                    session.close();
                });
            });
        });
    });
}
// Jalankan pertama kali
fetchWjNd400Data();

// Polling setiap 10 detik
setInterval(fetchWjNd400Data, 10000);