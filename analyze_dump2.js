const fs = require('fs');
const buf = fs.readFileSync('d:\\DEV\\REACT\\monit\\panasonic_nvr_dump.txt');
const lines = buf.toString('utf8').split('\n');
const res = lines.filter(l => l.startsWith('1.3.6.1.4.1.258.5100.200.1.16'));
if (res.length === 0) {
    const res2 = lines.filter(l => l.startsWith('1.3.6.1.4.1.258.5100.200.1.'));
    console.log(res2.slice(0, 10).join('\n'));
} else {
    console.log(res.join('\n'));
}
