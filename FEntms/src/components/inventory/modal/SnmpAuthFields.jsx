import React from 'react';

export default function SnmpAuthFields({ formData, setFormData }) {
    return (
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="toggle-snmp-checkbox"
                        checked={formData.enableSnmp || formData.pingMethod === 'snmp'}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData((prev) => ({
                                ...prev,
                                enableSnmp: checked,
                                pingMethod: !checked && prev.pingMethod === 'snmp' ? 'tcp' : prev.pingMethod
                            }));
                        }}
                        className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer accent-blue-600"
                    />
                    <label htmlFor="toggle-snmp-checkbox" className="font-bold text-slate-200 text-xs cursor-pointer select-none">
                        Aktifkan SNMP Polling / Monitoring
                    </label>
                </div>

                {(formData.enableSnmp || formData.pingMethod === 'snmp') && (
                    <div className="flex items-center gap-2">
                        <label className="text-slate-400 text-[10px]">Versi:</label>
                        <select
                            value={formData.snmpVersion}
                            onChange={(e) => setFormData({ ...formData, snmpVersion: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-[10px]"
                        >
                            <option value="v1">v1</option>
                            <option value="v2c">v2c</option>
                            <option value="v3">v3</option>
                        </select>
                    </div>
                )}
            </div>

            {!(formData.enableSnmp || formData.pingMethod === 'snmp') && (
                <p className="text-[11px] text-slate-500 italic">
                    SNMP dinonaktifkan untuk perangkat ini. Polling metrik detail/hardware tidak akan dijalankan.
                </p>
            )}

            {(formData.enableSnmp || formData.pingMethod === 'snmp') && (formData.snmpVersion === 'v1' || formData.snmpVersion === 'v2c') && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-slate-400 text-[10px] mb-1">Community String</label>
                        <input
                            type="text"
                            value={formData.snmpCommunity}
                            onChange={(e) => setFormData({ ...formData, snmpCommunity: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-[10px] mb-1">Port</label>
                        <input
                            type="text"
                            value={formData.snmpPort}
                            onChange={(e) => setFormData({ ...formData, snmpPort: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                        />
                    </div>
                </div>
            )}

            {(formData.enableSnmp || formData.pingMethod === 'snmp') && formData.snmpVersion === 'v3' && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-400 text-[10px] mb-1">Username</label>
                            <input
                                type="text"
                                value={formData.snmpUser}
                                onChange={(e) => setFormData({ ...formData, snmpUser: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-[10px] mb-1">Port</label>
                            <input
                                type="text"
                                value={formData.snmpPort}
                                onChange={(e) => setFormData({ ...formData, snmpPort: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-400 text-[10px] mb-1">Auth Protocol</label>
                            <select
                                value={formData.snmpAuthProto}
                                onChange={(e) => setFormData({ ...formData, snmpAuthProto: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                            >
                                <option value="none">None</option>
                                <option value="md5">MD5</option>
                                <option value="sha">SHA</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-[10px] mb-1">Auth Key</label>
                            <input
                                type="password"
                                value={formData.snmpAuthKey}
                                onChange={(e) => setFormData({ ...formData, snmpAuthKey: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-400 text-[10px] mb-1">Priv Protocol</label>
                            <select
                                value={formData.snmpPrivProto}
                                onChange={(e) => setFormData({ ...formData, snmpPrivProto: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                            >
                                <option value="none">None</option>
                                <option value="des">DES</option>
                                <option value="aes">AES</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-[10px] mb-1">Priv Key</label>
                            <input
                                type="password"
                                value={formData.snmpPrivKey}
                                onChange={(e) => setFormData({ ...formData, snmpPrivKey: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
