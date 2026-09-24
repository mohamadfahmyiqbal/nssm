import React from 'react';

export default function InventoryTablePagination({
    totalCount = 0,
    selectedCount = 0
}) {
    return (
        <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-800/80 pt-3 font-mono">
            <span>
                (Total: {totalCount} Devices {selectedCount > 0 ? `| ${selectedCount} Selected` : ''})
            </span>
            <div className="flex items-center gap-1">
                <button className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold">1</button>
            </div>
        </div>
    );
}
