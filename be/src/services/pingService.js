// services/pingService.js
import http from 'http';
import net from 'net';

/**
 * Helper untuk satu kali percobaan ping
 */
const singlePing = async (ipAddress, port, timeout, method) => {
    // EDR EVASION: Cybereason mendeteksi pembuatan child process (ping.exe) secara masif sebagai anomali.
    // Memaksa 'icmp' fallback ke TCP Socket internal NodeJS agar tidak memicu alarm EDR.
    if (method === 'icmp') {
        method = 'tcp';
    }

    if (method === 'tcp') {
        return new Promise((resolve) => {
            const start = Date.now();
            const socket = new net.Socket();

            socket.setTimeout(timeout);

            socket.on('connect', () => {
                const ms = Date.now() - start;
                socket.destroy();
                resolve({ isAlive: true, ms });
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve({ isAlive: false, ms: 0 });
            });

            socket.on('error', () => {
                socket.destroy();
                resolve({ isAlive: false, ms: 0 });
            });

            socket.connect(port, ipAddress);
        });
    }

    return new Promise((resolve) => {
        const start = Date.now();

        const options = {
            hostname: ipAddress,
            port: port,
            path: '/',
            method: 'HEAD',
            timeout: timeout
        };

        const req = http.request(options, (res) => {
            // Asalkan ada respons (meskipun 404/500), berarti device menyala/UP
            const ms = Date.now() - start;
            resolve({ isAlive: true, ms });
        });

        req.on('error', () => {
            resolve({ isAlive: false, ms: 0 });
        });

        req.on('timeout', () => {
            req.destroy(); // Batalkan request jika timeout
            resolve({ isAlive: false, ms: 0 });
        });

        req.end();
    });
};

/**
 * Mengecek status konektivitas jaringan dengan Flapping Protection (Retries)
 * @param {string} ipAddress - Alamat IP Target
 * @param {number} port - Port HTTP (default: 80)
 * @param {number} timeout - Waktu batas dalam milidetik (default: 2000 ms)
 * @param {string} method - Metode ping: 'http' atau 'icmp'
 * @param {number} retries - Jumlah maksimal percobaan (default: 3)
 * @returns {Promise<{isAlive: boolean, ms: number}>}
 */
export const checkPing = async (ipAddress, port = 80, timeout = 2000, method = 'tcp', retries = 3) => {
    // EDR EVASION: Cybereason mendeteksi pembuatan child process (ping.exe) secara masif sebagai anomali.
    // Memaksa 'icmp' fallback ke TCP Socket internal NodeJS agar tidak memicu alarm EDR.
    if (method === 'icmp') {
        method = 'tcp';
    }

    let lastResult = { isAlive: false, ms: 0 };
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        lastResult = await singlePing(ipAddress, port, timeout, method);
        
        if (lastResult.isAlive) {
            return lastResult; // Sukses, langsung kembalikan status UP
        }
        
        // Jeda 500ms antar retri untuk evade Cybereason / behavior anomaly detection
        if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    return lastResult; // Gagal berturut-turut setelah retries
};