export const initialNodes = [
    // ==========================================
    // 1. CORE LAYER
    // ==========================================
    {
        id: 'sw-core-1',
        type: 'customDevice',
        data: {
            label: 'SW-CORE-CISCO-01',
            layer: 'CORE',
            cpu: '12%',
            status: 'up',
            vlan: 'LAN • VLAN 10',
            location: 'Server Room • Rack 01',
            floor: 'Lantai 2'
        },
        position: { x: 320, y: 40 }
    },
    {
        id: 'sw-core-2',
        type: 'customDevice',
        data: {
            label: 'SW-CORE-CISCO-02',
            layer: 'CORE',
            cpu: '12%',
            status: 'up',
            vlan: 'LAN • VLAN 10',
            location: 'Server Room • Rack 01',
            floor: 'Lantai 2'
        },
        position: { x: 620, y: 40 }
    },

    // ==========================================
    // 2. DISTRIBUTION LAYER
    // ==========================================
    {
        id: 'sw-dist-a',
        type: 'customDevice',
        data: {
            label: 'SW-DIST-A',
            layer: 'DISTRIBUTION',
            cpu: '62%',
            status: 'up',
            vlan: 'LAN • VLAN 10',
            location: 'Main Distribution Frame (MDF)',
            floor: 'Lantai 1'
        },
        position: { x: 120, y: 200 }
    },
    {
        id: 'sw-dist-b',
        type: 'customDevice',
        data: {
            label: 'SW-DIST-B',
            layer: 'DISTRIBUTION',
            cpu: '65%',
            status: 'warning',
            vlan: 'LAN • VLAN 10',
            location: 'Main Distribution Frame (MDF)',
            floor: 'Lantai 1'
        },
        position: { x: 470, y: 200 }
    },
    {
        id: 'sw-dist-c',
        type: 'customDevice',
        data: {
            label: 'SW-DIST-C (PoE CCTV)',
            layer: 'DISTRIBUTION',
            cpu: '65%',
            status: 'up',
            vlan: 'CCTV • VLAN 20',
            location: 'Security Control Room',
            floor: 'Lantai 1'
        },
        position: { x: 820, y: 200 }
    },

    // ==========================================
    // 3. ACCESS LAYER SWITCHES
    // ==========================================
    {
        id: 'sw-acc-lt1',
        type: 'customDevice',
        data: {
            label: 'HPE-SW-LT1',
            layer: 'ACCESS',
            cpu: '18%',
            status: 'up',
            vlan: 'LAN • VLAN 10',
            location: 'IT Workspace Area',
            floor: 'Lantai 1'
        },
        position: { x: 60, y: 380 }
    },
    {
        id: 'sw-poe-iot',
        type: 'customDevice',
        data: {
            label: 'SW-POE-IOT-01',
            layer: 'ACCESS',
            cpu: '25%',
            status: 'up',
            vlan: 'IOT • VLAN 30',
            location: 'Utility Room 02',
            floor: 'Lantai 1'
        },
        position: { x: 470, y: 380 }
    },
    {
        id: 'sw-poe-cctv',
        type: 'customDevice',
        data: {
            label: 'SW-POE-CCTV-01',
            layer: 'ACCESS',
            cpu: '42%',
            status: 'up',
            vlan: 'CCTV • VLAN 20',
            location: 'Security Control Room',
            floor: 'Lantai 1'
        },
        position: { x: 820, y: 380 }
    },

    // ==========================================
    // 4. ENDPOINT LEVEL
    // ==========================================
    {
        id: 'pc-admin-01',
        type: 'endpointDevice',
        data: {
            label: 'PC-ADMIN-01',
            subType: 'pc',
            status: 'up',
            ip: '192.168.10.15',
            category: 'lan',
            location: 'Ruang Admin / HRD',
            floor: 'Lantai 1'
        },
        position: { x: -40, y: 550 }
    },
    {
        id: 'prn-hrd-01',
        type: 'endpointDevice',
        data: {
            label: 'PRN-HRD-01',
            subType: 'printer',
            status: 'up',
            ip: '192.168.10.50',
            category: 'lan',
            location: 'Ruang Admin / HRD',
            floor: 'Lantai 1'
        },
        position: { x: 80, y: 550 }
    },
    {
        id: 'ap-lt1-02',
        type: 'endpointDevice',
        data: {
            label: 'AP-LT1-02',
            subType: 'ap',
            status: 'up',
            ip: '192.168.10.2',
            category: 'lan',
            location: 'Corridor Utama Lt. 1',
            floor: 'Lantai 1'
        },
        position: { x: 200, y: 550 }
    },
    {
        id: 'door-server',
        type: 'endpointDevice',
        data: {
            label: 'DOOR-SERVER',
            subType: 'door',
            status: 'up',
            ip: '192.168.30.10',
            category: 'lan',
            location: 'Pintu Masuk Server Room',
            floor: 'Lantai 2'
        },
        position: { x: 400, y: 550 }
    },
    {
        id: 'absen-lobby',
        type: 'endpointDevice',
        data: {
            label: 'ABSEN-LOBBY',
            subType: 'biometric',
            status: 'up',
            ip: '192.168.30.12',
            category: 'lan',
            location: 'Lobby Utama Gedung',
            floor: 'Lantai 1'
        },
        position: { x: 540, y: 550 }
    },
    {
        id: 'nvr-01',
        type: 'endpointDevice',
        data: {
            label: 'NVR-PANASONIC-01',
            subType: 'nvr',
            status: 'down',
            ip: '192.168.20.250',
            category: 'cctv',
            location: 'Security Control Room',
            floor: 'Lantai 1'
        },
        position: { x: 740, y: 550 }
    },
    {
        id: 'cam-lobby-01',
        type: 'endpointDevice',
        data: {
            label: 'CAM-LOBBY-01',
            subType: 'camera',
            status: 'up',
            ip: '192.168.20.101',
            category: 'cctv',
            location: 'Lobby Utama Gedung',
            floor: 'Lantai 1'
        },
        position: { x: 880, y: 550 }
    },
    {
        id: 'cam-park-02',
        type: 'endpointDevice',
        data: {
            label: 'CAM-PARK-02',
            subType: 'camera',
            status: 'up',
            ip: '192.168.20.102',
            category: 'cctv',
            location: 'Area Parkir Outdoor',
            floor: 'Lantai Dasar'
        },
        position: { x: 1020, y: 550 }
    },
];

export const initialEdges = [
    { id: 'e-core1-core2', source: 'sw-core-1', target: 'sw-core-2', sourceHandle: 's-p-48', targetHandle: 'p-48', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    { id: 'e-core1-dista', source: 'sw-core-1', target: 'sw-dist-a', sourceHandle: 's-p-1', targetHandle: 'p-48', style: { stroke: '#3b82f6', strokeWidth: 2 } },
    { id: 'e-core1-distb', source: 'sw-core-1', target: 'sw-dist-b', sourceHandle: 's-p-2', targetHandle: 'p-48', style: { stroke: '#3b82f6', strokeWidth: 2 } },
    { id: 'e-core2-distb', source: 'sw-core-2', target: 'sw-dist-b', sourceHandle: 's-p-1', targetHandle: 'p-47', style: { stroke: '#f59e0b', strokeDasharray: '5,5', strokeWidth: 2 } },
    { id: 'e-core2-distc', source: 'sw-core-2', target: 'sw-dist-c', sourceHandle: 's-p-2', targetHandle: 'p-48', style: { stroke: '#a855f7', strokeWidth: 2 } },
    { id: 'e-dista-acclt1', source: 'sw-dist-a', target: 'sw-acc-lt1', sourceHandle: 's-p-1', targetHandle: 'p-48', style: { stroke: '#10b981', strokeWidth: 2 } },
    { id: 'e-distb-poeiot', source: 'sw-dist-b', target: 'sw-poe-iot', sourceHandle: 's-p-2', targetHandle: 'p-48', style: { stroke: '#f59e0b', strokeWidth: 2 } },
    { id: 'e-distc-poecctv', source: 'sw-dist-c', target: 'sw-poe-cctv', sourceHandle: 's-p-1', targetHandle: 'p-48', style: { stroke: '#a855f7', strokeWidth: 2 } },
    { id: 'e-acc-pc1', source: 'sw-acc-lt1', target: 'pc-admin-01', sourceHandle: 's-p-1', style: { stroke: '#475569', strokeWidth: 1.5 } },
    { id: 'e-acc-prn1', source: 'sw-acc-lt1', target: 'prn-hrd-01', sourceHandle: 's-p-2', style: { stroke: '#475569', strokeWidth: 1.5 } },
    { id: 'e-acc-ap1', source: 'sw-acc-lt1', target: 'ap-lt1-02', sourceHandle: 's-p-3', style: { stroke: '#10b981', strokeWidth: 1.5 } },
    { id: 'e-iot-door', source: 'sw-poe-iot', target: 'door-server', sourceHandle: 's-p-10', style: { stroke: '#f59e0b', strokeDasharray: '4', strokeWidth: 1.5 } },
    { id: 'e-iot-absen', source: 'sw-poe-iot', target: 'absen-lobby', sourceHandle: 's-p-11', style: { stroke: '#f59e0b', strokeWidth: 1.5 } },
    { id: 'e-cctv-nvr', source: 'sw-poe-cctv', target: 'nvr-01', sourceHandle: 's-p-1', style: { stroke: '#f43f5e', strokeDasharray: '4', strokeWidth: 1.5 } },
    { id: 'e-cctv-cam1', source: 'sw-poe-cctv', target: 'cam-lobby-01', sourceHandle: 's-p-2', style: { stroke: '#a855f7', strokeWidth: 1.5 } },
    { id: 'e-cctv-cam2', source: 'sw-poe-cctv', target: 'cam-park-02', sourceHandle: 's-p-3', style: { stroke: '#a855f7', strokeWidth: 1.5 } },
];          