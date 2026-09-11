import { sendTeamsAlert } from './src/services/teamsService.js';
import dotenv from 'dotenv';

dotenv.config();

const testDevice = {
    HOSTNAME: 'TEST-SWITCH-01',
    IP: '192.168.100.99',
    PID: 'PID-TEST-1234'
};

const time = new Date().toLocaleString();

console.log('--- Memulai Test Alert Teams ---');

async function runTest() {
    console.log('>> Mengirim notifikasi ke Teams...');
    await sendTeamsAlert(testDevice, time);
    
    console.log('\n--- Test Selesai ---');
}

runTest();
