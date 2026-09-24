import React from 'react';
import {
    Clock,
    User,
    Plus,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    ChevronRight,
    Users,
    Coffee,
    Download
} from 'lucide-react';
import { generateTechnicianWorkOrderPDF } from '../../utils/technicianWorkOrderPdfGenerator';
import { showToast } from '../../utils/swal';

const HOURS = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00'
];

export default function DailyTimelineScheduler({
    technicians,
    workOrders,
    scheduleBreaks = [],
    selectedDate,
    onSlotClick,
    onSlotDrop,
    onWoClick,
    onBreakClick,
    onOpenAddBreak
}) {
    // Total menit dari 08:00 sampai 17:00 = 9 jam = 540 menit
    const START_MINUTES = 8 * 60; // 480 menit
    const TOTAL_MINUTES = 9 * 60; // 540 menit

    // Helper konversi time 'HH:mm' ke total menit dari 00:00
    const timeToMinutes = (timeStr) => {
        if (!timeStr) return START_MINUTES;
        const [h, m] = timeStr.split(':').map(Number);
        return (h || 8) * 60 + (m || 0);
    };

    // Format minutes ke 'HH:mm'
    const minutesToTime = (mins) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const calculateBlockPosition = (startTime = '08:00', endTime = '08:30') => {
        const startMins = Math.max(START_MINUTES, Math.min(START_MINUTES + TOTAL_MINUTES, timeToMinutes(startTime)));
        let endMins = Math.max(START_MINUTES, Math.min(START_MINUTES + TOTAL_MINUTES, timeToMinutes(endTime)));
        if (endMins <= startMins) endMins = Math.min(START_MINUTES + TOTAL_MINUTES, startMins + 5);

        const leftPercent = ((startMins - START_MINUTES) / TOTAL_MINUTES) * 100;
        // Minimum width 1.8% agar tugas durasi pendek tetap terlihat dan bisa diklik
        const widthPercent = Math.max(1.8, ((endMins - startMins) / TOTAL_MINUTES) * 100);

        return {
            left: `${leftPercent}%`,
            width: `${widthPercent}%`
        };
    };

    return (
        <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
            {/* Timeline Header Info Bar */}
            <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-xs">Visual Timeline Jadwal Harian Teknisi (Presisi 5 Menit • 08:00 - 17:00 WIB)</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-blue-500/30 border border-blue-500" />
                        <span className="text-slate-300 text-[11px]">Preventive Maintenance</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-500" />
                        <span className="text-slate-300 text-[11px]">Incident Trouble</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-500" />
                        <span className="text-amber-300 text-[11px] font-semibold">Waktu Istirahat (Break)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500" />
                        <span className="text-slate-300 text-[11px]">Selesai (Resolved)</span>
                    </div>
                    {onOpenAddBreak && (
                        <button
                            onClick={onOpenAddBreak}
                            className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded-md font-sans text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                            <Coffee className="w-3.5 h-3.5 text-amber-400" />
                            <span>+ Istirahat</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable Timeline Grid */}
            <div className="overflow-x-auto overflow-y-auto flex-1 p-4">
                <div className="min-w-[1000px] flex flex-col">
                    {/* Time Header Scale with 5-Minute Sub Markers */}
                    <div className="flex border-b border-slate-800 pb-2 mb-2 font-mono text-[11px] text-slate-400">
                        <div className="w-48 flex-shrink-0 px-3 font-semibold text-slate-300">
                            Teknisi / Man Power
                        </div>
                        <div className="flex-1 grid grid-cols-9 text-center border-l border-slate-800/80">
                            {HOURS.slice(0, 9).map((hour, idx) => (
                                <div key={idx} className="border-r border-slate-800/60 px-1 py-0.5 relative">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 px-1">
                                        <span>{hour}</span>
                                        <span className="text-[8px] text-slate-600">:30</span>
                                    </div>
                                    {/* 5-minute ticks */}
                                    <div className="flex justify-between px-1 mt-1 opacity-30">
                                        {[...Array(12)].map((_, tickIdx) => (
                                            <div
                                                key={tickIdx}
                                                className={`w-0.5 bg-slate-400 ${tickIdx % 6 === 0 ? 'h-2 bg-cyan-400 opacity-80' : tickIdx % 3 === 0 ? 'h-1.5' : 'h-1'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Teknisi Rows */}
                    <div className="flex flex-col gap-2.5">
                        {technicians.map((tech) => {
                            const techNik = String(tech.nik || tech.NIK || '').trim();
                            const techName = String(tech.nama || tech.NAMA || '').trim().toLowerCase();

                            // Filter WO yang ditugaskan ke teknisi ini pada tanggal aktif (PIC Utama & Helper)
                            const techWos = workOrders.filter(w => {
                                const wNik = String(w.assignedTechnicianNik || '').trim();
                                const wName = String(w.assignedTechnicianName || '').trim().toLowerCase();
                                const isPic = (techNik && wNik === techNik) || (techName && wName === techName);

                                let isHelper = false;
                                let membersList = [];
                                if (w.teamMembersJson) {
                                    try { membersList = JSON.parse(w.teamMembersJson); } catch (e) {}
                                } else if (Array.isArray(w.teamMembers)) {
                                    membersList = w.teamMembers;
                                }
                                if (Array.isArray(membersList)) {
                                    isHelper = membersList.some(m => {
                                        const mNik = String(m.nik || m.NIK || '').trim();
                                        const mName = String(m.name || m.nama || m.NAMA || '').trim().toLowerCase();
                                        return (techNik && mNik === techNik) || (techName && mName === techName);
                                    });
                                }

                                return isPic || isHelper;
                            });

                            // Filter Waktu Istirahat yang berlaku untuk teknisi ini (Global ALL atau Spesifik NIK)
                            const techBreaks = scheduleBreaks.filter(b => {
                                const bNik = String(b.technicianNik || 'ALL').trim();
                                return bNik === 'ALL' || (techNik && bNik === techNik);
                            });

                            const totalWoMinutes = Math.round(techWos.reduce((sum, w) => sum + (parseFloat(w.estimatedHours) || 0) * 60, 0));
                            const totalBreakMinutes = Math.round(techBreaks.reduce((sum, b) => sum + (parseInt(b.durationMinutes, 10) || 0), 0));

                            return (
                                <div
                                    key={techNik || tech.id}
                                    className="flex items-stretch bg-slate-950/60 border border-slate-800/90 rounded-xl hover:border-slate-700 transition-all min-h-[76px]"
                                >
                                    {/* Tech Card Left Column */}
                                    <div className="w-48 flex-shrink-0 p-3 bg-slate-900/60 border-r border-slate-800/80 rounded-l-xl flex flex-col justify-center">
                                        <div className="flex items-center justify-between gap-1">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center text-xs shadow-inner flex-shrink-0">
                                                    {(tech.nama || tech.NAMA || 'T').charAt(0)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-bold text-slate-100 text-xs truncate">
                                                        {tech.nama || tech.NAMA}
                                                    </div>
                                                    <div className="text-[10px] font-mono text-slate-500">
                                                        NIK: {techNik}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        generateTechnicianWorkOrderPDF({
                                                            technician: {
                                                                nik: techNik,
                                                                name: tech.nama || tech.NAMA,
                                                                dept: tech.dept || tech.DEPT
                                                            },
                                                            workOrders,
                                                            scheduleBreaks,
                                                            selectedDate
                                                        });
                                                        showToast('success', `PDF Work Order untuk ${tech.nama || tech.NAMA} berhasil diunduh.`);
                                                    } catch (err) {
                                                        console.error('PDF error:', err);
                                                        showToast('error', 'Gagal mengunduh PDF Work Order.');
                                                    }
                                                }}
                                                title={`Download PDF Lembar Kerja & Surat Perintah Kerja untuk ${tech.nama || tech.NAMA}`}
                                                className="p-1.5 bg-slate-800/80 hover:bg-blue-600 hover:text-white text-slate-400 border border-slate-700/80 rounded-lg transition-all flex-shrink-0 shadow-sm"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                                            <span>{techWos.length} Tugas</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-cyan-400 font-semibold" title="Total Durasi Tugas">
                                                    {totalWoMinutes}m
                                                </span>
                                                {totalBreakMinutes > 0 && (
                                                    <span className="text-amber-400/90 font-medium" title="Total Waktu Istirahat">
                                                        ☕{totalBreakMinutes}m
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline Slots Grid (9 Jam x 12 Sub-slots = 108 Sub-slots @ 5 menit) */}
                                    <div className="flex-1 relative grid grid-cols-9 divide-x divide-slate-800/40 min-h-[68px] bg-slate-950/20">
                                        {/* Background Slot click & Drag-Drop triggers per jam dengan 12 sub-slot per 5 menit */}
                                        {HOURS.slice(0, 9).map((hour, hourIdx) => {
                                            const baseHourMins = (8 + hourIdx) * 60;

                                            return (
                                                <div
                                                    key={hourIdx}
                                                    className="h-full grid grid-cols-12 divide-x divide-slate-800/10 relative"
                                                >
                                                    {[...Array(12)].map((_, subIdx) => {
                                                        const slotStartMins = baseHourMins + (subIdx * 5);
                                                        const slotEndMins = slotStartMins + 30;
                                                        const startStr = minutesToTime(slotStartMins);
                                                        const endStr = minutesToTime(slotEndMins);

                                                        return (
                                                            <div
                                                                key={subIdx}
                                                                onClick={() => onSlotClick(tech, startStr, endStr)}
                                                                onDragOver={(e) => {
                                                                    e.preventDefault();
                                                                    e.dataTransfer.dropEffect = 'copy';
                                                                }}
                                                                onDrop={(e) => {
                                                                    e.preventDefault();
                                                                    try {
                                                                        const rawData = e.dataTransfer.getData('application/json');
                                                                        if (rawData) {
                                                                            const payload = JSON.parse(rawData);
                                                                            if (onSlotDrop) {
                                                                                onSlotDrop(payload, tech, startStr, endStr);
                                                                            }
                                                                        }
                                                                    } catch (err) {
                                                                        console.error('Drag Drop Error:', err);
                                                                    }
                                                                }}
                                                                className="h-full hover:bg-blue-500/25 transition-colors cursor-pointer group flex items-center justify-center relative"
                                                                title={`Klik / Drop untuk alokasi ${tech.nama || tech.NAMA} mulai pukul ${startStr}`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}

                                        {/* Dynamic Schedule Breaks Floating Blocks (Waktu Istirahat) */}
                                        {techBreaks.map((brk) => {
                                            const pos = calculateBlockPosition(brk.startTime || '12:00', brk.endTime || '13:00');
                                            const isGlobal = brk.technicianNik === 'ALL';

                                            return (
                                                <div
                                                    key={`break-${brk.id}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onBreakClick) onBreakClick(brk);
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        left: pos.left,
                                                        width: pos.width,
                                                        top: '4px',
                                                        bottom: '4px'
                                                    }}
                                                    className={`rounded-lg border border-amber-500/60 px-2 py-1 flex flex-col justify-between shadow-lg cursor-pointer hover:brightness-125 transition-all z-20 overflow-hidden bg-gradient-to-r from-amber-950/90 via-slate-900/90 to-amber-950/90 text-amber-200 border-dashed hover:border-solid`}
                                                    title={`Waktu Istirahat: ${brk.label} (${brk.startTime} - ${brk.endTime}) - Klik untuk edit/hapus`}
                                                >
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="font-mono font-bold text-[9px] text-amber-300 flex items-center gap-1 truncate">
                                                            <Coffee className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />
                                                            <span>{brk.startTime} - {brk.endTime}</span>
                                                        </span>
                                                        <span className="text-[8px] font-bold px-1 rounded bg-amber-500/20 text-amber-300 font-mono flex-shrink-0">
                                                            {isGlobal ? 'TIM' : 'INDIVIDU'}
                                                        </span>
                                                    </div>
                                                    <div className="font-semibold text-[11px] text-amber-100 truncate leading-tight mt-0.5">
                                                        {brk.label}
                                                    </div>
                                                    <div className="text-[8px] text-amber-400/80 font-mono truncate">
                                                        {brk.durationMinutes ? `${brk.durationMinutes} Menit` : 'Istirahat'}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Work Order Floating Blocks */}
                                        {techWos.map((wo) => {
                                            const pos = calculateBlockPosition(wo.startTime || '08:00', wo.endTime || '10:00');
                                            const isResolved = wo.status === 'RESOLVED' || wo.status === 'CLOSED';
                                            const isIncident = wo.woType === 'INCIDENT_ANOMALY';

                                            let blockBg = isResolved
                                                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                                                : isIncident
                                                    ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                                                    : 'bg-blue-950/80 border-blue-500/50 text-blue-200';

                                            return (
                                                <div
                                                    key={wo.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onWoClick(wo);
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        left: pos.left,
                                                        width: pos.width,
                                                        top: '6px',
                                                        bottom: '6px'
                                                    }}
                                                    className={`rounded-lg border px-2.5 py-1 flex flex-col justify-between shadow-lg cursor-pointer hover:brightness-125 transition-all z-10 overflow-hidden ${blockBg}`}
                                                    title={`${wo.woNumber}: ${wo.title} (${wo.startTime || '08:00'} - ${wo.endTime || '10:00'})`}
                                                >
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="font-mono font-bold text-[10px] truncate">
                                                            {wo.startTime || '08:00'} - {wo.endTime || '10:00'}
                                                        </span>
                                                        <span className="text-[9px] font-bold px-1 rounded bg-black/40 font-mono">
                                                            {wo.status}
                                                        </span>
                                                    </div>
                                                    <div className="font-semibold text-xs truncate leading-tight mt-0.5">
                                                        {wo.title}
                                                    </div>
                                                    <div className="text-[9px] opacity-75 truncate font-mono">
                                                        {wo.woNumber}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

