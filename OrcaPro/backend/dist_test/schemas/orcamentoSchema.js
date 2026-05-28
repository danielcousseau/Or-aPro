"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orcamentoSchema = void 0;
const zod_1 = require("zod");
const materialOrcamentoSchema = zod_1.z.object({
  nome: zod_1.z.string().min(1, "O nome do material é obrigatório"),
  valor: zod_1.z.coerce
    .number()
    .min(0, "O valor do material não pode ser negativo"),
  quantidade: zod_1.z.coerce
    .number()
    .positive("A quantidade deve ser maior que zero"),
});
exports.orcamentoSchema = zod_1.z.object({
  titulo: zod_1.z
    .string()
    .min(3, "O título precisa ter no mínimo 3 caracteres"),
  clienteId: zod_1.z.coerce
    .number()
    .int()
    .positive("Selecione um cliente válido"),
  tipoMaoDeObra: zod_1.z.string().min(1, "Tipo de mão de obra é obrigatório"),
  maoDeObraValor: zod_1.z.coerce
    .number()
    .min(0, "Valor da mão de obra inválido"),
  maoDeObraQtde: zod_1.z.coerce.number().min(0).optional().default(1),
  tipoLucro: zod_1.z.string().min(1, "Tipo de lucro é obrigatório"),
  lucroValor: zod_1.z.coerce.number().min(0, "Valor do lucro inválido"),
  lucroQtde: zod_1.z.coerce.number().min(0).optional().default(1),
  totalFinal: zod_1.z.coerce.number().min(0, "Total final inválido"),
  tipoMovel: zod_1.z.string().optional().nullable(),
  ambiente: zod_1.z.string().optional().nullable(),
  medidas: zod_1.z.string().optional().nullable(),
  prazo: zod_1.z.string().optional().nullable(),
  pagamento: zod_1.z.string().optional().nullable(),
  validade: zod_1.z.string().optional().nullable(),
  observacoes: zod_1.z.string().optional().nullable(),
  materiais: zod_1.z.array(materialOrcamentoSchema).optional().default([]),
});
