const { ZodError } = require('zod');

module.exports = (schema) => (req, res, next) => {
    // Verifica se o schema foi passado corretamente para o middleware
    if (!schema) {
        return res.status(500).json({ error: 'Erro interno: Schema de validação não definido ou importado incorretamente nas rotas.' });
    }

    try {
        // Tenta validar os dados do corpo da requisição (req.body)
        req.body = schema.parse(req.body);
        next(); // Se passar, vai pro Controller
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: 'Dados inválidos enviados no formulário',
                details: error.errors.map(err => ({
                    campo: err.path.join('.'),
                    mensagem: err.message
                }))
            });
        }
        next(error);
    }
};