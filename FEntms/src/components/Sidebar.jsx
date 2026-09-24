import React from 'react';
import { 
    Network, 
    Server, 
    MapPin, 
    FileText, 
    LogOut, 
    Activity,
    AlertTriangle,
    Users,
    Calendar,
    Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ 
    activeTab, 
    setActiveTab, 
    onLogout
}) {
    const { canManageUsers } = useAuth();

    const navItems = [
        { 
            id: 'dashboard', 
            label: 'Topology Canvas', 
            icon: Network,
            badge: 'LIVE'
        },
        { 
            id: 'inventory', 
            label: 'Device Inventory', 
            icon: Server
        },
        { 
            id: 'schedules', 
            label: 'Maintenance Schedule', 
            icon: Calendar,
            badge: 'ITAM'
        },
        { 
            id: 'workorders', 
            label: 'Work Order & Man Power', 
            icon: Briefcase,
            badge: 'TASK'
        },
        { 
            id: 'incidents', 
            label: 'Incident & Anomaly Reports', 
            icon: AlertTriangle,
            badge: 'NEW'
        },
        { 
            id: 'mapping', 
            label: 'Location Mapping', 
            icon: MapPin
        },
        { 
            id: 'reports', 
            label: 'Reports & SLA', 
            icon: FileText
        },
        ...(canManageUsers ? [{
            id: 'users',
            label: 'User & Access Control',
            icon: Users,
            badge: 'RBAC'
        }] : [])
    ];

    return (
        <aside className="w-16 bg-slate-900/95 border-r border-slate-800/90 backdrop-blur-xl flex flex-col justify-between items-center py-4 z-50 relative flex-shrink-0 select-none shadow-2xl">
            {/* Top Brand Logo */}
            <div className="flex flex-col items-center gap-6 w-full">
                <div 
                    className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/25 cursor-pointer hover:scale-105 transition-transform"
                    title="NTMS Portal"
                >
                    <Activity className="w-5 h-5" />
                </div>

                <div className="w-8 h-[1px] bg-slate-800/80" />

                {/* Navigation Icons with Tooltips */}
                <nav className="flex flex-col items-center gap-2.5 w-full px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <div key={item.id} className="relative group w-full flex justify-center">
                                <button
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 relative ${
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40 font-bold'
                                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-transparent'
                                    }`}
                                    aria-label={item.label}
                                >
                                    <Icon className="w-5 h-5" />

                                    {/* Active Pill Indicator */}
                                    {isActive && (
                                        <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full shadow-[0_0_8px_#3b82f6]" />
                                    )}
                                </button>

                                {/* Floating Tooltip */}
                                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                                    <div className="bg-slate-900 border border-slate-700/80 text-slate-100 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-2">
                                        <span>{item.label}</span>
                                        {item.badge && (
                                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                    <div className="w-1.5 h-1.5 bg-slate-900 border-l border-b border-slate-700/80 transform rotate-45 -ml-1"></div>
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Section: Live status & Logout */}
            <div className="flex flex-col items-center gap-3 w-full px-2">
                {/* Live Indicator Tooltip */}
                <div className="relative group flex justify-center">
                    <div className="w-8 h-8 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-center cursor-default">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    </div>
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                        <div className="bg-slate-900 border border-slate-700/80 text-emerald-400 text-xs font-mono font-bold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap">
                            System Live • v2.4
                        </div>
                    </div>
                </div>

                <div className="w-8 h-[1px] bg-slate-800/80" />

                {/* Logout Button */}
                <div className="relative group w-full flex justify-center">
                    <button
                        onClick={onLogout}
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 transition-all"
                        aria-label="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>

                    {/* Tooltip */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                        <div className="bg-slate-900 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap">
                            LOGOUT
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}

