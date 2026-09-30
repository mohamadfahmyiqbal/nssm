import React from 'react';

export default function GanttRowItem({
    row,
    groupBy,
    timelineDays,
    daysRange,
    unitOverrides,
    setUnitOverrides,
    defaultUnitCount,
    calculateBarPosition,
    getStatusBadge,
    formatDate,
    formatDuration,
    dayColumnWidth = 110
}) {
    const totalTrackWidth = timelineDays.length * dayColumnWidth;

    return (
        <div className="flex hover:bg-slate-800/30 transition-colors group relative items-center min-h-[56px] min-w-max">
            {/* Left Fixed Column (Sticky Left) */}
            <div className="w-80 flex-shrink-0 grid grid-cols-12 border-r border-slate-800/80 px-3 py-2 items-center text-xs bg-slate-900 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] group-hover:bg-slate-850">
                <div className="col-span-8 flex flex-col pr-2 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100 truncate text-xs" title={row.title}>
                            {row.title}
                        </span>
                        {row.isDaily ? (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex-shrink-0" title="Item Pengecekan Harian (Daily)">
                                DAILY
                            </span>
                        ) : row.periodik ? (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 flex-shrink-0" title={`Periodik: ${row.periodik}`}>
                                {row.periodik}
                            </span>
                        ) : null}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono truncate" title={row.subtitle}>
                        {row.subtitle}
                    </span>
                </div>
                <div className="col-span-4 flex items-center justify-end gap-1.5">
                    {/* Input Unit: Tampil baik di mode DETAIL maupun mode SUBKATEGORI */}
                    {groupBy === 'DETAIL' && row.check_id ? (
                        <div className="flex items-center gap-1" title="Kustomisasi jumlah unit item ini">
                            <span className="text-[9px] text-slate-500 font-mono">Unit:</span>
                            <input
                                type="number"
                                min="1"
                                max="999"
                                value={unitOverrides[row.check_id] != null ? unitOverrides[row.check_id] : defaultUnitCount}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setUnitOverrides(prev => ({
                                        ...prev,
                                        [row.check_id]: isNaN(val) || val < 1 ? 1 : val
                                    }));
                                }}
                                className="w-9 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-center text-[10px] font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                    ) : groupBy === 'SUBKATEGORI' && row.subKategori ? (
                        <div className="flex items-center gap-1" title={`Kustomisasi jumlah unit untuk seluruh subkategori ${row.subKategori}`}>
                            <span className="text-[9px] text-slate-500 font-mono">Unit:</span>
                            <input
                                type="number"
                                min="1"
                                max="999"
                                value={unitOverrides[row.subKategori] != null ? unitOverrides[row.subKategori] : defaultUnitCount}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setUnitOverrides(prev => ({
                                        ...prev,
                                        [row.subKategori]: isNaN(val) || val < 1 ? 1 : val
                                    }));
                                }}
                                className="w-9 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-center text-[10px] font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                    ) : null}
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        {row.schedules.length}
                    </span>
                </div>
            </div>

            {/* Right Timeline Bar Track (Fixed width per day column) */}
            <div 
                style={{ width: `${totalTrackWidth}px` }} 
                className="relative min-h-[72px] flex items-center py-1.5 bg-slate-950/20 flex-shrink-0"
            >
                {/* Grid vertical lines for days */}
                <div className="absolute inset-0 flex pointer-events-none">
                    {timelineDays.map((day, idx) => {
                        const isToday = new Date().toDateString() === day.toDateString();
                        const dayOfWeek = day.getDay();
                        const isSunday = dayOfWeek === 0;
                        const isSaturday = dayOfWeek === 6;
                        return (
                            <div 
                                key={idx} 
                                style={{ width: `${dayColumnWidth}px` }}
                                className={`border-r border-slate-800/30 h-full flex-shrink-0 ${
                                    isToday 
                                        ? 'bg-blue-500/5' 
                                        : isSunday 
                                            ? 'bg-rose-500/[0.07]' 
                                            : isSaturday 
                                                ? 'bg-amber-500/[0.05]' 
                                                : ''
                                }`}
                            />
                        );
                    })}
                </div>

                {/* Render Gantt Bars: Dikelompokkan per tanggal dan dipisah antara DAILY & PERIODIK */}
                {(() => {
                    // Kelompokkan schedule milik baris ini berdasarkan tanggal
                    const groupedByDate = {};
                    row.schedules.forEach(schedule => {
                        const eventDate = schedule.tanggal;
                        const dateKey = eventDate ? eventDate.split('T')[0] : '';
                        if (!dateKey) return;
                        if (!groupedByDate[dateKey]) {
                            groupedByDate[dateKey] = [];
                        }
                        groupedByDate[dateKey].push(schedule);
                    });

                    return Object.entries(groupedByDate).flatMap(([dateKey, schedList]) => {
                        const barPos = calculateBarPosition(dateKey);
                        if (!barPos || barPos.isOutOfView) return [];

                        // Pisahkan list schedule menjadi 2 grup: DAILY dan PERIODIK
                        const dailyItems = [];
                        const periodicItems = [];

                        schedList.forEach(s => {
                            const pType = (s.periodik_type || '').toUpperCase();
                            const pStr = (s.periodik || '').toUpperCase();
                            const isDaily = pType.includes('DAILY') || pType.includes('HARIAN') || pStr.includes('DAILY') || pStr.includes('HARIAN') || pStr.includes('1 HARI') || pStr.includes('SETIAP HARI');
                            if (isDaily) {
                                dailyItems.push(s);
                            } else {
                                periodicItems.push(s);
                            }
                        });

                        const cardGroups = [];
                        if (dailyItems.length > 0) {
                            cardGroups.push({ type: 'DAILY', list: dailyItems });
                        }
                        if (periodicItems.length > 0) {
                            cardGroups.push({ type: 'PERIODIC', list: periodicItems });
                        }

                        const hasBoth = cardGroups.length > 1;

                        return cardGroups.map((group, groupIdx) => {
                            const isDailyGroup = group.type === 'DAILY';
                            const primarySched = group.list.find(s => {
                                const st = (s.status || '').toUpperCase();
                                return st.includes('ACTUAL') || st.includes('COMPLET') || st === 'DONE';
                            }) || group.list[0];

                            const badge = getStatusBadge(primarySched.status, primarySched.legend);

                            let groupTotalMinutes = 0;
                            let groupBaseCycleSum = 0;
                            let totalUnitApplied = 0;
                            const itemDetails = [];

                            group.list.forEach(s => {
                                const subCat = (s.standardMaintenance?.subKategori || 'Lainnya').trim();
                                let itemUnit = defaultUnitCount;
                                if (unitOverrides[s.check_id] != null) {
                                    itemUnit = unitOverrides[s.check_id];
                                } else if (unitOverrides[subCat] != null) {
                                    itemUnit = unitOverrides[subCat];
                                }
                                itemUnit = Math.max(1, Number(itemUnit) || 1);
                                totalUnitApplied += itemUnit;

                                const baseMins = s.cycle_time_minutes != null ? Number(s.cycle_time_minutes) : 60;
                                groupBaseCycleSum += baseMins;
                                const itemMins = baseMins * itemUnit;
                                groupTotalMinutes += itemMins;

                                const rawKategori = s.standardMaintenance?.kategori || row.kategori || 'Hardware';
                                const kategoriLabel = rawKategori.toUpperCase().includes('SOFT') ? 'Software HW' : 'Hardware';
                                const periodTag = isDailyGroup ? 'Daily' : (s.periodik || 'Periodic');

                                itemDetails.push(`• [${kategoriLabel}] [${periodTag}] ${s.pengecekan || s.standardMaintenance?.namaPerangkat || 'Pengecekan'} (${baseMins} mnt/unit × ${itemUnit} unit)`);
                            });

                            const isMultiple = group.list.length > 1;
                            const mainTitle = isMultiple
                                ? `${group.list.length} Checklists`
                                : (primarySched.standardMaintenance?.namaPerangkat || primarySched.pengecekan || 'Checklist');

                            const tooltipContent = [
                                `════════════════════════════════════`,
                                `TIPE: ${isDailyGroup ? '⚡ JADWAL HARIAN (DAILY)' : '📅 JADWAL PERIODIK BERKALA'}`,
                                `Sub Kategori: ${row.subKategori || row.title || '-'}`,
                                `Tanggal: ${formatDate(dateKey)}`,
                                `Status: ${primarySched.status || 'PLAN'}`,
                                `Total Item Checklist: ${group.list.length} item`,
                                `Total Unit Dihitung: ${totalUnitApplied} unit`,
                                `Total Cycle Time Master: ${groupBaseCycleSum} Menit (${formatDuration(groupBaseCycleSum)})`,
                                `Total Estimasi Waktu Aktual: ${formatDuration(groupTotalMinutes)}`,
                                `════════════════════════════════════`,
                                `Rincian Item Pengecekan:`,
                                ...itemDetails
                            ].join('\n');

                            // Styling visual card premium
                            const cardBg = isDailyGroup
                                ? 'bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-slate-900/90 border-purple-500/50 text-white shadow-lg shadow-purple-950/40 hover:border-purple-300'
                                : 'bg-gradient-to-r from-blue-900/90 via-cyan-950/90 to-slate-900/90 border-cyan-500/40 text-white shadow-lg shadow-blue-950/40 hover:border-cyan-300';

                            // Posisi top/height jika ada kedua card pada hari yang sama
                            let positionStyle = {
                                left: barPos.left,
                                width: barPos.width,
                            };

                            if (hasBoth) {
                                if (groupIdx === 0) {
                                    // Card atas (Daily)
                                    positionStyle = {
                                        ...positionStyle,
                                        top: '4px',
                                        height: '29px',
                                    };
                                } else {
                                    // Card bawah (Periodic)
                                    positionStyle = {
                                        ...positionStyle,
                                        bottom: '4px',
                                        height: '29px',
                                    };
                                }
                            } else {
                                positionStyle = {
                                    ...positionStyle,
                                    height: '36px',
                                };
                            }

                            return (
                                <div
                                    key={`${row.key}_${dateKey}_${group.type}`}
                                    style={positionStyle}
                                    className={`absolute rounded-lg border flex flex-col justify-center px-2 z-10 cursor-pointer transition-all hover:scale-105 hover:z-30 hover:shadow-2xl ${cardBg}`}
                                    title={tooltipContent}
                                >
                                    {/* Baris 1: Header Badge + Judul Item */}
                                    <div className="flex items-center justify-between gap-1 leading-none w-full overflow-hidden">
                                        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                                            <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded tracking-wider flex-shrink-0 ${
                                                isDailyGroup 
                                                    ? 'bg-purple-500 text-white shadow-sm' 
                                                    : 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                                            }`}>
                                                {isDailyGroup ? 'DAILY' : (primarySched.periodik || 'PERIODIK')}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-100 truncate drop-shadow-sm select-none" title={mainTitle}>
                                                {mainTitle}
                                            </span>
                                        </div>

                                        {/* Total Jam Badge */}
                                        <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border select-none flex-shrink-0 ${
                                            isDailyGroup
                                                ? 'bg-purple-950/80 text-purple-200 border-purple-400/40'
                                                : 'bg-cyan-950/80 text-cyan-200 border-cyan-400/40'
                                        }`}>
                                            {formatDuration(groupTotalMinutes)}
                                        </span>
                                    </div>

                                    {/* Baris 2: Sub-info jika card single / tinggi cukup */}
                                    {!hasBoth && (
                                        <div className="flex items-center justify-between text-[8px] text-slate-300/80 font-mono mt-0.5 pt-0.5 border-t border-white/10 w-full overflow-hidden leading-none">
                                            <span className="truncate">{group.list.length} item checklist</span>
                                            <span className="text-amber-300 font-semibold flex-shrink-0">{groupBaseCycleSum}m/u</span>
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    });
                })()}
            </div>
        </div>
    );
}
