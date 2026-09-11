const snmp = require("net-snmp");

const targetIP = "172.17.101.3";

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

session.get(["1.3.6.1.2.1.1.2.0", "1.3.6.1.2.1.1.1.0"], function (error, varbinds) {
    if (error) {
        console.error(error);
    } else {
        varbinds.forEach(vb => {
            console.log(vb.oid + " = " + vb.value);
        });
    }
    session.close();
});
