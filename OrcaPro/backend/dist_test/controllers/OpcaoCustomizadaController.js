"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma = require("../lib/prisma");
const TIPOS_VALIDOS = [
  "ambiente",
  "pagamento",
  "material_categoria",
  "material_unidade",
];
exports.default = {
  async listar(req, res) {
    try {
      const { tipo } = req.query;
      if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
        res.status(400).json({ error: "Tipo inválido." });
        return;
      }
      const opcoes = await prisma.opcaoCustomizada.findMany({
        where: { userId: req.userId, tipo: tipo },
        orderBy: { nome: "asc" },
        select: { id: true, nome: true },
      });
      res.json(opcoes);
    } catch (error) {
      console.error("[OpcaoCustomizada.listar]", error);
      res.status(500).json({ error: "Erro ao listar opções." });
    }
  },
  async criar(req, res) {
    try {
      const { tipo, nome } = req.body;
      if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
        res.status(400).json({ error: "Tipo inválido." });
        return;
      }
      if (!nome || !nome.trim()) {
        res.status(400).json({ error: "Nome é obrigatório." });
        return;
      }
      const nomeLimpo = nome.trim();
      try {
        const opcao = await prisma.opcaoCustomizada.create({
          data: { tipo, nome: nomeLimpo, userId: req.userId },
        });
        res.status(201).json(opcao);
      } catch (createError) {
        // P2002 = violação de unique (opção já existe) — trata como sucesso
        if (
          typeof createError === "object" &&
          createError !== null &&
          "code" in createError &&
          createError.code === "P2002"
        ) {
          const existente = await prisma.opcaoCustomizada.findFirst({
            where: { tipo, nome: nomeLimpo, userId: req.userId },
            select: { id: true, nome: true },
          });
          res.status(200).json(existente);
          return;
        }
        throw createError;
      }
    } catch (error) {
      console.error("[OpcaoCustomizada.criar]", error);
      res.status(500).json({ error: "Erro ao salvar opção." });
    }
  },
  async excluir(req, res) {
    try {
      const id = Number(req.params.id);
      const opcao = await prisma.opcaoCustomizada.findFirst({
        where: { id, userId: req.userId },
      });
      if (!opcao) {
        res.status(404).json({ error: "Opção não encontrada." });
        return;
      }
      await prisma.opcaoCustomizada.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      console.error("[OpcaoCustomizada.excluir]", error);
      res.status(500).json({ error: "Erro ao excluir opção." });
    }
  },
};
