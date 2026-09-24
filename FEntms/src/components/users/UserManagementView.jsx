import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, 
    UserPlus, 
    Shield, 
    Key, 
    Trash2, 
    Edit, 
    CheckCircle2, 
    AlertCircle, 
    RefreshCw, 
    Search, 
    Lock, 
    UserCheck,
    Building2,
    Clock,
    X,
    Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
    getUsersFromDB, 
    createUserInDB, 
    updateUserInDB, 
    deleteUserFromDB 
} from '../../services/api';
import { showToast, showConfirm } from '../../utils/swal';

export default function UserManagementView() {
    const { currentUser, canManageUsers, ROLES } = useAuth();
    const isDeptHeadOrAdmin = [ROLES.DEPT_HEAD, ROLES.ADMIN].includes(currentUser?.role);

    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'password'
    const [selectedUser, setSelectedUser] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        nik: '',
        nama: '',
        dept: 'IT Infrastructure',
        role: 'TECHNICIAN',
        password: ''
    });

    // Fetch daftar user dari SQL Server
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await getUsersFromDB();
            if (res?.success) {
                setUsers(res.data || []);
            } else {
                showToast('error', res?.error || 'Gagal memuat data pengguna.');
            }
        } catch (err) {
            console.error('Fetch users error:', err);
            showToast('error', 'Koneksi API gagal saat memuat daftar pengguna.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (canManageUsers) {
            fetchUsers();
        }
    }, [canManageUsers]);

    // Role options mapping (Terbuka untuk semua user)
    const availableRoles = useMemo(() => {
        return [
            { value: 'TECHNICIAN', label: 'Technician (Teknisi IT)', desc: 'Penanganan insiden, troubleshooting & resolusi' },
            { value: 'SPV', label: 'Supervisor (SPV)', desc: 'Review, verifikasi RCA & penutupan insiden (Close)' },
            { value: 'DEPT_HEAD', label: 'Dept Head (Manager)', desc: 'Full governance, approval, kelola arsip & user' }
        ];
    }, []);

    // Filtered users
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
            if (!matchesRole) return false;

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                String(u.nik).toLowerCase().includes(q) ||
                (u.nama && u.nama.toLowerCase().includes(q)) ||
                (u.dept && u.dept.toLowerCase().includes(q))
            );
        });
    }, [users, roleFilter, searchQuery]);

    // KPI Summary
    const stats = useMemo(() => {
        return {
            total: users.length,
            technician: users.filter(u => u.role === 'TECHNICIAN').length,
            spv: users.filter(u => u.role === 'SPV').length,
            deptHead: users.filter(u => u.role === 'DEPT_HEAD' || u.role === 'ADMIN').length
        };
    }, [users]);

    // Buka Modal Create
    const handleOpenCreate = () => {
        setModalMode('create');
        setSelectedUser(null);
        setFormData({
            nik: '',
            nama: '',
            dept: 'IT Infrastructure',
            role: 'TECHNICIAN',
            password: ''
        });
        setIsModalOpen(true);
    };

    // Buka Modal Edit
    const handleOpenEdit = (user) => {
        setModalMode('edit');
        setSelectedUser(user);
        setFormData({
            nik: user.nik,
            nama: user.nama || '',
            dept: user.dept || 'IT Infrastructure',
            role: user.role || 'TECHNICIAN',
            password: ''
        });
        setIsModalOpen(true);
    };

    // Buka Modal Reset Password
    const handleOpenPassword = (user) => {
        setModalMode('password');
        setSelectedUser(user);
        setFormData({
            nik: user.nik,
            nama: user.nama || '',
            dept: user.dept || '',
            role: user.role || 'TECHNICIAN',
            password: ''
        });
        setIsModalOpen(true);
    };

    // Submit Form (Create / Edit / Reset Password)
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (modalMode === 'create') {
            if (!formData.nik || !formData.nama || !formData.password) {
                showToast('warning', 'NIK, Nama, dan Password awal wajib diisi.');
                return;
            }
            try {
                const res = await createUserInDB(formData);
                if (res?.success) {
                    showToast('success', `Pengguna [${formData.nama}] berhasil didaftarkan.`);
                    setIsModalOpen(false);
                    fetchUsers();
                } else {
                    showToast('error', res?.error || 'Gagal menambahkan user.');
                }
            } catch (err) {
                showToast('error', 'Terjadi kesalahan sistem saat menyimpan user.');
            }
        } else if (modalMode === 'edit') {
            try {
                const res = await updateUserInDB(selectedUser.nik, {
                    nama: formData.nama,
                    dept: formData.dept,
                    role: formData.role
                });
                if (res?.success) {
                    showToast('success', `Profil [${formData.nama}] berhasil diperbarui.`);
                    setIsModalOpen(false);
                    fetchUsers();
                } else {
                    showToast('error', res?.error || 'Gagal memperbarui profil.');
                }
            } catch (err) {
                showToast('error', 'Terjadi kesalahan saat update profil.');
            }
        } else if (modalMode === 'password') {
            if (!formData.password || formData.password.length < 5) {
                showToast('warning', 'Password baru minimal 5 karakter.');
                return;
            }
            try {
                const res = await updateUserInDB(selectedUser.nik, {
                    password: formData.password
                });
                if (res?.success) {
                    showToast('success', `Password untuk [${selectedUser.nama}] berhasil direset.`);
                    setIsModalOpen(false);
                } else {
                    showToast('error', res?.error || 'Gagal mereset password.');
                }
            } catch (err) {
                showToast('error', 'Gagal mereset password pengguna.');
            }
        }
    };

    // Delete User Handler
    const handleDeleteUser = async (user) => {
        if (!isDeptHeadOrAdmin) {
            showToast('error', 'Hanya Dept Head atau Admin yang berhak menghapus akun pengguna.');
            return;
        }

        const confirmed = await showConfirm(
            'Hapus Akun Pengguna?',
            `Akun ${user.nama} (NIK: ${user.nik}) akan dihapus permanen dari sistem otorisasi database.`,
            'Ya, Hapus Akun'
        );

        if (!confirmed) return;

        try {
            const res = await deleteUserFromDB(user.nik);
            if (res?.success) {
                showToast('success', res.message || 'User berhasil dihapus.');
                fetchUsers();
            } else {
                showToast('error', res?.error || 'Gagal menghapus user.');
            }
        } catch (err) {
            showToast('error', 'Terjadi kesalahan server saat menghapus user.');
        }
    };

    // Jika diakses oleh selain SPV / DEPT_HEAD
    if (!canManageUsers) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/60 border border-slate-800 rounded-2xl text-center">
                <Shield className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
                <h3 className="text-lg font-bold text-slate-100 font-mono">Akses Terbatas (RBAC Restricted)</h3>
                <p className="text-sm text-slate-400 font-mono max-w-md mt-2">
                    Halaman Pengaturan Pengguna & Hak Akses hanya dapat diakses oleh peran <strong>Supervisor (SPV)</strong> dan <strong>Dept Head</strong>.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col gap-4 font-sans">
            {/* Header Title & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                            <span>Manajemen Pengguna & Otorisasi RBAC</span>
                        </h2>
                        <p className="text-xs text-slate-400 font-mono">
                            Hak Akses Multi-Level: Technician (Teknisi), SPV (Supervisor) & Dept Head (Manager)
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={fetchUsers}
                        disabled={isLoading}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
                        title="Segarkan Data Pengguna"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
                    </button>

                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all font-mono"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>TAMBAH PENGGUNA</span>
                    </button>
                </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-mono text-slate-400 uppercase font-bold">Total Pengguna Aktif</p>
                        <h4 className="text-xl font-extrabold text-slate-100 font-mono mt-0.5">{stats.total}</h4>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-xl text-slate-300">
                        <Users className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-mono text-cyan-400 uppercase font-bold">Technician (Teknisi)</p>
                        <h4 className="text-xl font-extrabold text-cyan-300 font-mono mt-0.5">{stats.technician}</h4>
                    </div>
                    <div className="p-2 bg-cyan-950/60 border border-cyan-800/60 rounded-xl text-cyan-400">
                        <UserCheck className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-mono text-purple-400 uppercase font-bold">Supervisor (SPV)</p>
                        <h4 className="text-xl font-extrabold text-purple-300 font-mono mt-0.5">{stats.spv}</h4>
                    </div>
                    <div className="p-2 bg-purple-950/60 border border-purple-800/60 rounded-xl text-purple-400">
                        <Shield className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-mono text-emerald-400 uppercase font-bold">Dept Head (Manager)</p>
                        <h4 className="text-xl font-extrabold text-emerald-300 font-mono mt-0.5">{stats.deptHead}</h4>
                    </div>
                    <div className="p-2 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-400">
                        <Building2 className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Table & Filtering */}
            <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3.5">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari NIK, nama pengguna, atau departemen..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-1.5 outline-none focus:border-blue-500 font-mono"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-1.5 outline-none font-mono"
                        >
                            <option value="ALL">Semua Peran ({users.length})</option>
                            <option value="TECHNICIAN">Technician ({stats.technician})</option>
                            <option value="SPV">Supervisor ({stats.spv})</option>
                            <option value="DEPT_HEAD">Dept Head ({stats.deptHead})</option>
                        </select>
                    </div>
                </div>

                {/* Users Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="text-[10px] text-slate-400 font-mono uppercase bg-slate-950/80 border-b border-slate-800">
                            <tr>
                                <th className="p-3">NIK</th>
                                <th className="p-3">Nama Pengguna</th>
                                <th className="p-3">Departemen</th>
                                <th className="p-3">Peran & Hak Akses</th>
                                <th className="p-3">Terdaftar Sejak</th>
                                <th className="p-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10 text-slate-500 italic text-xs">
                                        {isLoading ? 'Memuat data pengguna SQL Server...' : 'Tidak ada data pengguna yang sesuai kriteria.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isSelf = String(currentUser?.nik) === String(user.nik);
                                    const roleBadge = 
                                        user.role === 'DEPT_HEAD' || user.role === 'ADMIN'
                                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                            : user.role === 'SPV'
                                            ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                                            : 'bg-cyan-950/80 text-cyan-300 border-cyan-800';

                                    return (
                                        <tr key={user.nik} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="p-3 font-bold text-slate-200">
                                                {user.nik}
                                            </td>
                                            <td className="p-3 text-slate-100 font-medium font-sans">
                                                <div className="flex items-center gap-1.5">
                                                    <span>{user.nama}</span>
                                                    {isSelf && (
                                                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40">
                                                            Anda
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 text-slate-400">
                                                {user.dept || 'IT Infrastructure'}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${roleBadge}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-3 text-slate-400 text-[11px]">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID') : '-'}
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Edit Profil */}
                                                    <button
                                                        onClick={() => handleOpenEdit(user)}
                                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded border border-slate-700 transition-colors"
                                                        title="Edit Profil & Peran"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>

                                                    {/* Reset Password */}
                                                    <button
                                                        onClick={() => handleOpenPassword(user)}
                                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded border border-slate-700 transition-colors"
                                                        title="Reset Password Pengguna"
                                                    >
                                                        <Key className="w-3.5 h-3.5" />
                                                    </button>

                                                    {/* Hapus User */}
                                                    {!isSelf && (
                                                        <button
                                                            onClick={() => handleDeleteUser(user)}
                                                            className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded border border-rose-800/40 transition-colors"
                                                            title="Hapus Akun Pengguna"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DIALOG (CREATE / EDIT / RESET PASSWORD) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
                            <div className="flex items-center gap-2">
                                {modalMode === 'create' && <UserPlus className="w-4 h-4 text-blue-400" />}
                                {modalMode === 'edit' && <Edit className="w-4 h-4 text-blue-400" />}
                                {modalMode === 'password' && <Key className="w-4 h-4 text-amber-400" />}
                                <h3 className="text-sm font-bold text-slate-100 font-mono">
                                    {modalMode === 'create' && 'Tambah Pengguna Baru'}
                                    {modalMode === 'edit' && `Edit Pengguna: ${selectedUser?.nama}`}
                                    {modalMode === 'password' && `Reset Password: ${selectedUser?.nama}`}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-200 p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs font-mono">
                            {modalMode !== 'password' && (
                                <>
                                    <div>
                                        <label className="text-slate-400 block mb-1">Nomor Induk Karyawan (NIK):</label>
                                        <input
                                            type="text"
                                            required
                                            disabled={modalMode === 'edit'}
                                            placeholder="Contoh: 1005"
                                            value={formData.nik}
                                            onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-50"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-slate-400 block mb-1">Nama Lengkap Pengguna:</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Contoh: Budi Santoso"
                                            value={formData.nama}
                                            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-slate-400 block mb-1">Departemen / Divisi:</label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: IT Infrastructure"
                                            value={formData.dept}
                                            onChange={(e) => setFormData({ ...formData, dept: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-slate-400 block mb-1">Peran & Hak Akses (Role RBAC):</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                                        >
                                            {availableRoles.map(r => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-slate-400 mt-1 italic">
                                            {availableRoles.find(r => r.value === formData.role)?.desc}
                                        </p>
                                    </div>
                                </>
                            )}

                            {(modalMode === 'create' || modalMode === 'password') && (
                                <div>
                                    <label className="text-slate-400 block mb-1">
                                        {modalMode === 'create' ? 'Password Awal:' : 'Password Baru Pengguna:'}
                                    </label>
                                    <div className="relative">
                                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="password"
                                            required
                                            placeholder="Minimal 5 karakter..."
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl pl-8 pr-3 py-2 outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Modal Actions */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Simpan Perubahan</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
