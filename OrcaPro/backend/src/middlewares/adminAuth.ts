import { Request, Response, NextFunction } from 'express';
import prisma = require('../lib/prisma');

export default async function adminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { isAdmin: true }
        });
        if (!user?.isAdmin) {
            res.status(403).json({ error: 'Acesso restrito.' });
            return;
        }
        next();
    } catch {
        res.status(500).json({ error: 'Erro interno.' });
    }
}
