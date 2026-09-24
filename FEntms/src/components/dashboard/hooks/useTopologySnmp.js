import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useDevices } from '../../../context/DeviceContext';

export const useTopologySnmp = (selectedDevice, setNodes) => {
    const { setDevices } = useDevices();
    const [snmpData, setSnmpData] = useState(null);
    const [nvrSnmpData, setNvrSnmpData] = useState(null);
    const [vendorMetrics, setVendorMetrics] = useState(null);
    const [isLoadingSnmp, setIsLoadingSnmp] = useState(false);
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

    useEffect(() => {
        const isSwitch = selectedDevice?.subType === 'switch' || selectedDevice?.label?.toLowerCase().includes('sw');
        const isUpsOrAts = selectedDevice?.subType === 'ups' || selectedDevice?.subType === 'ats' || 
                           selectedDevice?.label?.toLowerCase().includes('ups') || selectedDevice?.label?.toLowerCase().includes('ats') ||
                           selectedDevice?.vendor?.toLowerCase().includes('srpm') || selectedDevice?.vendor?.toLowerCase().includes('srvm') ||
                           selectedDevice?.vendor?.toLowerCase().includes('srvpm');
        const isSnmpTarget = selectedDevice && (
            selectedDevice.subType === 'nvr' || selectedDevice.subType === 'server' || 
            selectedDevice.subType === 'camera' || selectedDevice.subType === 'cctv' || 
            selectedDevice.subType === 'router' || isSwitch || isUpsOrAts
        );

        if (isSnmpTarget) {
            const ip = selectedDevice.ip || '127.0.0.1';
            setIsLoadingSnmp(true);
            setIsLoadingMetrics(true);
            setSnmpData(null);
            setNvrSnmpData(null);
            setVendorMetrics(null);

            api.get(`/devices/${ip}/metrics`, { timeout: 25000 })
                .then(res => {
                    if (res.data.success && res.data.data) {
                        const m = res.data.data;
                        setVendorMetrics(m);

                        const ports = m.ports || [];
                        setSnmpData({
                            ...m.info,
                            ...m.resources,
                            networkTraffic: {
                                in: m.resources?.trafficIn || '-',
                                out: m.resources?.trafficOut || '-'
                            },
                            ports
                        });

                        if (m.hdd?.length > 0 || m.cameras?.length > 0 || m.info?.serialNumber || m.info?.model) {
                            setNvrSnmpData({
                                info: m.info,
                                hdd: m.hdd || [],
                                cameras: m.cameras || [],
                                vendor: m.vendor
                            });
                        }

                        // Update local ReactFlow nodes
                        setNodes(nds => nds.map(n => {
                            if (n.id === selectedDevice.id || n.data?.ip === ip) {
                                return {
                                    ...n,
                                    data: {
                                        ...n.data,
                                        status: 'up',
                                        ...(ports.length > 0 ? { ports } : {})
                                    }
                                };
                            }
                            return n;
                        }));

                        // Update global DeviceContext agar saat panel ditutup status tetap UP
                        if (setDevices) {
                            setDevices(prev => prev.map(d => {
                                if (d.PID === selectedDevice.PID || d.ip === ip || d.id === selectedDevice.id) {
                                    return {
                                        ...d,
                                        status: 'UP'
                                    };
                                }
                                return d;
                            }));
                        }
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch vendor metrics:", err.message);
                })
                .finally(() => {
                    setIsLoadingSnmp(false);
                    setIsLoadingMetrics(false);
                });
        } else {
            setSnmpData(null);
            setNvrSnmpData(null);
            setVendorMetrics(null);
        }
    }, [selectedDevice, setNodes]);

    return {
        snmpData,
        nvrSnmpData,
        vendorMetrics,
        isLoadingSnmp,
        isLoadingNvrSnmp: isLoadingMetrics,
        isLoadingMetrics
    };
};
