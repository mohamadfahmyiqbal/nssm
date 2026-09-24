import React from 'react';
import { MapPin, Wrench, Trash2 } from 'lucide-react';

export default function InventoryTableRow({
    dev,
    idx,
    isChecked,
    onToggleSelect,
    isPollingDisabled,
    onTogglePolling,
    onEditDevice,
    onDeleteDevice
}) {
    const devIdOrPid = dev.PID || dev.id;
    const isSnmpEnabled = dev.snmpVersion && dev.snmpVersion !== 'none' && dev.snmpVersion !== '';

    return (
        <tr
            key={`${devIdOrPid}-${idx}`}
            className={`transition-colors ${isChecked ? 'bg-blue-950/30 border-l-2 border-blue-500' : 'hover:bg-slate-800/40'}`}
        >
            {/* Checkbox Selection */}
            <td className="py-3 px-3 text-center">
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleSelect(devIdOrPid)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer accent-blue-600"
                />
            </td>

            {/* Device Name */}
            <td className="py-3 px-3 font-bold text-slate-200">{dev.name}</td>

            {/* IP Address */}
            <td className="py-3 px-3 font-mono text-slate-400">{dev.ip}</td>

            {/* MAC Address */}
            <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{dev.mac || '-'}</td>

            {/* Type & Port Capacity */}
            <td className="py-3 px-3">
                <div className="flex items-center gap-1.5">
                    <span className="text-slate-300 font-medium capitalize">{dev.type || 'Endpoint'}</span>
                    {(dev.type?.toLowerCase() === 'switch' || dev.type?.toLowerCase() === 'firewall') && dev.port && (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {(() => {
                                try {
                                    if (String(dev.port).startsWith('{')) {
                                        const p = JSON.parse(dev.port);
                                        const total = (Number(p.rj45 || 0) + Number(p.sfp || 0) + Number(p.sfpPlus || 0) + Number(p.wan || 0) + Number(p.mgmt || 0) + Number(p.ha || 0));
                                        return `${total}P`;
                                    }
                                } catch {}
                                return `${dev.port}P`;
                            })()}
                        </span>
                    )}
                </div>
            </td>

            {/* Vendor */}
            <td className="py-3 px-3 text-slate-300">{dev.vendor}</td>

            {/* Floor / Denah */}
            <td className="py-3 px-3 font-medium text-emerald-400 font-mono">
                {dev.floor || 'Unmapped'}
            </td>

            {/* Physical Location */}
            <td className="py-3 px-3 text-slate-300">
                <span className="inline-flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    <span>{dev.location || 'Belum ditentukan'}</span>
                </span>
            </td>

            {/* SNMP Status */}
            <td className="py-3 px-3 text-center">
                {isSnmpEnabled ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        ON ({dev.snmpVersion})
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-500 border border-slate-700">
                        OFF
                    </span>
                )}
            </td>

            {/* Polling Control Task */}
            <td className="py-3 px-3 text-center">
                <button
                    onClick={() => onTogglePolling(devIdOrPid)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all border ${
                        !isPollingDisabled
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-slate-800/80 text-slate-500 border-slate-700 hover:bg-slate-700/80 hover:text-slate-300'
                    }`}
                    title={!isPollingDisabled ? 'Polling Aktif - Klik untuk Matikan/Pause' : 'Polling Dimatikan - Klik untuk Aktifkan'}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${!isPollingDisabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    <span>{!isPollingDisabled ? 'POLLING ON' : 'MUTED'}</span>
                </button>
            </td>

            {/* Operational Status & RCA */}
            <td className="py-3 px-3">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            dev.status === 'UP'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : dev.status === 'WARNING'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}
                    >
                        ● {dev.status}
                    </span>
                    {dev.rca?.isRootCause && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-rose-950 text-rose-300 border border-rose-500 animate-pulse" title={`Akar Masalah: ${dev.rca.impactCount} node turunan terdampak`}>
                            🔥 ROOT CAUSE
                        </span>
                    )}
                    {dev.rca?.classification === 'CASCADING_DOWN' && (
                        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-semibold bg-amber-950 text-amber-300 border border-amber-600/60" title={`Terputus akibat parent switch down: ${dev.rca.rootCauseDevice?.HOSTNAME || 'Uplink'}`}>
                            ⛓️ CASCADING
                        </span>
                    )}
                </div>
            </td>

            {/* Actions */}
            <td className="py-3 px-3 text-right">
                <div className="flex items-center justify-end gap-1 text-slate-400">
                    <button
                        onClick={() => onEditDevice(dev)}
                        className="p-1.5 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Perangkat"
                    >
                        <Wrench className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onDeleteDevice(dev)}
                        className="p-1.5 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Hapus Perangkat"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </td>
        </tr>
    );
}
