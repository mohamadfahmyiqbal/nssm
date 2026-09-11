import express from 'express';
import { getPollingTasks, submitPollingResults } from '../controllers/agentController.js';

const router = express.Router();

// Middleware sederhana untuk memvalidasi API Key Agent
const verifyAgent = (req, res, next) => {
    const apiKey = req.headers['x-agent-key'];
    if (apiKey !== (process.env.AGENT_API_KEY || 'default_secret_key')) {
        return res.status(401).json({ error: 'Unauthorized Agent' });
    }
    next();
};

router.get('/tasks', verifyAgent, getPollingTasks);
router.post('/results', verifyAgent, submitPollingResults);

export default router;
