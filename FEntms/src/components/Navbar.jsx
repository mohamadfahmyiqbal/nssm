import React from 'react';
import StatusCounters from './StatusCounters';
import { ShieldCheck, Activity, UserCheck } from 'lucide-react';
import { useAuth, ROLES } from '../context/AuthContext';

export default function Navbar({ activeTabTitle = 'Dashboard' }) {
    const { currentUser, changeRole } = useAuth();

    return (
        <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
            {/* Active View / Breadcrumb Context */}
            <div className="flex items-center gap-3">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-semibold">
                        Current Workspace
                    </span>
                    <h2 className="text-base font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
                        <span>{activeTabTitle}</span>
                    </h2>
                </div>
            </div>

            {/* Middle Section: Real-time Counters */}
            <div className="flex items-center">
                <StatusCounters />
            </div>

            {/* Right Section: RBAC User Role Switcher & Clock */}
            <div className="flex items-center gap-3">
                {/* RBAC Role Selector Badge */}
                <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs font-mono">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-slate-400 text-[10px] hidden sm:inline">Role:</span>
                    <select
                        value={currentUser?.role || ROLES.TECHNICIAN}
                        onChange={(e) => changeRole(e.target.value)}
                        className="bg-transparent text-slate-200 text-xs font-bold outline-none cursor-pointer"
                        title="Ganti Role Simulasi RBAC"
                    >
                        <option value={ROLES.TECHNICIAN} className="bg-slate-900 text-slate-200">Teknisi (Technician)</option>
                        <option value={ROLES.SPV} className="bg-slate-900 text-amber-300">Supervisor (SPV)</option>
                        <option value={ROLES.DEPT_HEAD} className="bg-slate-900 text-purple-300">Dept Head (Manager)</option>
                    </select>
                </div>

                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span>Cikampek, {new Date().toLocaleTimeString('id-ID')} WIB</span>
                </div>
            </div>
        </header>
    );
}