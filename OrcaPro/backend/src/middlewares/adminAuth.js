const prisma = require('../lib/prisma');

module.exports = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { isAdmin: true }
        });
        if (!user?.isAdmin) {
            return res.status(403).json({ error: 'Acesso restrito.' });
        }
        return next();
    } catch {
        return res.status(500).json({ error: 'Erro interno.' });
    }
};
