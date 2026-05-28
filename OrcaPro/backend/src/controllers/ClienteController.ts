import { Request, Response } from "express";
import prisma = require("../lib/prisma");
import { registrar } from "../services/audit";

export default {
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const clientes = await prisma.cliente.findMany({
        where: { userId: req.userId },
      });
      res.json(clientes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao listar clientes" });
    }
  },

  async criar(req: Request, res: Response): Promise<void> {
    try {
      const dados = req.body;
      const novoCliente = await prisma.cliente.create({
        data: { ...dados, userId: req.userId! },
      });
      await registrar(
        req.userId!,
        "criou",
        "Cliente",
        novoCliente.id,
        novoCliente.nome,
      );
      res.status(201).json(novoCliente);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao criar cliente" });
    }
  },

  async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dados = req.body;

      const pertence = await prisma.cliente.findFirst({
        where: { id: Number(id), userId: req.userId },
      });
      if (!pertence) {
        res.status(403).json({ error: "Acesso negado" });
        return;
      }

      const clienteAtualizado = await prisma.cliente.update({
        where: { id: Number(id) },
        data: {
          nome: dados.nome,
          cpfCnpj: dados.cpfCnpj,
          email: dados.email,
          telefone: dados.telefone,
          cidade: dados.cidade,
          bairro: dados.bairro,
          rua: dados.rua,
          numero: dados.numero,
          cep: dados.cep,
          observacoes: dados.observacoes,
          telegramChatId:
            dados.telegramChatId !== undefined
              ? dados.telegramChatId
              : pertence.telegramChatId,
        },
      });

      await registrar(
        req.userId!,
        "atualizou",
        "Cliente",
        clienteAtualizado.id,
        clienteAtualizado.nome,
      );
      res.json(clienteAtualizado);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao atualizar cliente" });
    }
  },

  async excluir(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const pertence = await prisma.cliente.findFirst({
        where: { id: Number(id), userId: req.userId },
      });
      if (!pertence) {
        res.status(403).json({ error: "Acesso negado" });
        return;
      }

      const totalOrcamentos = await prisma.orcamento.count({
        where: { clienteId: Number(id) },
      });
      if (totalOrcamentos > 0) {
        res.status(409).json({
          error: `Este cliente possui ${totalOrcamentos} orçamento(s) vinculado(s). Exclua os orçamentos antes de excluir o cliente.`,
        });
        return;
      }

      await registrar(
        req.userId!,
        "excluiu",
        "Cliente",
        pertence.id,
        pertence.nome,
      );
      await prisma.cliente.delete({ where: { id: Number(id) } });

      res.json({ message: "Cliente excluído com sucesso!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao excluir cliente." });
    }
  },

  async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const cliente = await prisma.cliente.findFirst({
        where: { id: Number(id), userId: req.userId },
      });

      if (!cliente) {
        res.status(404).json({ error: "Cliente não encontrado" });
        return;
      }

      res.json(cliente);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar cliente" });
    }
  },
};
