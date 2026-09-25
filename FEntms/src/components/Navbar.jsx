import React from 'react';
import StatusCounters from './StatusCounters';
import { ShieldCheck, Activity, UserCheck, Menu, X } from 'lucide-react';
import { useAuth, ROLES } from '../context/AuthContext';

export default function Navbar({ 
    activeTabTitle = 'Dashboard',
    onToggleMobileMenu = () => {},
    isMobileMenuOpen = false
}) {
    const { currentUser, changeRole } = useAuth();

    return (
        <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
            {/* Active View / Breadcrumb Context & Mobile Hamburger */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Mobile Menu Trigger */}
                <button
                    onClick={onToggleMobileMenu}
                    className="p-2 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg md:hidden transition-colors focus:outline-none"
                    aria-label={isMobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5 text-blue-400" /> : <Menu className="w-5 h-5" />}
                </button>

                <div className="flex flex-col min-w-0">
                    <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-widest text-slate-500 font-semibold truncate">
                        Current Workspace
                    </span>
                    <h2 className="text-xs sm:text-base font-extrabold text-slate-100 tracking-tight flex items-center gap-2 truncate">
                        <span className="truncate">{activeTabTitle}</span>
                    </h2>
                </div>
            </div>

            {/* Middle Section: Real-time Counters (Compact on Mobile) */}
            <div className="flex items-center overflow-x-auto no-scrollbar py-0.5">
                <StatusCounters />
            </div>

            {/* Right Section: RBAC User Role Switcher & Clock */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* RBAC Role Selector Badge */}
                <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl px-2 py-1 text-xs font-mono">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span className="text-slate-400 text-[10px] hidden sm:inline">Role:</span>
                    <select
                        value={currentUser?.role || ROLES.TECHNICIAN}
                        onChange={(e) => changeRole(e.target.value)}
                        className="bg-transparent text-slate-200 text-[11px] sm:text-xs font-bold outline-none cursor-pointer max-w-[90px] sm:max-w-none truncate"
                        title="Ganti Role Simulasi RBAC"
                    >
                        <option value={ROLES.TECHNICIAN} className="bg-slate-900 text-slate-200">Teknisi</option>
                        <option value={ROLES.SPV} className="bg-slate-900 text-amber-300">SPV</option>
                        <option value={ROLES.DEPT_HEAD} className="bg-slate-900 text-purple-300">Dept Head</option>
                    </select>
                </div>

                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span>Cikampek, {new Date().toLocaleTimeString('id-ID')} WIB</span>
                </div>
            </div>
        </header>
    );
}