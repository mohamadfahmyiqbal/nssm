const snmp = require('net-snmp');

const getCamerasFromNvr = (ip) => {
    return new Promise((resolve) => {
        let cred = { username: 'admin', authProtocol: 'sha', authKey: 'B@tokK4l4p4', privProtocol: 'aes', privKey: 'B@tokK4l4p4' };
        const options = { port: 161, retries: 1, timeout: 3000, transport: 'udp4', version: snmp.Version3 };
        const user = {
            name: cred.username, level: snmp.SecurityLevel.authPriv,
            authProtocol: snmp.AuthProtocols[cred.authProtocol], authKey: cred.authKey,
            privProtocol: snmp.PrivProtocols[cred.privProtocol], privKey: cred.privKey
        };
        const session = snmp.createV3Session(ip, user, options);
        session.on('error', (err) => { console.error("SNMP Error", err); session.close(); resolve([]); });

        let cameraData = {};
        session.subtree("1.3.6.1.4.1.57501.200.1.15", 300, (camVarbinds) => {
            for (let i = 0; i < camVarbinds.length; i++) {
                if (!snmp.isVarbindError(camVarbinds[i])) {
                    let oidStr = camVarbinds[i].oid.toString();
                    let valStr = camVarbinds[i].value ? camVarbinds[i].value.toString() : "";
                    console.log(`OID: ${oidStr} | Value: ${valStr}`);
                }
            }
        }, () => {
            session.close();
            resolve();
        });
    });
};

getCamerasFromNvr("172.17.101.3").then(() => console.log("Done"));
