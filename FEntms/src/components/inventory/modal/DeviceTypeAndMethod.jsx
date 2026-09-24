import React from 'react';

const DEVICE_TYPES = [
    { value: 'Endpoint', label: 'Endpoint Umum' },
    { value: 'PC', label: 'PC / Workstation' },
    { value: 'gathering', label: 'GATHERING (Industrial Touch PC)' },
    { value: 'Switch', label: 'Switch' },
    { value: 'Router', label: 'Router' },
    { value: 'Firewall', label: 'Firewall / Security' },
    { value: 'NVR', label: 'NVR' },
    { value: 'CCTV', label: 'CCTV' },
    { value: 'Server', label: 'Server' },
    { value: 'Access Point', label: 'Access Point (AP)' },
    { value: 'door', label: 'Access DOOR' },
    { value: 'Printer', label: 'Printer' },
    { value: 'TV', label: 'TV' },
    { value: 'UPS', label: 'UPS' },
    { value: 'ATS', label: 'ATS' },
];

export default function DeviceTypeAndMethod({ formData, setFormData }) {
    return (
        <div className="space-y-3">
            {/* Jenis Perangkat */}
            <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Jenis Perangkat
                </label>
                <select
                    value={formData.type}
                    onChange={(e) => {
                        const newType = e.target.value;
                        const isNetDevice = newType.toLowerCase() === 'switch' || newType.toLowerCase() === 'firewall';
                        setFormData((prev) => ({
                            ...prev,
                            type: newType,
                            port: isNetDevice ? (prev.port || (newType.toLowerCase() === 'firewall' ? '16' : '24')) : prev.port
                        }));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                >
                    {DEVICE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
            </div>

            {/* Polling Method */}
            <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-2">
                    Metode Ping/Polling Prioritas
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {['tcp', 'icmp', 'snmp'].map((method) => (
                        <label
                            key={method}
                            className={`flex items-center justify-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                                formData.pingMethod === method
                                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold'
                                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                        >
                            <input
                                type="radio"
                                name="pingMethod"
                                checked={formData.pingMethod === method}
                                onChange={() => setFormData({ ...formData, pingMethod: method })}
                                className="hidden"
                            />
                            <span className="uppercase">{method}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
