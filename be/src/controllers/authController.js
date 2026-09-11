// controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Akses from '../models/Akses.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'Secret_Key_Default';

export const loginUser = async (req, res) => {
    const { nik, password } = req.body;

    if (!nik || !password) {
        return res.status(400).json({ error: 'NIK dan Password wajib diisi.' });
    }

    try {
        // 1. Query menggunakan Sequelize ORM
        const user = await Akses.findOne({ where: { NIK: nik } });

        if (!user) {
            return res.status(401).json({ error: 'Kredensial tidak valid (NIK tidak ditemukan).' });
        }

        // 2. Validasi Password
        const isPasswordValid = await bcrypt.compare(password, user.PASS);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Kredensial tidak valid (Password salah).' });
        }

        // 3. Generate Token JWT
        const token = jwt.sign(
            { nik: user.NIK, nama: user.NAMA, dept: user.DEPT, role: user.AKSES },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        // 4. Update Token menggunakan ORM
        await user.update({ TOKEN: token });

        res.status(200).json({
            message: 'Login Berhasil',
            token,
            user: {
                nik: user.NIK,
                nama: user.NAMA,
                dept: user.DEPT,
                role: user.AKSES,
            },
        });
    } catch (error) {
        console.error('❌ [Auth ORM Error]:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server saat otentikasi.' });
    }
};