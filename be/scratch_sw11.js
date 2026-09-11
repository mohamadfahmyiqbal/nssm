import Network from './src/models/Network.js';
import Asset from './src/models/Asset.js';

const check = async () => {
    try {
        const sw = await Network.findAll({ where: {} });
        
        const mySwitch = sw.find(s => (s.HOSTNAME || '').toLowerCase() === 'sw-11' || (s.PID || '').toLowerCase() === 'sw-11');
        console.log("Switch Data:", mySwitch ? mySwitch.toJSON() : "Not found in Network");

        if (mySwitch) {
            const assetSw = await Asset.findOne({ where: { PID: mySwitch.PID } });
            console.log("Switch Asset Status:", assetSw ? assetSw.STATUS : "No Asset Record");
        }

        console.log("\nDevices under SW-11:");
        const children = sw.filter(s => (s.SWITCH || '').toLowerCase() === 'sw-11' || (mySwitch && s.SWITCH === mySwitch.PID));
        
        for (const child of children) {
            const ast = await Asset.findOne({ where: { PID: child.PID } });
            console.log(`- ${child.HOSTNAME} (${child.PID}) | IP: ${child.IP} | Status: ${ast ? ast.STATUS : 'No Asset'}`);
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
};

check();
