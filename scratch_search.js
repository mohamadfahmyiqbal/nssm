const fs = require('fs');
const txt = fs.readFileSync('d:\\DEV\\REACT\\monit\\panasonic_nvr_dump.txt', 'utf16le');
console.log("Lines with 5100.200:");
console.log(txt.split('\n').filter(l => l.includes('5100.200')).slice(0, 5));
console.log("Lines with 5100:");
console.log(txt.split('\n').filter(l => l.includes('5100')).slice(0, 5));
