const fs = require('fs');
const buf = fs.readFileSync('d:\\DEV\\REACT\\monit\\panasonic_nvr_dump.txt');
const lines = buf.toString('utf8').split('\n');
const prefixes = new Set();
for (let line of lines) {
    if (!line.trim()) continue;
    const parts = line.split('=')[0].trim().split('.');
    if (parts.length > 8) {
        prefixes.add(parts.slice(0, 10).join('.'));
    }
}
console.log(Array.from(prefixes).join('\n'));
