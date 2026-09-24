import React from 'react';

export default function BasicInfoFields({ formData, setFormData }) {
    return (
        <>
            {/* Dasar (Hostname, IP, MAC) */}
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Hostname / Device Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="SW-CORE-01, PIK1COM076..."
                        value={formData.hostname}
                        onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        IP Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="192.168.1.100"
                        value={formData.ip}
                        onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        MAC Address
                    </label>
                    <input
                        type="text"
                        placeholder="00:1A:2B:3C:4D:5E"
                        value={formData.mac}
                        onChange={(e) => setFormData({ ...formData, mac: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                </div>
            </div>

            {/* Vendor List Input */}
            <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Merek / Seri Perangkat
                </label>
                <input
                    type="text"
                    list="vendorSeriesList"
                    placeholder="Cisco C9200L, FortiGate 201E, HPE 5140..."
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
                <datalist id="vendorSeriesList">
                    <option value="Ubiquiti UniFi AC Mesh Pro">UniFi Outdoor AP</option>
                    <option value="Ubiquiti UniFi U6-LR">UniFi WiFi 6 Long-Range</option>
                    <option value="Ubiquiti UniFi U6-Pro">UniFi WiFi 6 Pro</option>
                    <option value="FortiGate 201E">Fortinet Firewall</option>
                    <option value="Cisco C9300L">Catalyst 9300L Enterprise</option>
                    <option value="Cisco C9200L">Catalyst 9200L Enterprise</option>
                    <option value="Cisco WS-C2960X">Catalyst 2960X Classic</option>
                    <option value="Cisco C1300-24FP">Catalyst 1300 CBS Series</option>
                    <option value="Cisco C1300-16FP">Catalyst 1300 CBS Series</option>
                    <option value="HPE 5140 24G 4SFP+">HPE Comware v7</option>
                    <option value="HPE 6000 (Aruba CX)">Aruba CX 6000 Series</option>
                    <option value="Panasonic WJ-NX400">Panasonic NVR Enterprise</option>
                    <option value="i-PRO WJ-NX510">i-PRO NVR Series</option>
                    <option value="Ruijie Reyee">Ruijie Networks</option>
                    <option value="MikroTik RouterOS">MikroTik Router/Switch</option>
                </datalist>
            </div>
        </>
    );
}
