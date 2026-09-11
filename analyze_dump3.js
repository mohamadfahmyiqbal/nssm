const fs = require('fs');
const buf = fs.readFileSync('d:\\DEV\\REACT\\monit\\panasonic_nvr_dump.txt');
const lines = buf.toString('utf8').split('\n');
console.log("HDD lines:");
console.log(lines.filter(l => l.includes('.200.1.13')).slice(0, 10).join('\n'));
console.log("\nCam lines:");
console.log(lines.filter(l => l.includes('.200.1.15')).slice(0, 10).join('\n'));
