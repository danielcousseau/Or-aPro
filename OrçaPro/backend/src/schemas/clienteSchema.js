const { z } = require('zod');

// Validação exata com base no seu schema.prisma
const clienteSchema = z.object({
    nome: z.string().min(3, "O nome precisa ter no mínimo 3 caracteres"),
    cpfCnpj: z.string().optional().nullable().or(z.literal('')),
    email: z.string().email("E-mail inválido").optional().nullable().or(z.literal('')),
    telefone: z.string().min(8, "O telefone é obrigatório"),
    cidade: z.string().optional().nullable(),
    bairro: z.string().optional().nullable(),
    numero: z.string().optional().nullable(),
    cep: z.string().optional().nullable(),
    observacoes: z.string().optional().nullable()
});

// Exportando do jeito certo (com chaves)
module.exports = {
    clienteSchema
};