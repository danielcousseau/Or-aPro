import { z } from "zod";

export const configBaseSchema = z.object({
  espEstrutura: z.number().int().positive().optional(),
  espFundo: z.number().int().positive().optional(),
  rasgoProfundidade: z.number().int().positive().optional(),
  rasgoBorda: z.number().int().positive().optional(),
  folgaPorta: z.number().int().positive().optional(),
  avancoTamponamento: z.number().int().positive().optional(),
  larguraReforco: z.number().int().positive().optional(),
  larguraTiraOculta: z.number().int().positive().optional(),
  kerfSerra: z.number().int().positive().optional(),
  margemPerda: z.number().min(0).max(1).optional(),
  recuoPrateleira: z.number().int().positive().optional(),
  folgaPrateleiraLat: z.number().int().positive().optional(),
  folgaAlturaGaveta: z.number().int().positive().optional(),
  corCaixaInterna: z.string().min(1).optional(),
  chapaLargura: z.number().int().positive().optional(),
  chapaAltura: z.number().int().positive().optional(),
  configurado: z.boolean().optional(),
});

export const tipoMovelSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  tamponamentoTampo: z.boolean().default(false),
  tamponamentoLaterais: z.boolean().default(false),
  tamponamentoBase: z.boolean().default(false),
  tipoPorta: z.enum(["SOBREPOSTA", "EMBUTIDA", "MEIA"]).default("SOBREPOSTA"),
});

export const chapaSchema = z.object({
  cor: z.string().min(1, "Cor obrigatória"),
  espessura: z.number().int().positive(),
  precoChapa: z.number().positive("Preço deve ser positivo"),
});

export const fitaSchema = z.object({
  cor: z.string().min(1, "Cor obrigatória"),
  largura: z.number().int().positive(),
  precoMetro: z.number().positive("Preço deve ser positivo"),
});

export const ferragemSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  tipo: z.enum(["DOBRADICA", "PUXADOR", "PE", "OUTRO"]),
  unidade: z.enum(["un", "par"]),
  preco: z.number().positive("Preço deve ser positivo"),
});

export const correducaSchema = z.object({
  tipo: z.enum(["TELESCOPICA", "INVISIVEL"]),
  nome: z.string().min(1, "Nome obrigatório"),
  descontoLarguraMm: z.number().int().positive("Desconto deve ser positivo"),
  comprimentos: z
    .string()
    .min(1, "Informe os comprimentos separados por vírgula"),
});

const gavetaInputSchema = z.object({
  alturaFrente: z.number().positive(),
  descontoLarguraMm: z.number().positive(),
  comprimentoCorredica: z.number().positive(),
});

const frenteInputSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("PORTAS"),
    nPortas: z.number().int().min(1).max(8),
  }),
  z.object({
    tipo: z.literal("GAVETAS"),
    gavetas: z.array(gavetaInputSchema).min(1),
  }),
]);

const secaoFrenteSchema = z.object({
  tamanhoMm: z.number().positive("Tamanho da seção obrigatório"),
  conteudo: frenteInputSchema,
});

export const calcularMovelSchema = z
  .object({
    largura: z.number().positive("Largura obrigatória"),
    altura: z.number().positive("Altura obrigatória"),
    profundidade: z.number().positive("Profundidade obrigatória"),
    tipoTampo: z.enum(["MDF", "PEDRA"]),
    corAcabamento: z.string().min(1),
    corFundo: z.string().min(1),
    ladoOcultoNaCor: z.boolean(),
    tamponamentoTampo: z.boolean(),
    tamponamentoLaterais: z.boolean(),
    tamponamentoBase: z.boolean(),
    tipoPorta: z.enum(["SOBREPOSTA", "EMBUTIDA", "MEIA"]),
    // Modelo antigo (frente única) OU modelo novo (seções) — ao menos um
    frente: frenteInputSchema.optional(),
    orientacaoSecoes: z.enum(["HORIZONTAL", "VERTICAL"]).optional(),
    secoes: z.array(secaoFrenteSchema).min(1).optional(),
    nPrateleiras: z.number().int().min(0),
  })
  .refine((d) => d.frente !== undefined || (d.secoes?.length ?? 0) > 0, {
    message: "Informe a frente (frente) ou as seções (secoes).",
    path: ["frente"],
  });
