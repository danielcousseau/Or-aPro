const { ZodError } = require('zod');

module.exports = (schema) => async (req, res, next) => {
    // Verifica se o schema foi passado corretamente para o middleware
    if (!schema) {
        return res.status(500).json({ error: 'Erro interno: Schema de validação não definido ou importado incorretamente nas rotas.' });
    }

    try {
        // [SecOps] Usa parseAsync para não bloquear a thread principal (previne DoS).
        // Também permite que os schemas do Zod tenham validações assíncronas no futuro.
        req.body = await schema.parseAsync(req.body);
        next(); // Se passar, vai pro Controller
    } catch (error) {
        if (error instanceof ZodError) {
            // [SecOps] Retorna APENAS os dados necessários.
            // A estrutura evita o vazamento de Stack Traces para o cliente final.
            return res.status(400).json({
                error: 'Dados inválidos enviados no formulário',
                details: error.errors.map(err => ({
                    campo: err.path.join('.'),
                    mensagem: err.message
                }))
            });
        }
        // [Clean Code] Repassa erros internos inesperados para o Error Handler global do Express
        next(error);
    }
};