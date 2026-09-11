import cron from 'node-cron';
import PQueue from 'p-queue';
import { checkPing } from './services/pingService.js';
import { checkSnmp, fetchNvrData, getSwitchPortStatus } from './services/snmpV3Service.js';
import fetch from 'node-fetch'; // assuming node-fetch is available, or use native fetch if Node 18+

// Config Agent
const CENTRAL_SERVER_URL = process.env.CENTRAL_SERVER_URL || 'http://localhost:5000';
const AGENT_API_KEY = process.env.AGENT_API_KEY || 'default_secret_key';
const AGENT_ID = process.env.AGENT_ID || 'AGENT_001';

const trafficCounterMap = new Map();

const pingQueue = new PQueue({ concurrency: 5 });

const fetchTasks = async () => {
    try {
        const response = await fetch(`${CENTRAL_SERVER_URL}/api/agent/tasks?agent_id=${AGENT_ID}`, {
            headers: { 'x-agent-key': AGENT_API_KEY }
        });
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        return await response.json();
    } catch (err) {
        console.error('❌ [Agent] Gagal mengambil task dari server:', err.message);
        return null;
    }
};

const submitResults = async (results) => {
    try {
        const response = await fetch(`${CENTRAL_SERVER_URL}/api/agent/results`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-agent-key': AGENT_API_KEY 
            },
            body: JSON.stringify({ results })
        });
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        console.log(`✅ [Agent] Berhasil mengirim ${results.length} hasil ke server.`);
    } catch (err) {
        console.error('❌ [Agent] Gagal mengirim hasil ke server:', err.message);
    }
};

const processPolling = async () => {
    console.log(`\n⏳ [Agent ${AGENT_ID}] Memulai siklus polling...`);
    const data = await fetchTasks();
    if (!data || !data.tasks || data.tasks.length === 0) {
        console.log('ℹ️ [Agent] Tidak ada perangkat untuk di-poll.');
        return;
    }

    const { tasks: validDevices, credentials, pollingOverrides } = data;
    const results = [];

    const queueTasks = validDevices.map((dev) =>
        pingQueue.add(async () => {
            const jitter = Math.floor(Math.random() * (500 - 100 + 1) + 100);
            await new Promise((res) => setTimeout(res, jitter));

            const hostLower = (dev.HOSTNAME || '').toLowerCase();
            const isCctv = hostLower.includes('nvr');
            const isSwitch = hostLower.startsWith('sw') || hostLower.includes('switch');
            
            const methodOverride = pollingOverrides[dev.IP] || pollingOverrides[dev.PID];
            const finalMethod = methodOverride ? methodOverride : (isCctv ? 'snmp' : 'tcp');

            let pingResult;
            let nvrData = null;
            let switchDataPayload = null;

            try {
                if (isSwitch) {
                    const switchRawData = await getSwitchPortStatus(dev.IP, credentials[dev.IP]);
                    if (switchRawData && switchRawData.isAlive) {
                        const now = Date.now();
                        if (!trafficCounterMap.has(dev.IP)) trafficCounterMap.set(dev.IP, {});
                        const deviceCounters = trafficCounterMap.get(dev.IP);

                        for (const [portName, portStatus] of Object.entries(switchRawData.ports)) {
                            let inBps = 0, outBps = 0;
                            if (portStatus.rawIn !== null && portStatus.rawOut !== null) {
                                if (deviceCounters[portName]) {
                                    const last = deviceCounters[portName];
                                    const timeDiffSec = (now - last.time) / 1000;
                                    if (timeDiffSec > 0) {
                                        let inDiff = portStatus.rawIn - last.inOctets;
                                        if (inDiff < 0n) inDiff += 18446744073709551616n;
                                        inBps = Number((inDiff * 8n) / BigInt(Math.floor(timeDiffSec)));

                                        let outDiff = portStatus.rawOut - last.outOctets;
                                        if (outDiff < 0n) outDiff += 18446744073709551616n;
                                        outBps = Number((outDiff * 8n) / BigInt(Math.floor(timeDiffSec)));
                                    }
                                }
                                deviceCounters[portName] = { inOctets: portStatus.rawIn, outOctets: portStatus.rawOut, time: now };
                            }
                            portStatus.inBps = inBps;
                            portStatus.outBps = outBps;
                        }
                        switchDataPayload = switchRawData;
                    }
                }
                if (finalMethod === 'snmp') {
                    pingResult = await checkSnmp(dev.IP, credentials[dev.IP]);
                    if (pingResult.isAlive && hostLower.includes('nvr')) {
                        nvrData = await fetchNvrData(dev.IP, credentials[dev.IP]);
                    }
                } else if (finalMethod === 'icmp') {
                    pingResult = await checkPing(dev.IP, 80, 2000, 'icmp');
                } else {
                    pingResult = await checkPing(dev.IP, 80, 2000, 'tcp');
                }
            } catch (err) {
                pingResult = { isAlive: false, ms: 0 };
            }

            results.push({
                PID: dev.PID,
                HOSTNAME: dev.HOSTNAME,
                IP: dev.IP,
                newStatus: pingResult.isAlive ? 'UP' : 'DOWN',
                finalMethod,
                latency: pingResult.ms,
                nvrData,
                switchData: switchDataPayload
            });
        })
    );

    await Promise.all(queueTasks);
    await submitResults(results);
};

// Inisialisasi
console.log(`🚀 [Agent] Distributed Polling Agent berjalan. Mendaftarkan Cron...`);
cron.schedule('* * * * *', async () => {
    await processPolling();
});

// Eksekusi langsung 1x saat start
processPolling();
