import React from 'react';
import InventoryTableRow from './InventoryTableRow';

export default function InventoryTableList({
    devices = [],
    selectedIds = [],
    isAllSelected = false,
    onSelectAll,
    onToggleSelect,
    disabledPollingMap = {},
    onTogglePolling,
    onEditDevice,
    onDeleteDevice
}) {
    return (
        <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-left border-collapse text-xs">
                <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px] sticky top-0 bg-slate-900 z-10">
                        <th className="pb-3 px-3 w-10 text-center">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={onSelectAll}
                                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer accent-blue-600"
                                title="Select All / Unselect All"
                            />
                        </th>
                        <th className="pb-3 px-3">Device Name</th>
                        <th className="pb-3 px-3">IP Address</th>
                        <th className="pb-3 px-3">MAC Address</th>
                        <th className="pb-3 px-3">Type / Ports</th>
                        <th className="pb-3 px-3">Vendor</th>
                        <th className="pb-3 px-3">Floor / Denah</th>
                        <th className="pb-3 px-3">Titik Lokasi Denah</th>
                        <th className="pb-3 px-3 text-center">SNMP</th>
                        <th className="pb-3 px-3 text-center">Polling Task</th>
                        <th className="pb-3 px-3">Status</th>
                        <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                    {devices.length === 0 ? (
                        <tr>
                            <td colSpan="12" className="py-8 text-center text-slate-500 font-mono">
                                Tidak ada perangkat yang sesuai dengan filter / pencarian.
                            </td>
                        </tr>
                    ) : (
                        devices.map((dev, idx) => {
                            const devIdOrPid = dev.PID || dev.id;
                            const isChecked = selectedIds.includes(devIdOrPid);
                            const isPollingDisabled = !!(
                                disabledPollingMap[devIdOrPid] ||
                                disabledPollingMap[dev.ip] ||
                                disabledPollingMap[dev.name]
                            );

                            return (
                                <InventoryTableRow
                                    key={`${devIdOrPid}-${idx}`}
                                    dev={dev}
                                    idx={idx}
                                    isChecked={isChecked}
                                    onToggleSelect={onToggleSelect}
                                    isPollingDisabled={isPollingDisabled}
                                    onTogglePolling={onTogglePolling}
                                    onEditDevice={onEditDevice}
                                    onDeleteDevice={onDeleteDevice}
                                />
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
