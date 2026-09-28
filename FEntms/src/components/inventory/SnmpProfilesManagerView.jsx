import React, { useState, useEffect } from 'react';
import { 
    Layers, 
    Plus, 
    Edit2, 
    Trash2, 
    Play, 
    CheckCircle2, 
    XCircle, 
    Cpu, 
    Activity, 
    Server, 
    Search,
    RefreshCw,
    Check,
    X,
    Code,
    Sliders
} from 'lucide-react';
import {
    getSnmpProfilesFromDB,
    createSnmpProfileInDB,
    updateSnmpProfileInDB,
    deleteSnmpProfileFromDB,
    addOidToProfileInDB,
    updateOidInDB,
    deleteOidFromDB,
    testLiveOidInDB
} from '../../services/api';
import { showToast, showAlert } from '../../utils/swal';
import Swal from 'sweetalert2';

export default function SnmpProfilesManagerView() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedProfileId, setSelectedProfileId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state for Profile
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState(null);
    const [profileFormData, setProfileFormData] = useState({
        name: '',
        vendor: '',
        sysoid_pattern: '',
        description: ''
    });

    // Modal state for OID
    const [isOidModalOpen, setIsOidModalOpen] = useState(false);
    const [editingOid, setEditingOid] = useState(null);
    const [oidFormData, setOidFormData] = useState({
        metric_key: '',
        label: '',
        mib_name: '',
        object_name: '',
        oid: '',
        oid_type: 'scalar',
        value_type: 'gauge',
        unit: '',
        formula: '',
        is_active: true
    });

    // Modal state for Live Testing OID
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [testTarget, setTestTarget] = useState({
        ip: '',
        port: 161,
        version: 'v2c',
        community: 'public',
        user: 'admin',
        authProto: 'sha',
        authKey: '',
        privProto: 'aes',
        privKey: '',
        oid: ''
    });
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState(null);

    // Fetch Profiles
    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const res = await getSnmpProfilesFromDB();
            if (res?.success) {
                setProfiles(res.data || []);
                if (res.data?.length > 0 && !selectedProfileId) {
                    setSelectedProfileId(res.data[0].id);
                }
            }
        } catch (err) {
            console.error(err);
            showToast('error', 'Gagal memuat profil SNMP');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    const selectedProfile = profiles.find(p => p.id === selectedProfileId);

    // Filtered Profiles for Search
    const filteredProfiles = profiles.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.vendor && p.vendor.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Profile CRUD Handlers
    const handleOpenProfileModal = (profile = null) => {
        if (profile) {
            setEditingProfile(profile);
            setProfileFormData({
                name: profile.name,
                vendor: profile.vendor || '',
                sysoid_pattern: profile.sysoid_pattern || '',
                description: profile.description || ''
            });
        } else {
            setEditingProfile(null);
            setProfileFormData({
                name: '',
                vendor: '',
                sysoid_pattern: '',
                description: ''
            });
        }
        setIsProfileModalOpen(true);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            if (editingProfile) {
                await updateSnmpProfileInDB(editingProfile.id, profileFormData);
                showToast('success', 'Profil berhasil diperbarui');
            } else {
                const res = await createSnmpProfileInDB(profileFormData);
                showToast('success', 'Profil baru berhasil dibuat');
                if (res?.data?.id) setSelectedProfileId(res.data.id);
            }
            setIsProfileModalOpen(false);
            fetchProfiles();
        } catch (err) {
            showAlert('Gagal', err?.response?.data?.message || 'Gagal menyimpan profil', 'error');
        }
    };

    const handleDeleteProfile = async (profile) => {
        const result = await Swal.fire({
            title: `Hapus Profil ${profile.name}?`,
            text: 'Semua konfigurasi OID di dalam profil ini juga akan terhapus!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#475569',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#f8fafc'
        });

        if (result.isConfirmed) {
            try {
                await deleteSnmpProfileFromDB(profile.id);
                showToast('success', 'Profil berhasil dihapus');
                setSelectedProfileId(null);
                fetchProfiles();
            } catch (err) {
                showAlert('Gagal', 'Gagal menghapus profil', 'error');
            }
        }
    };

    // OID CRUD Handlers
    const handleOpenOidModal = (oid = null) => {
        if (oid) {
            setEditingOid(oid);
            setOidFormData({
                metric_key: oid.metric_key,
                label: oid.label,
                mib_name: oid.mib_name || '',
                object_name: oid.object_name || '',
                oid: oid.oid,
                oid_type: oid.oid_type || 'scalar',
                value_type: oid.value_type || 'gauge',
                unit: oid.unit || '',
                formula: oid.formula || '',
                is_active: oid.is_active
            });
        } else {
            setEditingOid(null);
            setOidFormData({
                metric_key: '',
                label: '',
                mib_name: '',
                object_name: '',
                oid: '',
                oid_type: 'scalar',
                value_type: 'gauge',
                unit: '',
                formula: '',
                is_active: true
            });
        }
        setIsOidModalOpen(true);
    };

    const handleSaveOid = async (e) => {
        e.preventDefault();
        try {
            if (editingOid) {
                await updateOidInDB(editingOid.id, oidFormData);
                showToast('success', 'OID berhasil diperbarui');
            } else {
                await addOidToProfileInDB(selectedProfileId, oidFormData);
                showToast('success', 'OID baru berhasil ditambahkan');
            }
            setIsOidModalOpen(false);
            fetchProfiles();
        } catch (err) {
            showAlert('Gagal', err?.response?.data?.message || 'Gagal menyimpan OID', 'error');
        }
    };

    const handleDeleteOid = async (oid) => {
        const result = await Swal.fire({
            title: `Hapus OID ${oid.label}?`,
            text: `OID: ${oid.oid}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#475569',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#f8fafc'
        });

        if (result.isConfirmed) {
            try {
                await deleteOidFromDB(oid.id);
                showToast('success', 'OID berhasil dihapus');
                fetchProfiles();
            } catch (err) {
                showAlert('Gagal', 'Gagal menghapus OID', 'error');
            }
        }
    };

    const handleToggleOidStatus = async (oid) => {
        try {
            await updateOidInDB(oid.id, { is_active: !oid.is_active });
            fetchProfiles();
        } catch (err) {
            showToast('error', 'Gagal mengubah status OID');
        }
    };

    // Live Test Handlers
    const handleOpenTestModal = (targetOid = '') => {
        setTestTarget(prev => ({
            ...prev,
            oid: targetOid || prev.oid || '1.3.6.1.2.1.1.1.0'
        }));
        setTestResult(null);
        setIsTestModalOpen(true);
    };

    const handleExecuteTest = async (e) => {
        e.preventDefault();
        setTestLoading(true);
        setTestResult(null);
        try {
            const res = await testLiveOidInDB(testTarget);
            setTestResult({ success: true, data: res });
        } catch (err) {
            setTestResult({
                success: false,
                message: err?.response?.data?.message || err.message || 'Koneksi SNMP Gagal'
            });
        } finally {
            setTestLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4 text-slate-100">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-xl">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
                        <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-white tracking-wide">SNMP Dynamic Profiles & OID Metrics</h1>
                        <p className="text-xs text-slate-400">Kelola profil template perangkat dan parameter OID dinamis tanpa restart engine</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleOpenTestModal()}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shadow-md"
                    >
                        <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                        <span>Live Test SNMP</span>
                    </button>
                    <button
                        onClick={fetchProfiles}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs transition-all"
                        title="Refresh Profil"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
                    </button>
                    <button
                        onClick={() => handleOpenProfileModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span>TAMBAH PROFIL</span>
                    </button>
                </div>
            </div>

            {/* Split Screen Workspace: Left (Profiles List), Right (OIDs Configuration) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
                {/* Left Panel: Profile List */}
                <div className="lg:col-span-4 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 flex flex-col min-h-0 overflow-hidden shadow-xl">
                    <div className="p-3 border-b border-slate-800 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Daftar Profil ({profiles.length})</span>
                        </div>
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari nama profil / vendor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-950/70 border border-slate-800 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 no-scrollbar">
                        {filteredProfiles.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-xs">
                                {loading ? 'Memuat profil...' : 'Tidak ada profil SNMP'}
                            </div>
                        ) : (
                            filteredProfiles.map((p) => {
                                const isSelected = p.id === selectedProfileId;
                                const oidCount = p.oids?.length || 0;
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => setSelectedProfileId(p.id)}
                                        className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                            isSelected
                                                ? 'bg-blue-600/15 border-blue-500/40 shadow-md shadow-blue-500/10'
                                                : 'bg-slate-950/30 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                                <Server className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-300' : 'text-slate-200'}`}>
                                                        {p.name}
                                                    </span>
                                                    {p.vendor && (
                                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                                            {p.vendor}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-slate-500 truncate flex items-center gap-2 mt-0.5">
                                                    <span>{oidCount} OID Metrik</span>
                                                    {p.sysoid_pattern && <span>• Pattern: {p.sysoid_pattern}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenProfileModal(p);
                                                }}
                                                className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg"
                                                title="Edit Profil"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteProfile(p);
                                                }}
                                                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                                                title="Hapus Profil"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Panel: OID Metrics Definition */}
                <div className="lg:col-span-8 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 flex flex-col min-h-0 overflow-hidden shadow-xl">
                    {selectedProfile ? (
                        <>
                            {/* Profile Header Detail */}
                            <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-sm font-bold text-white">{selectedProfile.name}</h2>
                                        {selectedProfile.vendor && (
                                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-mono font-bold">
                                                {selectedProfile.vendor}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {selectedProfile.description || 'Tidak ada deskripsi profil.'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenProfileModal(selectedProfile)}
                                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        <span>Edit Profil</span>
                                    </button>
                                    <button
                                        onClick={() => handleOpenOidModal()}
                                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>TAMBAH OID METRIK</span>
                                    </button>
                                </div>
                            </div>

                            {/* OID List Table */}
                            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                                {(!selectedProfile.oids || selectedProfile.oids.length === 0) ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="p-4 bg-slate-800/40 rounded-full text-slate-500 mb-3">
                                            <Code className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-300">Belum ada OID yang didefinisikan</h3>
                                        <p className="text-xs text-slate-500 mt-1 max-w-sm">
                                            Tambahkan parameter OID seperti CPU Usage, RAM, Temperature, atau Serial Number ke profil ini.
                                        </p>
                                        <button
                                            onClick={() => handleOpenOidModal()}
                                            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Tambah OID Pertama</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                                                    <th className="pb-3 font-semibold">Status</th>
                                                    <th className="pb-3 font-semibold">Parameter / Key</th>
                                                    <th className="pb-3 font-semibold">MIB Module & Object Name</th>
                                                    <th className="pb-3 font-semibold">OID Identifier</th>
                                                    <th className="pb-3 font-semibold">Tipe & Unit</th>
                                                    <th className="pb-3 font-semibold">Rumus</th>
                                                    <th className="pb-3 text-right font-semibold">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/60">
                                                {selectedProfile.oids.map((oid) => (
                                                    <tr key={oid.id} className="hover:bg-slate-800/30 transition-colors group">
                                                        <td className="py-3">
                                                            <button
                                                                onClick={() => handleToggleOidStatus(oid)}
                                                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border transition-all ${
                                                                    oid.is_active
                                                                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                                                        : 'bg-slate-800 text-slate-500 border-slate-700'
                                                                }`}
                                                            >
                                                                {oid.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                                                <span>{oid.is_active ? 'ACTIVE' : 'DISABLED'}</span>
                                                            </button>
                                                        </td>
                                                        <td className="py-3">
                                                            <div className="font-bold text-slate-200">{oid.label}</div>
                                                            <div className="font-mono text-[10px] text-blue-400 mt-0.5">{oid.metric_key}</div>
                                                        </td>
                                                        <td className="py-3">
                                                            {oid.mib_name || oid.object_name ? (
                                                                <div>
                                                                    <div className="font-semibold text-indigo-300 font-mono text-[11px]">{oid.object_name || '-'}</div>
                                                                    <div className="text-[10px] text-slate-400 font-mono">{oid.mib_name || '-'}</div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-600 font-mono text-[10px]">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3">
                                                            <div className="font-mono text-[11px] text-slate-300 bg-slate-950/60 px-2 py-1 rounded border border-slate-800 inline-block select-all">
                                                                {oid.oid}
                                                            </div>
                                                        </td>
                                                        <td className="py-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                                                                    {oid.oid_type || 'scalar'}
                                                                </span>
                                                                <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                                                                    {oid.value_type || 'gauge'}
                                                                </span>
                                                                {oid.unit && (
                                                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                                                                        {oid.unit}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3">
                                                            {oid.formula ? (
                                                                <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                                                    {oid.formula}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-600 font-mono text-[11px]">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <button
                                                                    onClick={() => handleOpenTestModal(oid.oid)}
                                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg border border-slate-700"
                                                                    title="Uji OID ini ke Perangkat"
                                                                >
                                                                    <Play className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleOpenOidModal(oid)}
                                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg border border-slate-700"
                                                                    title="Edit OID"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteOid(oid)}
                                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg border border-slate-700"
                                                                    title="Hapus OID"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
                            <Server className="w-10 h-10 mb-2 opacity-40" />
                            <p className="text-xs">Pilih atau buat profil di sebelah kiri untuk melihat OID metrik</p>
                        </div>
                    )}
                </div>
            </div>

            {/* =========================================================================
               MODAL: TAMBAH / EDIT PROFILE
               ========================================================================= */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Server className="w-4 h-4 text-blue-400" />
                                {editingProfile ? 'Edit SNMP Profile' : 'Tambah Profil SNMP Baru'}
                            </h3>
                            <button
                                onClick={() => setIsProfileModalOpen(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="flex flex-col gap-3.5 text-xs">
                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Nama Profil *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Cisco Catalyst 2960 / FortiGate 60F"
                                    value={profileFormData.name}
                                    onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Vendor / Kategori</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Cisco, Fortinet, Hikvision, Ruijie"
                                    value={profileFormData.vendor}
                                    onChange={(e) => setProfileFormData({ ...profileFormData, vendor: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Pattern sysObjectID (Auto-Discovery)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. ^1\.3\.6\.1\.4\.1\.9\.1\."
                                    value={profileFormData.sysoid_pattern}
                                    onChange={(e) => setProfileFormData({ ...profileFormData, sysoid_pattern: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Deskripsi Profil</label>
                                <textarea
                                    rows={2}
                                    placeholder="Keterangan mengenai perangkat atau seri model..."
                                    value={profileFormData.description}
                                    onChange={(e) => setProfileFormData({ ...profileFormData, description: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsProfileModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/25 transition-all"
                                >
                                    {editingProfile ? 'Simpan Perubahan' : 'Buat Profil'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =========================================================================
               MODAL: TAMBAH / EDIT OID METRIK
               ========================================================================= */}
            {isOidModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Code className="w-4 h-4 text-emerald-400" />
                                {editingOid ? 'Edit OID Metrik' : `Tambah OID ke ${selectedProfile?.name}`}
                            </h3>
                            <button
                                onClick={() => setIsOidModalOpen(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveOid} className="flex flex-col gap-3.5 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Metric Key (Kode Identifikasi) *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. cpu_usage, memory_used"
                                        value={oidFormData.metric_key}
                                        onChange={(e) => setOidFormData({ ...oidFormData, metric_key: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Label Tampilan (Display Name) *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. CPU Core 1 Usage, Chassis Temp"
                                        value={oidFormData.label}
                                        onChange={(e) => setOidFormData({ ...oidFormData, label: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">MIB Name (Module)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. CISCO-PROCESS-MIB, RFC1213-MIB"
                                        value={oidFormData.mib_name}
                                        onChange={(e) => setOidFormData({ ...oidFormData, mib_name: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">MIB Object Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. cpmCPUTotal5minRev, sysDescr"
                                        value={oidFormData.object_name}
                                        onChange={(e) => setOidFormData({ ...oidFormData, object_name: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Nomor OID (SNMP Object ID) *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="1.3.6.1.4.1.9.9.109.1.1.1.1.5.1"
                                    value={oidFormData.oid}
                                    onChange={(e) => setOidFormData({ ...oidFormData, oid: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Tipe OID</label>
                                    <select
                                        value={oidFormData.oid_type}
                                        onChange={(e) => setOidFormData({ ...oidFormData, oid_type: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="scalar">Scalar (GET)</option>
                                        <option value="table">Table / Subtree (WALK)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Tipe Nilai</label>
                                    <select
                                        value={oidFormData.value_type}
                                        onChange={(e) => setOidFormData({ ...oidFormData, value_type: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="gauge">Gauge / Numeric</option>
                                        <option value="integer">Integer</option>
                                        <option value="string">String / Text</option>
                                        <option value="counter">Counter</option>
                                        <option value="timeticks">TimeTicks</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Satuan / Unit</label>
                                    <input
                                        type="text"
                                        placeholder="%, °C, MB, RPM, bps"
                                        value={oidFormData.unit}
                                        onChange={(e) => setOidFormData({ ...oidFormData, unit: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Rumus Formula / Skala (Opsional)</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: val / 10, val * 8, (used / total) * 100"
                                    value={oidFormData.formula}
                                    onChange={(e) => setOidFormData({ ...oidFormData, formula: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                                />
                                <span className="text-[10px] text-slate-500 mt-1 block">Gunakan simbol variabel <code>val</code> untuk nilai mentah dari SNMP</span>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={oidFormData.is_active}
                                        onChange={(e) => setOidFormData({ ...oidFormData, is_active: e.target.checked })}
                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-slate-950 border-slate-700"
                                    />
                                    <span className="text-xs text-slate-300 font-semibold">Aktifkan Polling Metrik ini</span>
                                </label>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsOidModalOpen(false)}
                                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/25 transition-all"
                                    >
                                        {editingOid ? 'Simpan Perubahan' : 'Tambahkan OID'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =========================================================================
               MODAL: LIVE SNMP TEST TOOL
               ========================================================================= */}
            {isTestModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Play className="w-4 h-4 text-emerald-400" />
                                Live SNMP OID Tester
                            </h3>
                            <button
                                onClick={() => setIsTestModalOpen(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleExecuteTest} className="flex flex-col gap-3 text-xs">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-2">
                                    <label className="block text-slate-300 font-semibold mb-1">Target IP Perangkat *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="172.17.101.3"
                                        value={testTarget.ip}
                                        onChange={(e) => setTestTarget({ ...testTarget, ip: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Port</label>
                                    <input
                                        type="number"
                                        value={testTarget.port}
                                        onChange={(e) => setTestTarget({ ...testTarget, port: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Versi SNMP</label>
                                    <select
                                        value={testTarget.version}
                                        onChange={(e) => setTestTarget({ ...testTarget, version: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="v2c">SNMP v2c</option>
                                        <option value="v3">SNMP v3 (Secure)</option>
                                        <option value="v1">SNMP v1</option>
                                    </select>
                                </div>

                                {testTarget.version !== 'v3' ? (
                                    <div>
                                        <label className="block text-slate-300 font-semibold mb-1">Community String</label>
                                        <input
                                            type="text"
                                            value={testTarget.community}
                                            onChange={(e) => setTestTarget({ ...testTarget, community: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-slate-300 font-semibold mb-1">Security User</label>
                                        <input
                                            type="text"
                                            value={testTarget.user}
                                            onChange={(e) => setTestTarget({ ...testTarget, user: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                )}
                            </div>

                            {testTarget.version === 'v3' && (
                                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                                    <div>
                                        <label className="block text-slate-400 text-[10px] mb-0.5">Auth Protocol & Key</label>
                                        <div className="flex gap-1">
                                            <select
                                                value={testTarget.authProto}
                                                onChange={(e) => setTestTarget({ ...testTarget, authProto: e.target.value })}
                                                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100"
                                            >
                                                <option value="sha">SHA</option>
                                                <option value="md5">MD5</option>
                                            </select>
                                            <input
                                                type="password"
                                                placeholder="Auth Key"
                                                value={testTarget.authKey}
                                                onChange={(e) => setTestTarget({ ...testTarget, authKey: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-[10px] mb-0.5">Priv Protocol & Key</label>
                                        <div className="flex gap-1">
                                            <select
                                                value={testTarget.privProto}
                                                onChange={(e) => setTestTarget({ ...testTarget, privProto: e.target.value })}
                                                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100"
                                            >
                                                <option value="aes">AES</option>
                                                <option value="des">DES</option>
                                            </select>
                                            <input
                                                type="password"
                                                placeholder="Priv Key"
                                                value={testTarget.privKey}
                                                onChange={(e) => setTestTarget({ ...testTarget, privKey: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Target OID to Query *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="1.3.6.1.2.1.1.1.0"
                                    value={testTarget.oid}
                                    onChange={(e) => setTestTarget({ ...testTarget, oid: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Output Result Box */}
                            {testResult && (
                                <div className={`p-3 rounded-xl border text-xs font-mono mt-1 ${
                                    testResult.success
                                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                                        : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                                }`}>
                                    {testResult.success ? (
                                        <div>
                                            <div className="flex items-center gap-1.5 font-bold mb-1">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                <span>SNMP Response Received:</span>
                                            </div>
                                            <div className="space-y-0.5 text-[11px] pl-5">
                                                <div><strong>OID:</strong> {testResult.data.oid}</div>
                                                <div><strong>Type:</strong> {testResult.data.typeName}</div>
                                                <div className="break-all"><strong>Value:</strong> {String(testResult.data.value)}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                                            <span>{testResult.message}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsTestModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
                                >
                                    Tutup
                                </button>
                                <button
                                    type="submit"
                                    disabled={testLoading}
                                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
                                >
                                    {testLoading ? (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>Querying...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-3.5 h-3.5 fill-current" />
                                            <span>Jalankan Test</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
