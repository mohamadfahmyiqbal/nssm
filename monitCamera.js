const snmp = require("net-snmp");

const targetIP = "172.17.101.75"; // Ganti IP sesuai IP Kamera pengujian

const options = {
    port: 161,
    retries: 2,
    timeout: 5000,
    transport: "udp4",
    version: snmp.Version3
};

// Sesuaikan credential dengan pengaturan SNMP pada Kamera
const user = {
    name: "admin",
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "B@tokK4l4p4",
    privProtocol: snmp.PrivProtocols.aes,
    privKey: "B@tokK4l4p4"
};

// MIB-2 Standar OID yang didukung mayoritas IP Camera
const OID_SYS_INFO = [
    "1.3.6.1.2.1.1.1.0", // System Description
    "1.3.6.1.2.1.1.3.0", // System Uptime
    "1.3.6.1.2.1.1.5.0", // System Name
    "1.3.6.1.2.1.1.6.0"  // System Location
];

function fetchCameraData() {
    const session = snmp.createV3Session(targetIP, user, options);

    session.on('error', (err) => {
        console.error("❌ [SNMP Internal Error]:", err.message);
    });

    console.clear();
    console.log(`==================================================`);
    console.log(`       IP CAMERA - MONITORING SNMP (SNMP v3)      `);
    console.log(`==================================================`);
    console.log(`Target IP Kamera: ${targetIP}`);
    console.log(`Waktu Pengecekan: ${new Date().toLocaleTimeString()}\n`);

    session.get(OID_SYS_INFO, function (error, varbinds) {
        if (error) {
            console.error("❌ Gagal Mengambil Data Kamera:", error.toString());
            session.close();
            return;
        }

        const sysDesc = (varbinds[0] && !snmp.isVarbindError(varbinds[0])) ? varbinds[0].value.toString() : "N/A";

        let uptimeFormatted = "N/A";
        if (varbinds[1] && !snmp.isVarbindError(varbinds[1])) {
            const uptimeTicks = varbinds[1].value;
            const uptimeSeconds = Math.floor(uptimeTicks / 100);
            const days = Math.floor(uptimeSeconds / (3600 * 24));
            const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            uptimeFormatted = `${days}d ${hours}h ${minutes}m`;
        }

        const sysName = (varbinds[2] && !snmp.isVarbindError(varbinds[2])) ? varbinds[2].value.toString() : "N/A";
        const sysLocation = (varbinds[3] && !snmp.isVarbindError(varbinds[3])) ? varbinds[3].value.toString() : "N/A";

        console.log("--------------------------------------------------");
        console.log("             INFORMASI UMUM KAMERA                ");
        console.log("--------------------------------------------------");
        console.log(`System Description : ${sysDesc}`);
        console.log(`System Hostname    : ${sysName}`);
        console.log(`System Location    : ${sysLocation}`);
        console.log(`System Uptime      : ${uptimeFormatted}`);

        console.log("--------------------------------------------------");
        console.log("Status Koneksi     : 🟢 Terhubung (SNMP Berhasil)");
        console.log("--------------------------------------------------");

        session.close();
    });
}

// Jalankan pertama kali
fetchCameraData();

// Polling interval setiap 10 detik
setInterval(fetchCameraData, 10000);
