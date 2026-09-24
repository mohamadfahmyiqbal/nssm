const net = require('net');

const targetIP = "172.17.20.141";
const timeoutMs = 3000;

function checkSocketConnection(ip, port = 80, timeout = 3000) {
    return new Promise((resolve) => {
        const start = Date.now();
        const socket = new net.Socket();

        socket.setTimeout(timeout);

        socket.on('connect', () => {
            const ms = Date.now() - start;
            socket.destroy();
            resolve({
                success: true,
                message: `Host ${ip}:${port} aktif (Alive)`,
                latency: ms
            });
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve({
                success: false,
                message: `Host ${ip}:${port} timeout (${timeout}ms)`
            });
        });

        socket.on('error', (err) => {
            socket.destroy();
            resolve({
                success: false,
                message: `Host ${ip}:${port} tidak dapat dijangkau (${err.message})`
            });
        });

        socket.connect(port, ip);
    });
}

async function runCheck() {
    console.log(`Mulai pengecekan koneksi (Socket Safe) ke ${targetIP}...`);
    const result = await checkSocketConnection(targetIP, 80, timeoutMs);
    console.log(`Hasil:`, result);
}

runCheck();

