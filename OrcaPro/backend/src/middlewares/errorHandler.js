// Middleware de erro global — deve ser o ÚLTIMO app.use() no server.js.
// Express o identifica como error handler pelo fato de ter 4 parâmetros (err, req, res, next).
module.exports = (err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.path}`, err);

    // Erros conhecidos do Prisma
    if (err.code === 'P2002') {
        return res.status(409).json({ error: 'Este registro já existe.' });
    }
    if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Registro não encontrado.' });
    }
    if (err.code === 'P2003') {
        return res.status(400).json({ error: 'Referência inválida: o recurso relacionado não existe.' });
    }

    // Erros de validação do Zod passados via next(err)
    if (err.name === 'ZodError') {
        return res.status(400).json({ error: 'Dados inválidos.', details: err.errors });
    }

    // Erro com status definido explicitamente (ex: throw Object.assign(new Error('...'), { status: 403 }))
    const status = err.status || 500;
    const message = status < 500 ? err.message : 'Erro interno do servidor.';

    return res.status(status).json({ error: message });
};
