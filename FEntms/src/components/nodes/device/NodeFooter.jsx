import React from 'react';

export default function NodeFooter({ data, theme }) {
    return (
        <div className="mt-3 pt-2.5 border-t border-slate-700/50 text-[9px] font-bold text-slate-400 flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 font-mono text-[9px] truncate max-w-[160px]">
                {data.model && data.model !== 'N/A' ? (
                    <span className="text-slate-200 font-semibold truncate" title={data.model}>
                        {data.model}
                    </span>
                ) : (
                    <span className="text-slate-500">{data.category?.toUpperCase() || 'SWITCH'}</span>
                )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                <span className={`tracking-wider font-mono text-[9.5px] ${theme.text}`}>{theme.label}</span>
                <span className="relative flex w-2 h-2">
                    {theme.pulse && (
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.dot}`}></span>
                    )}
                    <span className={`relative inline-flex rounded-full w-2 h-2 ${theme.dot}`}></span>
                </span>
            </div>
        </div>
    );
}
