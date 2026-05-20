const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middlewares/auth');
const adminAuth = require('../middlewares/adminAuth');

// Logs do próprio usuário
router.get('/', authMiddleware, async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            where: { userId: req.userId },
            orderBy: { criadoEm: 'desc' },
            take: 100,
        });
        return res.json(logs);
    } catch {
        return res.status(500).json({ error: 'Erro ao buscar logs.' });
    }
});

// Logs de todos os usuários (admin)
router.get('/admin', authMiddleware, adminAuth, async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { criadoEm: 'desc' },
            take: 500,
            include: {
                user: { select: { id: true, usuario: true, name: true } }
            }
        });
        return res.json(logs);
    } catch {
        return res.status(500).json({ error: 'Erro ao buscar logs.' });
    }
});

module.exports = router;
