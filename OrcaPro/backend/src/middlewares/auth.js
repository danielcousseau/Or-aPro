const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('FATAL: JWT_SECRET não está definido nas variáveis de ambiente.');
        return res.status(500).json({ error: 'Erro interno de configuração do servidor.' });
    }

    // Lê o access token do cookie httpOnly (não acessível por JavaScript — protege contra XSS)
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Token inválido ou expirado.' });
        req.userId = decoded.id;
        return next();
    });
};
