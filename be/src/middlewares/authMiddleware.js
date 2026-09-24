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
        req.user = decoded; // Menyisipkan data payload token (nik, nama, dept, role)
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Sesi berakhir atau Token tidak valid (401).' });
    }
};

/**
 * Middleware Generic: RBAC Role Matching
 * Roles: 'TECHNICIAN' | 'SPV' | 'DEPT_HEAD' | 'ADMIN'
 */
export const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Pengguna belum terotentikasi.' });
        }

        const userRole = (req.user.role || '').toUpperCase().replace(/\s+/g, '_');
        const normalizedAllowed = allowedRoles.map(r => r.toUpperCase().replace(/\s+/g, '_'));

        // Admin selalu memiliki akses penuh (Superuser)
        if (userRole === 'ADMIN' || normalizedAllowed.includes(userRole)) {
            return next();
        }

        return res.status(403).json({
            error: `Akses ditolak. Diperlukan hak akses: [${allowedRoles.join(', ')}]. Role Anda saat ini: ${req.user.role || 'Unknown'}`
        });
    };
};

export const requireAdmin = requireRoles('ADMIN');
export const requireDeptHead = requireRoles('DEPT_HEAD', 'DEPT HEAD', 'MANAGER');
export const requireSpv = requireRoles('SPV', 'SUPERVISOR', 'SECTION_HEAD', 'DEPT_HEAD', 'ADMIN');
export const requireTechnician = requireRoles('TECHNICIAN', 'TEKNISI', 'STAFF', 'SPV', 'DEPT_HEAD', 'ADMIN');