"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clienteSchema = void 0;
const zod_1 = require("zod");
exports.clienteSchema = zod_1.z.object({
    nome: zod_1.z.string().trim().min(3, "O nome precisa ter no mínimo 3 caracteres"),
    cpfCnpj: zod_1.z.string().trim().optional().nullable().or(zod_1.z.literal('')),
    email: zod_1.z.string().trim().email("E-mail inválido").optional().nullable().or(zod_1.z.literal('')),
    telefone: zod_1.z.string().trim().min(8, "O telefone é obrigatório"),
    cidade: zod_1.z.string().trim().optional().nullable(),
    bairro: zod_1.z.string().trim().optional().nullable(),
    rua: zod_1.z.string().trim().optional().nullable(),
    numero: zod_1.z.string().trim().optional().nullable(),
    cep: zod_1.z.string().trim().optional().nullable(),
    observacoes: zod_1.z.string().trim().optional().nullable(),
    telegramChatId: zod_1.z.string().trim().optional().nullable().or(zod_1.z.literal(''))
});
