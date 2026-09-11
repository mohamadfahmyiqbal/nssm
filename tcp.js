const net = require('net');

const targetIP = "172.17.20.131";
const targetPort = 554; // Ubah ke port yang ingin dicek (misal: 80 untuk HTTP, 554 untuk RTSP)
const timeoutMs = 3000;

function checkTcpConnection(ip, port, timeout) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let status = false;

        socket.setTimeout(timeout);

        socket.on('connect', () => {
            status = true;
            socket.destroy();
            resolve({ success: true, message: `Port ${port} terbuka (Connected)` });
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve({ success: false, message: "Koneksi TCP Timeout" });
        });

        socket.on('error', (err) => {
            resolve({ success: false, message: `Gagal: ${err.message}` });
        });

        socket.connect(port, ip);
    });
}

async function runTcpCheck() {
    console.log(`Mulai melakukan pengecekan TCP ke ${targetIP}:${targetPort}...`);
    const result = await checkTcpConnection(targetIP, targetPort, timeoutMs);
    console.log(`Hasil:`, result);
}

runTcpCheck();