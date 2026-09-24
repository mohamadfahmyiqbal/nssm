import React from 'react';
import { Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';

export default function DevicePredictiveHealthCard({ predictionData }) {
    if (!predictionData?.health) return null;

    const { health, predictions } = predictionData;
    const gradeBadgeColor =
        health.grade === 'EXCELLENT' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
        health.grade === 'GOOD' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
        health.grade === 'FAIR' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
        'bg-rose-500/20 text-rose-300 border-rose-500/40';

    return (
        <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-950/60 p-3.5 rounded-xl border border-indigo-500/30 shadow-inner space-y-2.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[10px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>AI PREDICTIVE HEALTH</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${gradeBadgeColor}`}>
                    {health.healthScore}% • {health.grade}
                </span>
            </div>

            {/* Forecast Alert if exists */}
            {predictions?.temperature?.predictedMinutesToCritical !== null && (
                <div className="bg-amber-950/50 border border-amber-500/40 p-2 rounded-lg text-[9.5px] text-amber-200 flex items-start gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold">Prediksi Overheat: </span>
                        Suhu diproyeksikan mencapai &gt;65°C dalam ~{predictions.temperature.predictedMinutesToCritical} menit (R²: {predictions.temperature.confidenceR2}).
                    </div>
                </div>
            )}

            {health.deductions?.length > 0 ? (
                <div className="text-[9px] text-slate-400 space-y-0.5">
                    <span className="font-bold text-slate-500 block">Faktor Penalti:</span>
                    {health.deductions.map((d, i) => (
                        <div key={i} className="text-slate-300 flex items-center gap-1">
                            <span className="text-rose-400">•</span> {d}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-[9px] text-emerald-400/90 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Perilaku metrik stabil, tidak ada anomali terdeteksi.</span>
                </div>
            )}
        </div>
    );
}
