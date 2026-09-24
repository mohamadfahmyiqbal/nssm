import React from 'react';
import { Network, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function SnmpTestResultStep({
    step,
    formData,
    testError,
    testResult,
    onCancel,
    onSave
}) {
    if (step === 'testing') {
        return (
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                    <Network className="w-6 h-6 text-blue-400 absolute inset-0 m-auto" />
                </div>
                <div>
                    <p className="font-bold text-slate-100 text-sm">Menguji Koneksi SNMP...</p>
                    <p className="text-slate-400 text-xs mt-1 font-mono">
                        Connecting to {formData.ip}:{formData.snmpPort || 161}
                    </p>
                </div>
            </div>
        );
    }

    if (step === 'result') {
        return (
            <div className="space-y-4">
                {testError ? (
                    <div className="bg-rose-950/40 border border-rose-500/40 p-3 rounded-xl font-mono space-y-1 text-rose-400">
                        <div className="flex items-center gap-2 font-bold mb-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Test SNMP Gagal</span>
                        </div>
                        <p className="text-xs break-words">{testError}</p>
                    </div>
                ) : (
                    <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl font-mono space-y-1 text-emerald-400">
                        <div className="flex items-center gap-2 font-bold mb-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Status: Koneksi SNMP Sukses</span>
                        </div>
                        {testResult && (
                            <div className="text-xs mt-2 space-y-1 border-t border-emerald-500/30 pt-2">
                                <p><span className="opacity-70">System Name:</span> {testResult.sysName}</p>
                                <p><span className="opacity-70">System Descr:</span> {testResult.sysDescr}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-2 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onSave}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                        <span>SIMPAN</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
