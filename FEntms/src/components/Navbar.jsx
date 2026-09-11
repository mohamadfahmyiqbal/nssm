import React from 'react';
import { Network, Video, Server, Layers } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, selectedNetwork, setSelectedNetwork }) {
    const navItems = [
        { id: 'dashboard', label: 'TOPOLOGY' },
        { id: 'inventory', label: 'INVENTORY' },
        { id: 'mapping', label: 'LOCATION MAPPING' },
        { id: 'reports', label: 'REPORTS & SLA' },
    ];

    return (
        <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
            {/* Brand & Logo */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
                    <Network className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="font-black text-sm tracking-wider text-slate-100 uppercase">
                        NTMS PORTAL
                    </h1>
                    <p className="text-[10px] text-slate-400 font-mono">
                        Network Topology Management System
                    </p>
                </div>
            </div>

            {/* Network Type Filter Switcher (LAN vs CCTV) */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-xs font-mono">
                <button
                    onClick={() => setSelectedNetwork('ALL')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${selectedNetwork === 'ALL'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <Layers className="w-3.5 h-3.5" />
                    <span>ALL NETWORKS</span>
                </button>

                <button
                    onClick={() => setSelectedNetwork('LAN')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${selectedNetwork === 'LAN'
                            ? 'bg-cyan-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <Server className="w-3.5 h-3.5" />
                    <span>LAN NETWORK</span>
                </button>

                <button
                    onClick={() => setSelectedNetwork('CCTV')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${selectedNetwork === 'CCTV'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <Video className="w-3.5 h-3.5" />
                    <span>CCTV NETWORK</span>
                </button>
            </div>

            {/* Main Nav Tabs */}
            <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 text-xs font-sans">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`px-3.5 py-1.5 rounded-lg font-bold tracking-wide transition-all ${activeTab === item.id
                                ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>
        </header>
    );
}