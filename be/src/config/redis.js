// config/redis.js
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    maxRetriesPerRequest: null, // Wajib null untuk BullMQ
};

const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
    console.log('✅ [Redis/Memurai] Connected to Redis Service.');
});

redisClient.on('error', (err) => {
    console.error('❌ [Redis/Memurai] Connection Error:', err);
});

export { redisConfig };
export default redisClient;