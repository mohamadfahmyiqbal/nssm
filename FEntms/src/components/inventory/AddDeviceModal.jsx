import React, { useState, useEffect } from 'react';
import { X, Network, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export default function AddDeviceModal({ isOpen, onClose, onSave, device = null }) {
    const [step, setStep] = useState('form'); // 'form' | 'testing' | 'result'
    const [testResult, setTestResult] = useState(null);
    const [testError, setTestError] = useState(null);

    // Initial State Setup
    const getInitialState = () => {
        // Cek apakah SNMP aktif (bisa dari field eksplisit snmpVersion yang bukan 'none'/empty, atau pingMethod === 'snmp')
        const initialVersion = device?.snmpVersion || device?.SNMP_VERSION;
        const isSnmpEnabled = initialVersion && initialVersion !== 'none' && initialVersion !== '';

        return {
            hostname: device?.hostname || device?.name || '',
            ip: device?.ip || device?.IP || '',
            mac: device?.mac || device?.MAC || '',
            type: device?.type || device?.TYPE || 'Endpoint',
            vendor: device?.vendor || device?.VENDOR || '',
            pingMethod: device?.pingMethod || device?.PING_METHOD || 'tcp',
            enableSnmp: isSnmpEnabled !== undefined ? Boolean(isSnmpEnabled) : false,
            snmpVersion: (initialVersion && initialVersion !== 'none') ? initialVersion : 'v2c',
            snmpPort: device?.snmpPort || device?.SNMP_PORT || '161',
            snmpCommunity: device?.snmpCommunity || device?.SNMP_COMMUNITY || 'public',
            snmpUser: device?.snmpUser || device?.SNMP_USER || '',
            snmpAuthProto: device?.snmpAuthProto || device?.SNMP_AUTH_PROTO || 'sha',
            snmpAuthKey: device?.snmpAuthKey || device?.SNMP_AUTH_KEY || '',
            snmpPrivProto: device?.snmpPrivProto || device?.SNMP_PRIV_PROTO || 'aes',
            snmpPrivKey: device?.snmpPrivKey || device?.SNMP_PRIV_KEY || '',
            autoDiscover: true,
        };
    };

    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialState());
            setStep('form');
            setTestResult(null);
            setTestError(null);
        }
    }, [isOpen, device]);

    if (!isOpen) return null;

    const handleTestSNMP = async () => {
        // Jika SNMP tidak diaktifkan atau metode bukan SNMP, langsung simpan
        if (!formData.enableSnmp && formData.pingMethod !== 'snmp') {
            const dataToSave = {
                ...formData,
                snmpVersion: 'none',
                snmpPort: null,
                snmpCommunity: null,
                snmpUser: null,
                snmpAuthProto: null,
                snmpAuthKey: null,
                snmpPrivProto: null,
                snmpPrivKey: null
            };
            onSave(dataToSave);
            onClose();
            return;
        }

        // Jika metode bukan SNMP tapi SNMP diaktifkan, simpan tanpa perlu block test
        if (formData.pingMethod !== 'snmp') {
            onSave(formData);
            onClose();
            return;
        }

        setStep('testing');
        setTestResult(null);
        setTestError(null);

        try {
            const res = await api.post('/devices/snmp-test', formData);
            if (res.data.success) {
                setTestResult(res.data.data);
            } else {
                setTestError(res.data.error || 'Test SNMP gagal');
            }
        } catch (error) {
            setTestError(error.response?.data?.error || error.message || 'Gagal terhubung ke server');
        } finally {
            setStep('result');
        }
    };

    const handleResetAndClose = () => {
        setStep('form');
        onClose();
    };

    const isEdit = !!device;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden font-sans text-xs text-slate-200">
                {/* Modal Header */}
                <div className="flex justify-between items-center px-5 py-3.5 bg-slate-800/80 border-b border-slate-700">
                    <h3 className="font-bold text-sm tracking-wide text-slate-100 uppercase">
                        {isEdit ? 'EDIT PERANGKAT' : 'TAMBAH PERANGKAT BARU'}
                    </h3>
                    <button onClick={handleResetAndClose} className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-lg">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {step === 'form' && (
                        <>
                            {/* Dasar */}
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

                            {/* Jenis & Vendor */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                        Jenis Perangkat
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                                    >
                                        <option value="Endpoint">Endpoint Umum</option>
                                        <option value="PC">PC / Workstation</option>
                                        <option value="gathering">GATHERING (Industrial Touch PC)</option>
                                        <option value="Switch">Switch</option>
                                        <option value="Router">Router</option>
                                        <option value="Firewall">Firewall / Security</option>
                                        <option value="NVR">NVR</option>
                                        <option value="CCTV">CCTV</option>
                                        <option value="Server">Server</option>
                                        <option value="Access Point">Access Point (AP)</option>
                                        <option value="door">Access DOOR</option>
                                        <option value="Printer">Printer</option>
                                        <option value="TV">TV</option>
                                    </select>
                                </div>
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
                                            className={`flex items-center justify-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${formData.pingMethod === method
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

                            {/* SNMP Credentials */}
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
                                                    // Jika dimatikan tapi pingMethod snmp, ubah default ke tcp
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

                            {/* Action Button */}
                            <button
                                onClick={handleTestSNMP}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-colors"
                            >
                                <span>✓ Simpan {formData.pingMethod === 'snmp' ? '& Uji SNMP' : 'Data'}</span>
                            </button>
                        </>
                    )}

                    {/* Testing SNMP Loading State */}
                    {step === 'testing' && (
                        <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                                <Network className="w-6 h-6 text-blue-400 absolute inset-0 m-auto" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-100 text-sm">Menguji Koneksi SNMP...</p>
                                <p className="text-slate-400 text-xs mt-1 font-mono">Connecting to {formData.ip}:{formData.snmpPort || 161}</p>
                            </div>
                        </div>
                    )}

                    {/* Result State */}
                    {step === 'result' && (
                        <div className="space-y-4">
                            {testError ? (
                                <div className="bg-rose-950/40 border border-rose-500/40 p-3 rounded-xl font-mono space-y-1 text-rose-400">
                                    <div className="flex items-center gap-2 font-bold mb-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>Test SNMP Gagal</span>
                                    </div>
                                    <p className="text-xs break-words">{testError}</p>
                                </div>
                            ) : (
                                <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl font-mono space-y-1 text-emerald-400">
                                    <div className="flex items-center gap-2 font-bold mb-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Status: Koneksi SNMP Sukses</span>
                                    </div>
                                    {testResult && (
                                        <div className="text-xs mt-2 space-y-1 border-t border-emerald-500/30 pt-2">
                                            <p><span className="opacity-70">System Name:</span> {testResult.sysName}</p>
                                            <p><span className="opacity-70">System Descr:</span> {testResult.sysDescr}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={handleResetAndClose}
                                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => {
                                        onSave(formData);
                                        handleResetAndClose();
                                    }}
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                >
                                    <span>SIMPAN</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}