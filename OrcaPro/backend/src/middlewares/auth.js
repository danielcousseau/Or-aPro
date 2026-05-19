const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Se não mandou o cabeçalho de autorização, bloqueia
    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido.' });
    }

    // O token vem no formato "Bearer asdjklh12389...", precisamos separar
    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
        return res.status(401).json({ error: 'Erro no formato do token.' });
    }

    const [scheme, token] = parts;
    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ error: 'Token mal formatado.' });
    }

    // Verifica se o token é verdadeiro e não expirou
    jwt.verify(token, process.env.JWT_SECRET || 'segredo_super_seguro_orcamento', (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Token inválido ou expirado.' });
        
        // [SaaS] A MÁGICA: Pega o ID do usuário de dentro do crachá e cola na requisição
        req.userId = decoded.id;
        
        return next(); // Tudo certo! Permite que a requisição continue para o Controller
    });
};