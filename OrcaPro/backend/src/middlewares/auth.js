const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('FATAL: JWT_SECRET não está definido nas variáveis de ambiente.');
        return res.status(500).json({ error: 'Erro interno de configuração do servidor.' });
    }

    // Aceita Authorization: Bearer <token> (cross-origin, funciona no Safari/iOS)
    // ou cookie httpOnly como fallback (browsers que aceitam cookies cross-site)
    const authHeader = req.headers.authorization;
    const token = (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)
        ?? req.cookies?.token;

    if (!token) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Token inválido ou expirado.' });
        req.userId = decoded.id;
        return next();
    });
};
