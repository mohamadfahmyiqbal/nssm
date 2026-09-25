import React from 'react';
import {
    Briefcase,
    Clock,
    CheckCircle2,
    Calendar,
    AlertTriangle,
    PauseCircle,
    Inbox,
    CalendarCheck,
    AlertOctagon
} from 'lucide-react';

export default function WorkOrderStatsCards({ stats = {}, selectedDate }) {
    const cards = [
        {
            id: 'open',
            title: 'Open Backlog',
            value: stats.open || 0,
            color: 'text-sky-400',
            bgColor: 'bg-sky-500/10',
            borderColor: 'border-sky-500/20',
            icon: Inbox
        },
        {
            id: 'scheduled',
            title: 'Scheduled',
            value: stats.scheduled || 0,
            color: 'text-indigo-400',
            bgColor: 'bg-indigo-500/10',
            borderColor: 'border-indigo-500/20',
            icon: CalendarCheck
        },
        {
            id: 'inProgress',
            title: 'In Progress',
            value: stats.inProgress || 0,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
            icon: Clock
        },
        {
            id: 'pending',
            title: 'Pending / On-Hold',
            value: stats.pending || 0,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20',
            icon: PauseCircle
        },
        {
            id: 'resolved',
            title: 'Resolved / Done',
            value: stats.resolved || 0,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20',
            icon: CheckCircle2
        },
        {
            id: 'overdue',
            title: 'Overdue / Breached',
            value: stats.overdue || 0,
            color: 'text-rose-400',
            bgColor: 'bg-rose-500/10',
            borderColor: 'border-rose-500/20',
            icon: AlertOctagon
        },
        {
            id: 'totalToday',
            title: 'Total Today',
            value: stats.totalToday || 0,
            color: 'text-cyan-300',
            bgColor: 'bg-cyan-500/10',
            borderColor: 'border-cyan-500/30',
            icon: Briefcase,
            highlight: true
        }
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <div
                        key={card.id}
                        className={`bg-slate-900/90 border rounded-xl p-3 flex flex-col justify-between shadow-lg transition-all ${
                            card.highlight 
                                ? 'border-cyan-500/40 bg-gradient-to-br from-slate-900/90 to-cyan-950/30 shadow-cyan-950/20' 
                                : 'border-slate-800/90 hover:border-slate-700'
                        }`}
                    >
                        <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                                {card.title}
                            </span>
                            <div className={`p-1.5 rounded-lg border ${card.bgColor} ${card.color} ${card.borderColor} flex-shrink-0`}>
                                <Icon className="w-3.5 h-3.5" />
                            </div>
                        </div>

                        <div className="mt-2 flex items-baseline justify-between">
                            <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${card.color}`}>
                                {card.value}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
