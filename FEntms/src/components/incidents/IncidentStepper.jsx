import React from 'react';

export default function IncidentStepper({ stages, currentStep, setCurrentStep }) {
    return (
        <div className="bg-slate-950/70 border border-slate-800/90 p-2 rounded-xl">
            <div className="grid grid-cols-5 gap-1.5">
                {stages.map((stage) => {
                    const Icon = stage.icon;
                    const isActive = currentStep === stage.id;
                    return (
                        <button
                            key={stage.id}
                            type="button"
                            onClick={() => setCurrentStep(stage.id)}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all text-center ${
                                isActive
                                    ? 'bg-blue-600/20 border border-blue-500 text-blue-400 shadow-md ring-1 ring-blue-500/30'
                                    : 'bg-slate-900/50 border border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                            }`}
                        >
                            <Icon className="w-4 h-4 mb-1" />
                            <span className="text-[10px] font-bold font-mono truncate w-full">
                                {stage.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
