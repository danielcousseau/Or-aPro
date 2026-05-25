"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = adminAuth;
const prisma = require("../lib/prisma");
async function adminAuth(req, res, next) {
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
    }
    catch {
        res.status(500).json({ error: 'Erro interno.' });
    }
}
