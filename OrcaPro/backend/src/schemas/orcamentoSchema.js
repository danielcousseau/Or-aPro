const { z } = require('zod');

// Regras para os materiais que vão dentro do orçamento
const materialOrcamentoSchema = z.object({
    nome: z.string().min(1, "O nome do material é obrigatório"),
    valor: z.coerce.number().min(0, "O valor do material não pode ser negativo"),
    quantidade: z.coerce.number().positive("A quantidade deve ser maior que zero")
});

// Validação principal baseada no seu schema.prisma
const orcamentoSchema = z.object({
    titulo: z.string().min(3, "O título precisa ter no mínimo 3 caracteres"),
    clienteId: z.coerce.number().int().positive("Selecione um cliente válido"),
    tipoMaoDeObra: z.string().min(1, "Tipo de mão de obra é obrigatório"),
    maoDeObraValor: z.coerce.number().min(0, "Valor da mão de obra inválido"),
    tipoLucro: z.string().min(1, "Tipo de lucro é obrigatório"),
    lucroValor: z.coerce.number().min(0, "Valor do lucro inválido"),
    totalFinal: z.coerce.number().min(0, "Total final inválido"),
    tipoMovel: z.string().optional().nullable(),
    ambiente: z.string().optional().nullable(),
    medidas: z.string().optional().nullable(),
    prazo: z.string().optional().nullable(),
    pagamento: z.string().optional().nullable(),
    validade: z.string().optional().nullable(),
    observacoes: z.string().optional().nullable(),
    materiais: z.array(materialOrcamentoSchema).optional().default([])
});

module.exports = {
    orcamentoSchema
};