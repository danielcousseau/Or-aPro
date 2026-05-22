import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export default function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('FATAL: JWT_SECRET não está definido nas variáveis de ambiente.');
        res.status(500).json({ error: 'Erro interno de configuração do servidor.' });
        return;
    }

    // Aceita Authorization: Bearer <token> (cross-origin, funciona no Safari/iOS)
    // ou cookie httpOnly como fallback (browsers que aceitam cookies cross-site)
    const authHeader = req.headers.authorization;
    const token = (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)
        ?? req.cookies?.token;

    if (!token) {
        res.status(401).json({ error: 'Não autenticado.' });
        return;
    }

    jwt.verify(token, jwtSecret, (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
        if (err) {
            res.status(401).json({ error: 'Token inválido ou expirado.' });
            return;
        }
        req.userId = (decoded as { id: number }).id;
        next();
    });
}
