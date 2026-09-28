import SnmpProfile from '../models/SnmpProfile.js';
import SnmpProfileOid from '../models/SnmpProfileOid.js';
import snmp from 'net-snmp';

// ==================== PROFILES CONTROLLER ====================

export const getAllProfiles = async (req, res) => {
    try {
        const profiles = await SnmpProfile.findAll({
            include: [{ model: SnmpProfileOid, as: 'oids' }],
            order: [['name', 'ASC']]
        });
        res.json({ success: true, data: profiles });
    } catch (error) {
        console.error('Error fetching SNMP profiles:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const getProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        const profile = await SnmpProfile.findByPk(id, {
            include: [{ model: SnmpProfileOid, as: 'oids' }]
        });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        res.json({ success: true, data: profile });
    } catch (error) {
        console.error('Error fetching SNMP profile by ID:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const createProfile = async (req, res) => {
    try {
        const { name, vendor, sysoid_pattern, description } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Profile name is required' });
        }
        const profile = await SnmpProfile.create({
            name,
            vendor,
            sysoid_pattern,
            description,
            created_at: new Date(),
            updated_at: new Date()
        });
        res.status(201).json({ success: true, data: profile, message: 'Profile created successfully' });
    } catch (error) {
        console.error('Error creating SNMP profile:', error);
        res.status(500).json({ success: false, message: 'Failed to create profile', error: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, vendor, sysoid_pattern, description } = req.body;
        const profile = await SnmpProfile.findByPk(id);
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        await profile.update({
            name: name ?? profile.name,
            vendor: vendor ?? profile.vendor,
            sysoid_pattern: sysoid_pattern ?? profile.sysoid_pattern,
            description: description ?? profile.description,
            updated_at: new Date()
        });
        res.json({ success: true, data: profile, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating SNMP profile:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
    }
};

export const deleteProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const profile = await SnmpProfile.findByPk(id);
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        await profile.destroy();
        res.json({ success: true, message: 'Profile and associated OIDs deleted successfully' });
    } catch (error) {
        console.error('Error deleting SNMP profile:', error);
        res.status(500).json({ success: false, message: 'Failed to delete profile', error: error.message });
    }
};

// ==================== OID METRICS CONTROLLER ====================

export const addOidToProfile = async (req, res) => {
    try {
        const { profile_id } = req.params;
        const { metric_key, label, mib_name, object_name, oid, oid_type, value_type, unit, formula, is_active } = req.body;

        if (!metric_key || !label || !oid) {
            return res.status(400).json({ success: false, message: 'metric_key, label, and oid are required' });
        }

        const profile = await SnmpProfile.findByPk(profile_id);
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        const newOid = await SnmpProfileOid.create({
            profile_id: Number(profile_id),
            metric_key,
            label,
            mib_name: mib_name || null,
            object_name: object_name || null,
            oid: oid.trim(),
            oid_type: oid_type || 'scalar',
            value_type: value_type || 'gauge',
            unit: unit || null,
            formula: formula || null,
            is_active: is_active !== undefined ? is_active : true,
            created_at: new Date(),
            updated_at: new Date()
        });

        res.status(201).json({ success: true, data: newOid, message: 'OID added successfully' });
    } catch (error) {
        console.error('Error adding OID to profile:', error);
        res.status(500).json({ success: false, message: 'Failed to add OID', error: error.message });
    }
};

export const updateOid = async (req, res) => {
    try {
        const { id } = req.params;
        const { metric_key, label, mib_name, object_name, oid, oid_type, value_type, unit, formula, is_active } = req.body;

        const oidRecord = await SnmpProfileOid.findByPk(id);
        if (!oidRecord) {
            return res.status(404).json({ success: false, message: 'OID not found' });
        }

        await oidRecord.update({
            metric_key: metric_key ?? oidRecord.metric_key,
            label: label ?? oidRecord.label,
            mib_name: mib_name !== undefined ? mib_name : oidRecord.mib_name,
            object_name: object_name !== undefined ? object_name : oidRecord.object_name,
            oid: oid ? oid.trim() : oidRecord.oid,
            oid_type: oid_type ?? oidRecord.oid_type,
            value_type: value_type ?? oidRecord.value_type,
            unit: unit !== undefined ? unit : oidRecord.unit,
            formula: formula !== undefined ? formula : oidRecord.formula,
            is_active: is_active !== undefined ? is_active : oidRecord.is_active,
            updated_at: new Date()
        });

        res.json({ success: true, data: oidRecord, message: 'OID updated successfully' });
    } catch (error) {
        console.error('Error updating OID:', error);
        res.status(500).json({ success: false, message: 'Failed to update OID', error: error.message });
    }
};

export const deleteOid = async (req, res) => {
    try {
        const { id } = req.params;
        const oidRecord = await SnmpProfileOid.findByPk(id);
        if (!oidRecord) {
            return res.status(404).json({ success: false, message: 'OID not found' });
        }
        await oidRecord.destroy();
        res.json({ success: true, message: 'OID deleted successfully' });
    } catch (error) {
        console.error('Error deleting OID:', error);
        res.status(500).json({ success: false, message: 'Failed to delete OID', error: error.message });
    }
};

// ==================== TEST LIVE OID QUERY ====================

export const testLiveOid = async (req, res) => {
    try {
        const {
            ip,
            port = 161,
            version = 'v2c',
            community = 'public',
            user = 'admin',
            authProto = 'sha',
            authKey = '',
            privProto = 'aes',
            privKey = '',
            oid
        } = req.body;

        if (!ip || !oid) {
            return res.status(400).json({ success: false, message: 'IP target and OID are required' });
        }

        const snmpPort = Number(port) || 161;
        const options = {
            port: snmpPort,
            retries: 1,
            timeout: 3000,
            transport: 'udp4'
        };

        let session;
        if (version === 'v3' || String(version) === '3') {
            options.version = snmp.Version3;
            const authProtocol = authProto?.toLowerCase() === 'md5' ? snmp.AuthProtocols.md5 : snmp.AuthProtocols.sha;
            const privProtocol = privProto?.toLowerCase() === 'des' ? snmp.PrivProtocols.des : snmp.PrivProtocols.aes;
            
            const userConfig = {
                name: user,
                level: (authKey && privKey) ? snmp.SecurityLevel.authPriv : (authKey ? snmp.SecurityLevel.authNoPriv : snmp.SecurityLevel.noAuthNoPriv),
                authProtocol,
                authKey,
                privProtocol,
                privKey
            };
            session = snmp.createV3Session(ip, userConfig, options);
        } else {
            const snmpVer = version === 'v1' ? snmp.Version1 : snmp.Version2c;
            session = snmp.createSession(ip, community, { ...options, version: snmpVer });
        }

        session.get([oid.trim()], (error, varbinds) => {
            session.close();
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: `SNMP Error: ${error.message}`,
                    error: error.toString()
                });
            }

            if (!varbinds || varbinds.length === 0) {
                return res.status(404).json({ success: false, message: 'No response received for OID' });
            }

            const vb = varbinds[0];
            if (snmp.isVarbindError(vb)) {
                return res.status(400).json({
                    success: false,
                    message: snmp.varbindError(vb)
                });
            }

            let parsedValue = vb.value;
            if (Buffer.isBuffer(vb.value)) {
                parsedValue = vb.value.toString('utf8');
            }

            res.json({
                success: true,
                oid: vb.oid,
                type: vb.type,
                typeName: snmp.ObjectType[vb.type] || 'Unknown',
                raw: vb.value,
                value: parsedValue
            });
        });
    } catch (error) {
        console.error('Error testing live OID:', error);
        res.status(500).json({ success: false, message: 'Execution failed', error: error.message });
    }
};
