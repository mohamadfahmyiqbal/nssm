import React from 'react';

export default function ModularPortConfig({ formData, setFormData }) {
    const isNetDevice = formData.type?.toLowerCase() === 'switch' || formData.type?.toLowerCase() === 'firewall';
    if (!isNetDevice) return null;

    let parsed = { rj45: 24, sfp: 0, sfpPlus: 0, wan: 0, mgmt: 0, ha: 0 };
    try {
        if (formData.port && formData.port.startsWith('{')) {
            parsed = { ...parsed, ...JSON.parse(formData.port) };
        } else {
            parsed.rj45 = parseInt(formData.port, 10) || 24;
        }
    } catch (e) {
        parsed.rj45 = parseInt(formData.port, 10) || 24;
    }

    const totalPorts = (Number(parsed.rj45 || 0) + Number(parsed.sfp || 0) + Number(parsed.sfpPlus || 0) + Number(parsed.wan || 0) + Number(parsed.mgmt || 0) + Number(parsed.ha || 0));

    const updateModular = (key, val) => {
        const updated = { ...parsed, [key]: Math.max(0, parseInt(val, 10) || 0) };
        setFormData({ ...formData, port: JSON.stringify(updated) });
    };

    return (
        <div className="space-y-2 bg-slate-950/80 p-3 rounded-xl border border-emerald-500/30">
            <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span>⚙️ Konfigurasi Port Modular Dinamis</span>
                </label>
                <span className="text-[9.5px] font-mono text-slate-400">
                    Total Port: <strong className="text-emerald-300 font-bold">{totalPorts} Ports</strong>
                </span>
            </div>

            {/* Presets Cepat */}
            <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, port: JSON.stringify({ rj45: 16, sfp: 8, sfpPlus: 4, wan: 2, mgmt: 1, ha: 1 }) })}
                    className="px-2 py-0.5 rounded bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9.5px] font-mono font-semibold"
                >
                    FortiGate (16 RJ45 + 8 SFP + 4 SFP+ + 2 WAN + MGMT/HA)
                </button>
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, port: JSON.stringify({ rj45: 24, sfp: 4, sfpPlus: 0, wan: 0, mgmt: 1, ha: 0 }) })}
                    className="px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9.5px] font-mono font-semibold"
                >
                    Switch 28P (24 GE + 4 SFP + MGMT)
                </button>
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, port: JSON.stringify({ rj45: 24, sfp: 0, sfpPlus: 0, wan: 2, mgmt: 1, ha: 1 }) })}
                    className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9.5px] font-mono font-semibold"
                >
                    FW 24P + WAN/MGMT/HA
                </button>
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, port: '24' })}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[9.5px] font-mono"
                >
                    Standard 24 Ports
                </button>
            </div>

            {/* Input Rincian Modular */}
            <div className="grid grid-cols-6 gap-2 pt-1.5 font-mono text-[10px]">
                <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[8.5px] font-bold">GE RJ45</span>
                    <input
                        type="number"
                        min="0"
                        max="96"
                        value={parsed.rj45}
                        onChange={(e) => updateModular('rj45', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-slate-100 font-bold text-center mt-1 focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-cyan-400 block text-[8.5px] font-bold">GE SFP</span>
                    <input
                        type="number"
                        min="0"
                        max="48"
                        value={parsed.sfp}
                        onChange={(e) => updateModular('sfp', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-cyan-300 font-bold text-center mt-1 focus:outline-none focus:border-cyan-500"
                    />
                </div>
                <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-purple-400 block text-[8.5px] font-bold">10G SFP+</span>
                    <input
                        type="number"
                        min="0"
                        max="24"
                        value={parsed.sfpPlus}
                        onChange={(e) => updateModular('sfpPlus', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-purple-300 font-bold text-center mt-1 focus:outline-none focus:border-purple-500"
                    />
                </div>
                <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-amber-400 block text-[8.5px] font-bold">WAN</span>
                    <input
                        type="number"
                        min="0"
                        max="8"
                        value={parsed.wan}
                        onChange={(e) => updateModular('wan', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-amber-300 font-bold text-center mt-1 focus:outline-none focus:border-amber-500"
                    />
                </div>
                <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 block text-[8.5px] font-bold">MGMT</span>
                    <input
                        type="number"
                        min="0"
                        max="4"
                        value={parsed.mgmt}
                        onChange={(e) => updateModular('mgmt', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-emerald-300 font-bold text-center mt-1 focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-rose-400 block text-[8.5px] font-bold">HA CLUST</span>
                    <input
                        type="number"
                        min="0"
                        max="4"
                        value={parsed.ha}
                        onChange={(e) => updateModular('ha', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-rose-300 font-bold text-center mt-1 focus:outline-none focus:border-rose-500"
                    />
                </div>
            </div>
        </div>
    );
}
