import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Database & Config
import { testDbConnection } from './src/config/database.js';
import { Op } from 'sequelize';
import cron from 'node-cron';

// Routes & Middlewares
import apiRoutes from './src/routes/apiRoutes.js';

// Polling Worker Engine
import { initWorker } from './src/queues/pollWorker.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'Secret_Key_Default';

// ==========================================
// 1. GLOBAL MIDDLEWARES
// ==========================================
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 2. WEBSOCKET SERVER SETUP (SOCKET.IO)
// ==========================================
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

// Socket.IO Middleware: Authenticate Connection with JWT (Temporarily Disabled)
io.use((socket, next) => {
    // [TEMPORARY] Bypass JWT Auth agar frontend bisa konek tanpa login sungguhan
    socket.user = { nama: 'Dev User', nik: '000000' };
    next();
});

// Socket.IO Connection Lifecycle
io.on('connection', (socket) => {
    const userInfo = socket.user?.nama || socket.user?.nik || 'Unknown User';
    console.log(`⚡ [Socket.io] Client Connected: ${socket.id} (User: ${userInfo})`);

    socket.on('disconnect', (reason) => {
        console.log(`❌ [Socket.io] Client Disconnected: ${socket.id} (Reason: ${reason})`);
    });
});

// Inject Socket.IO instance to HTTP Request context
app.use((req, res, next) => {
    req.io = io;
    next();
});

// ==========================================
// 3. API ROUTES & ERROR HANDLING
// ==========================================
app.use('/api', apiRoutes);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('🔥 [Unhandled Error]:', err.stack);
    res.status(500).json({
        error: 'Terjadi kesalahan internal pada server.',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

import Setting from './src/models/Setting.js';
import DeviceLog from './src/models/DeviceLog.js';
import TopologyDrawing from './src/models/TopologyDrawing.js';

// ==========================================
// 4. SERVER BOOTSTRAP & WORKER INITIALIZATION
// ==========================================
const startServer = async () => {
    // Tes koneksi database SQL
    await testDbConnection();

    // Pastikan tabel tercipta sebelum server listen
    try {
        await Setting.sync();
        await DeviceLog.sync();
        await TopologyDrawing.sync();
        console.log('✅ [Sequelize ORM] Setting, DeviceLog & TopologyDrawing tables synchronized.');
    } catch (err) {
        console.error('❌ [Sequelize ORM] Failed to sync tables:', err.message);
    }

    server.listen(PORT, () => {
        console.log(`🚀 [NTMS Backend] Server running on http://pik1com074.local.ikoito.co.id:${PORT}`);
        
        // Cron Job: Hapus log DeviceLog yang lebih lama dari 7 hari (berjalan setiap hari jam 00:00)
        cron.schedule('0 0 * * *', async () => {
            try {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                
                const deletedCount = await DeviceLog.destroy({
                    where: {
                        createdAt: {
                            [Op.lt]: sevenDaysAgo
                        }
                    }
                });
                
                if (deletedCount > 0) {
                    console.log(`🧹 [Cron] Berhasil menghapus ${deletedCount} baris log DeviceLog (Lebih lama dari 7 hari).`);
                }
            } catch (error) {
                console.error('❌ [Cron Error] Gagal menghapus log DeviceLog:', error.message);
            }
        });
        console.log('✅ [Cron] Log cleanup scheduler aktif (Setiap hari pukul 00:00).');

        // Inisialisasi polling engine berbasis Cron / Queue
        console.log('🔄 Memulai Polling Worker internal...');
        initWorker(io);
    });
};

startServer();

export { io };