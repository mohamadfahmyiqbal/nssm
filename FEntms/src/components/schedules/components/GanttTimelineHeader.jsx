import React from 'react';

export default function GanttTimelineHeader({
    groupBy,
    timelineDays,
    daysRange,
    dailyStats,
    toDateKey,
    formatDuration,
    dayColumnWidth = 110
}) {
    return (
        <div className="flex border-b border-slate-800 bg-slate-950/95 sticky top-0 z-30 min-w-max">
            {/* Left Fixed Info Columns Header (Sticky Left) */}
            <div className="w-80 flex-shrink-0 grid grid-cols-12 border-r border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider py-2.5 px-3 bg-slate-950 sticky left-0 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                <div className="col-span-8">
                    {groupBy === 'DETAIL' ? 'Item Pengecekan & Perangkat' : 'Sub Kategori'}
                </div>
                <div className="col-span-4 text-right">Total Event</div>
            </div>

            {/* Timeline Days Header (Fixed Column Width) */}
            <div className="flex">
                {timelineDays.map((day, idx) => {
                    const isToday = new Date().toDateString() === day.toDateString();
                    const dayOfWeek = day.getDay();
                    const isSunday = dayOfWeek === 0;
                    const isSaturday = dayOfWeek === 6;

                    const dateKey = toDateKey(day);
                    const dayStat = dailyStats[dateKey] || { totalMinutes: 0, count: 0 };
                    const hasSchedule = dayStat.count > 0;

                    return (
                        <div
                            key={idx}
                            style={{ width: `${dayColumnWidth}px` }}
                            className={`flex-shrink-0 border-r border-slate-800/60 py-1.5 px-1 text-center flex flex-col items-center justify-between transition-colors min-h-[58px] ${
                                isToday 
                                    ? 'bg-blue-600/20 text-blue-300 font-bold border-b-2 border-blue-500' 
                                    : isSunday
                                        ? 'bg-rose-950/30 text-rose-400 border-b border-rose-500/40'
                                        : isSaturday
                                            ? 'bg-amber-950/25 text-amber-400 border-b border-amber-500/40'
                                            : 'text-slate-400'
                            }`}
                        >
                            <div className="flex flex-col items-center leading-none">
                                <span className={`text-[9px] uppercase font-mono font-semibold ${
                                    isSunday ? 'text-rose-400' : isSaturday ? 'text-amber-400' : ''
                                }`}>
                                    {day.toLocaleDateString('id-ID', { weekday: 'short' })}
                                </span>
                                <span className={`text-[11px] font-bold mt-0.5 ${
                                    isToday ? 'text-blue-400' : isSunday ? 'text-rose-300' : isSaturday ? 'text-amber-300' : ''
                                }`}>
                                    {day.getDate()}
                                </span>
                                <span className="text-[8px] text-slate-500">
                                    {day.toLocaleDateString('id-ID', { month: 'short' })}
                                </span>
                            </div>

                            {/* Total Jam Schedule Badge */}
                            <div className="mt-1">
                                {hasSchedule ? (
                                    <span 
                                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm border ${
                                            isToday
                                                ? 'bg-blue-500/30 text-blue-200 border-blue-400/50'
                                                : isSunday
                                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                                    : isSaturday
                                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                        }`}
                                        title={`Total: ${formatDuration(dayStat.totalMinutes)} (${dayStat.count} schedule)`}
                                    >
                                        {formatDuration(dayStat.totalMinutes)}
                                    </span>
                                ) : (
                                    <span className="text-[8px] font-mono text-slate-600/70 select-none">
                                        -
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
