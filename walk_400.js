const snmp = require("net-snmp");
const fs = require("fs");

const targetIP = "172.17.101.2";

const options = {
    port: 161,
    retries: 1,
    timeout: 3000,
    transport: "udp4",
    version: snmp.Version3
};

const user = {
    name: "admin",
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "B@tokK4l4p4",
    privProtocol: snmp.PrivProtocols.aes,
    privKey: "B@tokK4l4p4"
};

const session = snmp.createV3Session(targetIP, user, options);
const oid = "1.3.6.1.4.1.258";
let output = "";

session.subtree(oid, 100, function (varbinds) {
    for (let i = 0; i < varbinds.length; i++) {
        if (!snmp.isVarbindError(varbinds[i])) {
            let valStr = varbinds[i].value ? varbinds[i].value.toString() : "";
            output += `${varbinds[i].oid} = ${valStr}\n`;
        }
    }
}, function (error) {
    if (error) console.error(error);
    fs.writeFileSync("panasonic_nvr_dump.txt", output);
    console.log("Dump saved to panasonic_nvr_dump.txt");
    session.close();
});
