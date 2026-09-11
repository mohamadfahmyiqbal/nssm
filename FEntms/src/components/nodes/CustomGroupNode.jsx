import React, { memo } from 'react';
import { Layers } from 'lucide-react';

function CustomGroupNode({ data, selected }) {
    return (
        <div className={`w-full h-full bg-slate-900/20 border-2 border-dashed rounded-xl transition-all duration-200 ${selected ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)] bg-blue-900/10' : 'border-slate-600/50 hover:border-slate-500/80'}`}>
            <div className="absolute -top-3 left-3 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-700 flex items-center gap-1.5 shadow-md">
                <Layers className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] font-bold font-mono text-slate-300">{data.label || 'Group'}</span>
            </div>
            {/* The child nodes will be rendered within the bounds of this group by React Flow natively when parentNode is set */}
        </div>
    );
}

export default memo(CustomGroupNode);
