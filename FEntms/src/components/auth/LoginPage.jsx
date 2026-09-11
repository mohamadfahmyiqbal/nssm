import React, { useState } from 'react';
import { Network, Lock, User, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage({ onLogin }) {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!credentials.username || !credentials.password) {
            setError('Username dan Password wajib diisi!');
            return;
        }

        setIsLoading(true);

        // Simulasi autentikasi
        setTimeout(() => {
            setIsLoading(false);
            onLogin();
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">

            {/* Background Decorative Glow Circles */}
            <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Grid Pattern Background */}
            <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(#3b82f6 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                }}
            />

            {/* Login Card Container */}
            <div className="relative z-10 w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-8 flex flex-col gap-6">

                {/* Header / Logo */}
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-2xl text-blue-400 shadow-lg shadow-blue-500/20">
                        <Network className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-wider text-slate-100 uppercase">
                            NTMS PORTAL
                        </h1>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                            Network Traffic & Topology Management System
                        </p>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/40 text-rose-400 px-3.5 py-2.5 rounded-xl text-xs font-mono text-center">
                        ⚠️ {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">

                    {/* Username Field */}
                    <div>
                        <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                            Username / ID Operasional
                        </label>
                        <div className="relative">
                            <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Masukkan username..."
                                value={credentials.username}
                                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none transition-colors font-mono"
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={credentials.password}
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none transition-colors font-mono"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="mt-2 w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>MEMPROSES OTENTIKASI...</span>
                            </>
                        ) : (
                            <>
                                <span>MASUK KE SYSTEM</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                {/* Footer Info */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <div className="flex items-center gap-1 text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Encrypted Connection</span>
                    </div>
                    <span>v2.4.0-release</span>
                </div>

            </div>
        </div>
    );
}