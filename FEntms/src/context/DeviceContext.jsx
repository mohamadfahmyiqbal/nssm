import React, { createContext, useState, useEffect, useContext } from 'react';
import {
    getAllDevicesFromDB,
    createDeviceInDB,
    updateDeviceInDB,
    deleteDeviceFromDB,
    bulkDeleteDevicesFromDB,
    getAllFloorplansFromDB
} from '../services/api';
import socketService from '../services/socketService';

const DeviceContext = createContext();

export const initialDefaultDevices = [
    { id: 'dev-1', PID: 'PID-001', name: 'SW-ACCESS-FLOOR3', hostname: 'SW-ACCESS-FLOOR3', ip: '192.168.10.30', vendor: 'Cisco Catalyst 2960X', type: 'switch', status: 'UP', floor: 'Lantai 3', location: 'Server Room Floor 3', polled: '11:20:00' },
    { id: 'dev-2', PID: 'PID-002', name: 'NVR-01', hostname: 'NVR-01', ip: '192.168.30.10', vendor: 'Panasonic', type: 'camera', status: 'DOWN', floor: 'Lantai 1', location: 'Lobi Utama', polled: '10:25:05' },
    { id: 'dev-3', PID: 'PID-003', name: 'SW-DIST-B', hostname: 'SW-DIST-B', ip: '192.168.20.2', vendor: 'Cisco', type: 'switch', status: 'WARNING', floor: 'Lantai 2', location: 'Rack B2', polled: '10:30:00' },
    { id: 'dev-4', PID: 'PID-004', name: 'AP-LT1-01', hostname: 'AP-LT1-01', ip: '192.168.10.1', vendor: 'Cisco Systems', type: 'ap', status: 'UP', floor: 'Lantai 1', location: 'Ruang Rapat 101', polled: '10:30:00' },
    { id: 'dev-5', PID: 'PID-005', name: 'HPE-SW-LT2', hostname: 'HPE-SW-LT2', ip: '192.168.30.10', vendor: 'HPE', type: 'server', status: 'UP', floor: 'Lantai 2', location: 'Ruang Server 202', polled: '10:25:05' },
];

export function DeviceProvider({ children }) {
    const [devices, setDevices] = useState([]);
    const [floorplansList, setFloorplansList] = useState([]);

    const refreshFloorplans = async () => {
        try {
            const res = await getAllFloorplansFromDB();
            if (res && res.success && res.data) {
                setFloorplansList(res.data);
            }
        } catch (err) {
            console.log('Failed fetching floorplans list for context.');
        }
    };

    const refreshDevices = async () => {
        try {
            const res = await getAllDevicesFromDB();
            if (res && res.success && Array.isArray(res.data)) {
                const formatted = res.data.map((item, idx) => {
                    const cleanPID = item.PID ? String(item.PID).trim() : `dev-db-${idx}`;
                    const cleanName = item.HOSTNAME ? String(item.HOSTNAME).trim() : (item.name || 'Device');
                    const cleanSEGMENT = item.SEGMENT ? String(item.SEGMENT).trim() : '';
                    const defaultFloor = cleanSEGMENT && cleanSEGMENT !== 'DEFAULT' ? cleanSEGMENT : 'Unmapped';
                    return {
                        id: cleanPID,
                        PID: cleanPID,
                        name: cleanName,
                        hostname: cleanName,
                        ip: item.IP ? String(item.IP).trim() : (item.ip || '127.0.0.1'),
                        mac: item.MAC ? String(item.MAC).trim() : (item.mac || '-'),
                        vendor: item.VENDOR || item.vendor || item.SEGMENT || 'Generic',
                        type: item.TYPE || item.type || 'server',
                        pingMethod: item.PING_METHOD || item.pingMethod || 'tcp',
                        snmpVersion: item.SNMP_VERSION || item.snmpVersion || 'v2c',
                        snmpPort: item.SNMP_PORT || item.snmpPort || '161',
                        snmpCommunity: item.SNMP_COMMUNITY || item.snmpCommunity || 'public',
                        snmpUser: item.SNMP_USER || item.snmpUser || '',
                        snmpAuthProto: item.SNMP_AUTH_PROTO || item.snmpAuthProto || 'sha',
                        snmpAuthKey: item.SNMP_AUTH_KEY || item.snmpAuthKey || '',
                        snmpPrivProto: item.SNMP_PRIV_PROTO || item.snmpPrivProto || 'aes',
                        snmpPrivKey: item.SNMP_PRIV_KEY || item.snmpPrivKey || '',
                        status: item.status || 'UP',
                        floor: item.floor || defaultFloor,
                        location: item.location || 'Belum ditentukan',
                        polled: new Date().toLocaleTimeString('id-ID'),
                        ...(item.nvrData || {})
                    };
                });
                setDevices(formatted);
            }
        } catch (err) {
            console.log('Backend devices API offset fallback used.');
        }
    };

    useEffect(() => {
        refreshDevices();
        refreshFloorplans();

        // Integrasi Socket.IO untuk Live Data Status
        const handleStatusUpdate = (payload) => {
            setDevices((prevDevices) =>
                prevDevices.map((dev) => {
                    // Prioritaskan PID murni
                    const isMatch = payload.pid
                        ? (dev.PID === payload.pid || dev.id === payload.pid)
                        : (payload.ip && dev.ip === payload.ip);
                    if (isMatch) {
                        return {
                            ...dev,
                            status: payload.status,
                            polled: new Date().toLocaleTimeString('id-ID'), // Update waktu polling terakhir
                            ...(payload.nvrData || {}),
                            ...(payload.snmpData ? { snmpData: payload.snmpData } : {})
                        };
                    }
                    return dev;
                })
            );
        };

        socketService.onStatusUpdate(handleStatusUpdate);

        return () => {
            socketService.offStatusUpdate(handleStatusUpdate);
        };
    }, []);

    const updateDeviceLocation = (deviceNameOrId, floorName, locationInfo) => {
        setDevices((prevDevices) =>
            prevDevices.map((dev) => {
                if (dev.name === deviceNameOrId || dev.id === deviceNameOrId || dev.PID === deviceNameOrId) {
                    return {
                        ...dev,
                        floor: floorName || dev.floor,
                        location: locationInfo || dev.location,
                    };
                }
                return dev;
            })
        );
    };

    const syncFloorplanDevices = (floorplanName, floorplanDevices, floorplanRooms = []) => {
        if (!floorplanDevices || !Array.isArray(floorplanDevices)) return;

        setDevices((prevDevices) => {
            const updated = [...prevDevices];
            floorplanDevices.forEach((fpDev) => {
                const devName = fpDev.label || fpDev.name;
                if (!devName) return;

                // Hitung deteksi otomatis koordinat perangkat berada di dalam ruangan mana
                let detectedRoomLabel = null;
                if (floorplanRooms && Array.isArray(floorplanRooms) && floorplanRooms.length > 0) {
                    const matchedRoom = floorplanRooms.find((r) => {
                        const rx = r.x || 0;
                        const ry = r.y || 0;
                        const rw = r.width || 0;
                        const rh = r.height || 0;
                        const dx = fpDev.x || 0;
                        const dy = fpDev.y || 0;
                        return dx >= rx && dx <= rx + rw && dy >= ry && dy <= ry + rh;
                    });
                    if (matchedRoom) {
                        detectedRoomLabel = matchedRoom.label;
                    }
                }

                const roomInfo = detectedRoomLabel
                    ? detectedRoomLabel
                    : (fpDev.room ? fpDev.room : `Posisi Canvas (X:${Math.round(fpDev.x || 0)}, Y:${Math.round(fpDev.y || 0)})`);

                const fpPid = String(fpDev.PID || fpDev.id || '').trim().toLowerCase();
                const existingIdx = updated.findIndex((d) => {
                    const dPid = String(d.PID || d.id || '').trim().toLowerCase();
                    if (fpPid && dPid && fpPid === dPid) return true;
                    return false;
                });

                if (existingIdx !== -1) {
                    const currentIp = updated[existingIdx].ip;
                    const newIp = (fpDev.ip && fpDev.ip !== '192.168.1.100' && fpDev.ip !== 'N/A') ? fpDev.ip : currentIp;

                    updated[existingIdx] = {
                        ...updated[existingIdx],
                        floor: floorplanName || updated[existingIdx].floor,
                        location: roomInfo,
                        ip: newIp,
                        name: devName,
                        hostname: devName
                    };
                } else {
                    const devId = fpDev.PID || fpDev.id || `dev-${Date.now()}`;
                    updated.unshift({
                        id: devId,
                        PID: devId,
                        name: devName,
                        hostname: devName,
                        ip: fpDev.ip || '192.168.1.100',
                        mac: fpDev.mac || '-',
                        vendor: fpDev.vendor || 'Generic',
                        type: fpDev.type || 'server',
                        status: 'UP',
                        floor: floorplanName || 'Detail Floorplan',
                        location: roomInfo,
                        polled: new Date().toLocaleTimeString('id-ID'),
                    });
                }
            });
            return updated;
        });
    };

    const addDevice = async (newDev) => {
        let createdPid = newDev.PID || null;

        try {
            const res = await createDeviceInDB({
                hostname: newDev.hostname,
                ipAddress: newDev.ip,
                mac: newDev.mac,
                vendorType: newDev.vendor,
                segment: newDev.floor || 'DEFAULT',
                type: newDev.type,
                vendor: newDev.vendor,
                pingMethod: newDev.pingMethod,
                snmpVersion: newDev.snmpVersion,
                snmpPort: newDev.snmpPort,
                snmpCommunity: newDev.snmpCommunity,
                snmpUser: newDev.snmpUser,
                snmpAuthProto: newDev.snmpAuthProto,
                snmpAuthKey: newDev.snmpAuthKey,
                snmpPrivProto: newDev.snmpPrivProto,
                snmpPrivKey: newDev.snmpPrivKey,
            });
            if (res && (res.device?.PID || res.PID)) {
                createdPid = res.device?.PID || res.PID;
            }
        } catch (err) {
            console.log('Failed creating device on server, saved locally');
        }

        const finalPid = createdPid || `P-${Date.now()}`;
        const addedDev = {
            id: finalPid,
            PID: finalPid,
            name: newDev.hostname,
            hostname: newDev.hostname,
            ip: newDev.ip,
            mac: newDev.mac || '-',
            vendor: newDev.vendor || 'Generic',
            type: newDev.type || 'server',
            pingMethod: newDev.pingMethod || 'tcp',
            snmpVersion: newDev.snmpVersion || 'v2c',
            snmpPort: newDev.snmpPort || '161',
            snmpCommunity: newDev.snmpCommunity || 'public',
            snmpUser: newDev.snmpUser || '',
            snmpAuthProto: newDev.snmpAuthProto || 'sha',
            snmpAuthKey: newDev.snmpAuthKey || '',
            snmpPrivProto: newDev.snmpPrivProto || 'aes',
            snmpPrivKey: newDev.snmpPrivKey || '',
            status: 'UP',
            floor: newDev.floor || 'Unmapped',
            location: newDev.location || 'Belum ditentukan',
            polled: new Date().toLocaleTimeString('id-ID'),
        };

        setDevices((prev) => [addedDev, ...prev]);
    };

    const removeDevice = async (targetPid) => {
        const cleanPid = String(targetPid).trim();
        setDevices((prev) => prev.filter((d) => (d.PID || d.id) !== cleanPid));

        try {
            await deleteDeviceFromDB(cleanPid);
        } catch (err) {
            console.log('Failed deleting device from server.');
        }
    };

    const removeMultipleDevices = async (targetPidsArray) => {
        if (!targetPidsArray || targetPidsArray.length === 0) return;

        const cleanPids = targetPidsArray.map((p) => String(p).trim());
        const deleteSet = new Set(cleanPids);

        setDevices((prev) => prev.filter((d) => !deleteSet.has(d.PID) && !deleteSet.has(d.id)));

        try {
            await bulkDeleteDevicesFromDB(cleanPids);
        } catch (err) {
            console.log('Failed bulk deleting devices from server.');
        }
    };

    const updateDevice = async (targetIdOrPid, updatedFields) => {
        setDevices((prev) =>
            prev.map((d) => {
                if (d.id === targetIdOrPid || d.PID === targetIdOrPid) {
                    return { ...d, ...updatedFields };
                }
                return d;
            })
        );

        try {
            await updateDeviceInDB(targetIdOrPid, {
                hostname: updatedFields.hostname || updatedFields.name,
                ipAddress: updatedFields.ip || updatedFields.ipAddress,
                mac: updatedFields.mac,
                vendorType: updatedFields.vendor,
                vendor: updatedFields.vendor,
                segment: updatedFields.floor || updatedFields.segment,
                type: updatedFields.type,
                pingMethod: updatedFields.pingMethod,
                snmpVersion: updatedFields.snmpVersion,
                snmpPort: updatedFields.snmpPort,
                snmpCommunity: updatedFields.snmpCommunity,
                snmpUser: updatedFields.snmpUser,
                snmpAuthProto: updatedFields.snmpAuthProto,
                snmpAuthKey: updatedFields.snmpAuthKey,
                snmpPrivProto: updatedFields.snmpPrivProto,
                snmpPrivKey: updatedFields.snmpPrivKey,
            });
        } catch (err) {
            console.log('Failed updating device in database.');
        }
    };

    return (
        <DeviceContext.Provider
            value={{
                devices,
                setDevices,
                floorplansList,
                refreshFloorplans,
                updateDeviceLocation,
                syncFloorplanDevices,
                addDevice,
                removeDevice,
                removeMultipleDevices,
                updateDevice,
                refreshDevices,
            }}
        >
            {children}
        </DeviceContext.Provider>
    );
}

export function useDevices() {
    return useContext(DeviceContext);
}
