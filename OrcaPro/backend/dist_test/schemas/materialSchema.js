"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.materialSchema = void 0;
const zod_1 = require("zod");
exports.materialSchema = zod_1.z.object({
    nome: zod_1.z.string().min(2, "O nome do material é obrigatório"),
    categoria: zod_1.z.string().optional().nullable(),
    valor: zod_1.z.number().min(0, "O valor não pode ser negativo"),
    unidade: zod_1.z.string().optional().nullable(),
    quantidadeEstoque: zod_1.z.number().min(0).optional().nullable(),
    estoqueMinimo: zod_1.z.number().min(0).optional().nullable()
});
