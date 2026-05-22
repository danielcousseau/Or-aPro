import { z } from 'zod';

export const clienteSchema = z.object({
    nome: z.string().trim().min(3, "O nome precisa ter no mínimo 3 caracteres"),
    cpfCnpj: z.string().trim().optional().nullable().or(z.literal('')),
    email: z.string().trim().email("E-mail inválido").optional().nullable().or(z.literal('')),
    telefone: z.string().trim().min(8, "O telefone é obrigatório"),
    cidade: z.string().trim().optional().nullable(),
    bairro: z.string().trim().optional().nullable(),
    rua: z.string().trim().optional().nullable(),
    numero: z.string().trim().optional().nullable(),
    cep: z.string().trim().optional().nullable(),
    observacoes: z.string().trim().optional().nullable(),
    telegramChatId: z.string().trim().optional().nullable().or(z.literal(''))
});
