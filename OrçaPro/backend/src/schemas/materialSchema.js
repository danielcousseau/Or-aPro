const { z } = require('zod');

// Validação baseada na sua tabela de Materiais
const materialSchema = z.object({
    nome: z.string().min(2, "O nome do material é obrigatório"),
    categoria: z.string().optional().nullable(),
    valor: z.number().min(0, "O valor não pode ser negativo"),
    unidade: z.string().optional().nullable()
});

// Exportando do jeito certo
module.exports = {
    materialSchema
};