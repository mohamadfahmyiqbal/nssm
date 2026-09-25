import React, { useState, useMemo, useEffect } from 'react';
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
    Briefcase,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ 
    activeTab, 
    setActiveTab, 
    isOpenMobile = false,
    onCloseMobile = () => {},
    onLogout
}) {
    const { canManageUsers } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    // Auto sync dropdown open if activeTab is within Work Orders / Schedules
    const isWoActive = useMemo(() => 
        ['schedules', 'daily-scheduler', 'wo-archive', 'workorders'].includes(activeTab),
        [activeTab]
    );
    const [isWoDropdownOpen, setIsWoDropdownOpen] = useState(true);

    useEffect(() => {
        if (isWoActive) {
            setIsWoDropdownOpen(true);
        }
    }, [isWoActive]);

    const navItems = useMemo(() => [
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
            id: 'workorders-parent', 
            label: 'Work Orders', 
            icon: Briefcase,
            badge: 'TASK',
            isDropdown: true,
            children: [
                { id: 'schedules', label: 'Maintenance Schedule' },
                { id: 'daily-scheduler', label: 'Daily Scheduler' },
                { id: 'wo-archive', label: 'Archive' }
            ]
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
    ], [canManageUsers]);

    const handleSelectTab = (tabId) => {
        setActiveTab(tabId);
        onCloseMobile();
    };

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {isOpenMobile && (
                <div 
                    onClick={onCloseMobile}
                    className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
                    aria-hidden="true"
                />
            )}

            {/* Sidebar (Responsive Collapsible Drawer on Mobile & Rail on Desktop) */}
            <aside 
                className={`
                    fixed md:static inset-y-0 left-0 z-50
                    bg-slate-900/98 md:bg-slate-900/95 border-r border-slate-800/90 
                    backdrop-blur-xl flex flex-col justify-between py-3 sm:py-4 
                    flex-shrink-0 select-none shadow-2xl transition-all duration-300 ease-in-out
                    h-[100dvh] overflow-hidden
                    ${isCollapsed ? 'w-16 md:w-16' : 'w-64 sm:w-64 md:w-60'}
                    ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
                {/* Top Section: Brand + Collapse Toggle + Navigation */}
                <div className="flex flex-col gap-2.5 sm:gap-3 w-full px-2.5 sm:px-3 min-h-0 flex-1">
                    {/* Header Brand */}
                    <div className="w-full flex items-center justify-between">
                        <div className={`flex items-center gap-2.5 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
                            <div 
                                className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/25 cursor-pointer hover:scale-105 transition-transform flex items-center justify-center flex-shrink-0"
                                title="NTMS Portal"
                                onClick={() => setIsCollapsed(prev => !prev)}
                            >
                                <Activity className="w-5 h-5" />
                            </div>
                            {!isCollapsed && (
                                <div className="flex flex-col min-w-0">
                                    <span className="font-black text-sm text-white tracking-wide truncate">NTMS PORTAL</span>
                                    <span className="text-[10px] font-mono text-blue-400 font-semibold truncate">Monitoring & ITAM</span>
                                </div>
                            )}
                        </div>

                        {/* Mobile Close Button */}
                        <button 
                            onClick={onCloseMobile}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition-colors"
                            aria-label="Tutup menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Collapse / Expand Toggle Button (Active across all screen sizes) */}
                    <div className="w-full">
                        <button
                            onClick={() => setIsCollapsed(prev => !prev)}
                            className={`w-full py-1 px-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                                isCollapsed ? 'h-8 px-0' : 'h-7'
                            }`}
                            title={isCollapsed ? "Buka Sidebar" : "Ciutkan Sidebar"}
                        >
                            {isCollapsed ? (
                                <ChevronRight className="w-4 h-4 text-blue-400" />
                            ) : (
                                <>
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    <span>Collapse Sidebar</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="w-full h-[1px] bg-slate-800/80" />

                    {/* Scrollable Navigation Items */}
                    <nav className="flex flex-col gap-1 w-full overflow-y-auto flex-1 pr-0.5 no-scrollbar">
                        {navItems.map((item) => {
                            const Icon = item.icon;

                            // Handle Dropdown Item (Work Orders)
                            if (item.isDropdown) {
                                return (
                                    <div key={item.id} className="w-full flex flex-col">
                                        <div className="relative group w-full flex justify-center">
                                            <button
                                                onClick={() => {
                                                    if (isCollapsed) {
                                                        setIsCollapsed(false);
                                                        setIsWoDropdownOpen(true);
                                                    } else {
                                                        setIsWoDropdownOpen(prev => !prev);
                                                    }
                                                }}
                                                className={`w-full ${isCollapsed ? 'h-10 px-0 justify-center' : 'h-10 px-3 justify-between'} rounded-xl flex items-center transition-all duration-200 relative ${
                                                    isWoActive
                                                        ? 'bg-slate-800/90 text-blue-400 border border-blue-500/30 font-bold'
                                                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-transparent'
                                                }`}
                                                aria-label={item.label}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                                    {!isCollapsed && (
                                                        <span className="text-xs font-semibold truncate">
                                                            {item.label}
                                                        </span>
                                                    )}
                                                </div>

                                                {!isCollapsed && (
                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        {item.badge && (
                                                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isWoDropdownOpen ? 'rotate-180 text-blue-400' : ''}`} />
                                                    </div>
                                                )}
                                            </button>

                                            {/* Flyout Submenu in Collapsed Mode */}
                                            {isCollapsed && (
                                                <div className="hidden group-hover:flex flex-col absolute left-full ml-2.5 top-0 z-50 bg-slate-900/98 border border-slate-700 rounded-xl shadow-2xl p-1.5 min-w-[170px] gap-1 backdrop-blur-md">
                                                    <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800 font-bold">
                                                        {item.label}
                                                    </div>
                                                    {item.children.map(sub => (
                                                        <button
                                                            key={sub.id}
                                                            onClick={() => handleSelectTab(sub.id)}
                                                            className={`px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors font-medium flex items-center justify-between ${
                                                                activeTab === sub.id
                                                                    ? 'bg-blue-600 text-white font-bold'
                                                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                            }`}
                                                        >
                                                            <span>{sub.label}</span>
                                                            {activeTab === sub.id && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Expanded Submenu List */}
                                        {!isCollapsed && isWoDropdownOpen && (
                                            <div className="w-full pl-6 pr-1 py-1 flex flex-col gap-1 transition-all">
                                                {item.children.map(sub => {
                                                    const isSubActive = activeTab === sub.id;
                                                    return (
                                                        <button
                                                            key={sub.id}
                                                            onClick={() => handleSelectTab(sub.id)}
                                                            className={`w-full px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all ${
                                                                isSubActive
                                                                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25'
                                                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-1.5 h-1.5 rounded-full ${isSubActive ? 'bg-white' : 'bg-slate-600'}`} />
                                                                <span>{sub.label}</span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            const isActive = activeTab === item.id;
                            return (
                                <div key={item.id} className="relative group w-full flex justify-center">
                                    <button
                                        onClick={() => handleSelectTab(item.id)}
                                        className={`w-full ${isCollapsed ? 'h-10 px-0 justify-center' : 'h-10 px-3 justify-start'} rounded-xl flex items-center gap-2.5 transition-all duration-200 relative ${
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40 font-bold'
                                                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-transparent'
                                        }`}
                                        aria-label={item.label}
                                    >
                                        <Icon className="w-4 h-4 flex-shrink-0" />

                                        {/* Active Pill Indicator */}
                                        {isActive && (
                                            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full shadow-[0_0_8px_#3b82f6]" />
                                        )}

                                        {/* Text Label when Expanded */}
                                        {!isCollapsed && (
                                            <span className="text-xs font-semibold flex-1 text-left truncate">
                                                {item.label}
                                            </span>
                                        )}

                                        {/* Badge when Expanded */}
                                        {!isCollapsed && item.badge && (
                                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                                                {item.badge}
                                            </span>
                                        )}
                                    </button>

                                    {/* Tooltip when Collapsed */}
                                    {isCollapsed && (
                                        <div className="hidden group-hover:flex absolute left-full ml-2.5 top-1/2 -translate-y-1/2 items-center z-50 pointer-events-none">
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
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Section: Status & Logout */}
                <div className="flex flex-col items-center gap-2 w-full px-2.5 sm:px-3 pt-2">
                    <div className="w-full h-[1px] bg-slate-800/80" />

                    {/* Live Indicator */}
                    <div className="w-full flex items-center justify-center py-0.5">
                        <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : 'w-full justify-between px-1'}`}>
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-center cursor-default">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                </div>
                                {!isCollapsed && (
                                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                                        Live v2.4
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <div className="w-full flex justify-center pb-1">
                        <button
                            onClick={onLogout}
                            className={`w-full ${isCollapsed ? 'h-9 px-0 justify-center' : 'h-9 px-3 justify-center'} rounded-xl flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 transition-all font-semibold text-xs`}
                            aria-label="Logout"
                            title="Keluar Sistem"
                        >
                            <LogOut className="w-4 h-4 flex-shrink-0" />
                            {!isCollapsed && <span>Keluar</span>}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

