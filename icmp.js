const { exec } = require('child_process');

const targetIP = "172.17.20.141";
const timeoutMs = 3000;

function checkIcmpConnection(ip, timeout) {
    return new Promise((resolve) => {
        const isWin = process.platform === 'win32';
        const cmd = isWin
            ? `ping -n 1 -w ${timeout} ${ip}`
            : `ping -c 1 -W ${Math.ceil(timeout / 1000)} ${ip}`;

        exec(cmd, (error, stdout) => {
            if (error) {
                return resolve({
                    success: false,
                    message: "Host tidak merespons (Request timed out / Unreachable)",
                    output: stdout.trim()
                });
            }

            const isSuccess = isWin
                ? (stdout.includes("TTL=") || stdout.includes("ttl=")) && !stdout.includes("Destination host unreachable")
                : stdout.includes("1 received") || stdout.includes("1 packets received");

            if (isSuccess) {
                resolve({
                    success: true,
                    message: `Host ${ip} hidup (Alive)`,
                    output: stdout.trim()
                });
            } else {
                resolve({
                    success: false,
                    message: "Host tidak merespons (Ping failed)",
                    output: stdout.trim()
                });
            }
        });
    });
}

async function runIcmpCheck() {
    console.log(`Mulai melakukan pengecekan ICMP (Ping) ke ${targetIP}...`);
    const result = await checkIcmpConnection(targetIP, timeoutMs);
    console.log(`Hasil:`, result);
}

runIcmpCheck();
