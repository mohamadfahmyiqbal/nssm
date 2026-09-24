import React from 'react';
import { Handle, Position } from 'reactflow';

export default function NodePortItem({
    portNum,
    meta,
    isUp,
    portAlias,
    portTrafficSummary,
    portLoadColor,
    portGlow,
    portTextColor,
    isTopRow
}) {
    return (
        <div
            key={`port-${portNum}`}
            className={`relative w-full aspect-square rounded-[3px] border transition-all group/port flex items-center justify-center ${
                isUp ? `${portLoadColor} ${portGlow} z-10` : portLoadColor
            }`}
            title={`Port ${portNum} (${meta.typeName || 'GE'})${portAlias} ${
                isUp ? '(UP' + portTrafficSummary + ')' : '(DOWN)'
            }`}
        >
            <span className={`text-[6.5px] font-mono select-none pointer-events-none leading-none ${portTextColor}`}>
                {meta.label || portNum}
            </span>

            {/* Handle target & source Top */}
            <Handle
                type="target"
                position={Position.Top}
                id={`p-top-${portNum}`}
                isConnectable={true}
                className="!w-full !h-full !min-w-0 !min-h-0 !border-0 !m-0 !transform-none !left-0 !top-0 !rounded-none !bg-transparent group-hover/port:!bg-blue-400/20 z-10"
                style={{ position: 'absolute' }}
            />
            <Handle
                type="source"
                position={Position.Top}
                id={`s-p-top-${portNum}`}
                isConnectable={true}
                className="!w-full !h-full !min-w-0 !min-h-0 !border-0 !m-0 !transform-none !left-0 !top-0 !rounded-none !bg-transparent group-hover/port:!bg-blue-400/40 cursor-crosshair z-20"
                style={{ position: 'absolute' }}
            />

            {/* Handle target & source Bottom */}
            <Handle
                type="target"
                position={Position.Bottom}
                id={`p-${portNum}`}
                isConnectable={true}
                className="!w-full !h-full !min-w-0 !min-h-0 !border-0 !m-0 !transform-none !left-0 !top-0 !rounded-none !bg-transparent group-hover/port:!bg-blue-400/20 z-10"
                style={{ position: 'absolute' }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id={`s-p-${portNum}`}
                isConnectable={true}
                className="!w-full !h-full !min-w-0 !min-h-0 !border-0 !m-0 !transform-none !left-0 !top-0 !rounded-none !bg-transparent group-hover/port:!bg-blue-400/40 cursor-crosshair z-20"
                style={{ position: 'absolute' }}
            />
        </div>
    );
}
