// middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'Secret_Key_Default';

/**
 * Middleware: Validasi Token JWT dari Header Authorization
 */
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan (401).' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Menyisipkan data payload token (userId, role) ke request object
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Sesi berakhir atau Token tidak valid (401).' });
    }
};

/**
 * Middleware: RBAC (Role-Based Access Control) khusus Admin
 */
export const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        return res.status(403).json({ error: 'Akses ditolak. Fitur ini membutuhkan hak akses Admin (403).' });
    }
};