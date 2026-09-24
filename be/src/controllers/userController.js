import bcrypt from 'bcryptjs';
import Akses from '../models/Akses.js';

/**
 * Controller Manajemen Pengguna & Hak Akses (RBAC)
 * Dapat diakses oleh SPV dan Dept Head
 */

// 1. Get All Users
export const getAllUsers = async (req, res) => {
    try {
        const users = await Akses.findAll({
            attributes: ['NIK', 'NAMA', 'DEPT', 'AKSES'],
            order: [['NIK', 'ASC']]
        });

        const formatted = users.map(u => ({
            nik: u.NIK,
            nama: u.NAMA,
            dept: u.DEPT,
            role: (u.AKSES || 'TECHNICIAN').toUpperCase()
        }));

        res.status(200).json({
            success: true,
            data: formatted
        });
    } catch (error) {
        console.error('❌ [getAllUsers Error]:', error);
        res.status(500).json({ success: false, error: 'Gagal mengambil data user.' });
    }
};

// 2. Create User Baru
export const createUser = async (req, res) => {
    const { nik, nama, dept, password, role } = req.body;

    if (!nik || !nama || !password) {
        return res.status(400).json({ success: false, error: 'NIK, Nama, dan Password wajib diisi.' });
    }

    try {
        const existing = await Akses.findOne({ where: { NIK: nik } });
        if (existing) {
            return res.status(400).json({ success: false, error: `User dengan NIK ${nik} sudah terdaftar.` });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const assignedRole = (role || 'TECHNICIAN').toUpperCase();

        const newUser = await Akses.create({
            NIK: nik,
            NAMA: nama,
            DEPT: dept || 'IT Infrastructure',
            PASS: hashedPassword,
            AKSES: assignedRole
        });

        res.status(201).json({
            success: true,
            message: 'User berhasil ditambahkan.',
            data: {
                nik: newUser.NIK,
                nama: newUser.NAMA,
                dept: newUser.DEPT,
                role: newUser.AKSES
            }
        });
    } catch (error) {
        console.error('❌ [createUser Error]:', error);
        res.status(500).json({ success: false, error: 'Gagal menyimpan user baru.' });
    }
};

// 3. Update User (Role, Nama, Dept, atau Reset Password)
export const updateUser = async (req, res) => {
    const { nik } = req.params;
    const { nama, dept, role, password } = req.body;

    try {
        const user = await Akses.findOne({ where: { NIK: nik } });
        if (!user) {
            return res.status(404).json({ success: false, error: `User dengan NIK ${nik} tidak ditemukan.` });
        }

        const updateData = {};
        if (nama !== undefined) updateData.NAMA = nama;
        if (dept !== undefined) updateData.DEPT = dept;
        if (role !== undefined) updateData.AKSES = role.toUpperCase();
        if (password && password.trim() !== '') {
            updateData.PASS = await bcrypt.hash(password, 10);
        }

        await user.update(updateData);

        res.status(200).json({
            success: true,
            message: `Data user ${user.NAMA} berhasil diperbarui.`,
            data: {
                nik: user.NIK,
                nama: user.NAMA,
                dept: user.DEPT,
                role: user.AKSES
            }
        });
    } catch (error) {
        console.error('❌ [updateUser Error]:', error);
        res.status(500).json({ success: false, error: 'Gagal memperbarui data user.' });
    }
};

// 4. Delete User (Khusus DEPT HEAD / ADMIN)
export const deleteUser = async (req, res) => {
    const { nik } = req.params;

    try {
        const user = await Akses.findOne({ where: { NIK: nik } });
        if (!user) {
            return res.status(404).json({ success: false, error: `User dengan NIK ${nik} tidak ditemukan.` });
        }

        await user.destroy();

        res.status(200).json({
            success: true,
            message: `User ${user.NAMA} (${user.NIK}) berhasil dihapus.`
        });
    } catch (error) {
        console.error('❌ [deleteUser Error]:', error);
        res.status(500).json({ success: false, error: 'Gagal menghapus user.' });
    }
};
