import { Request, Response } from 'express';
import prisma = require('../lib/prisma');

export default {
    async listar(req: Request, res: Response): Promise<void> {
        try {
            const { orcamentoId } = req.params;

            const orcamento = await prisma.orcamento.findFirst({
                where: { id: Number(orcamentoId), userId: req.userId }
            });
            if (!orcamento) {
                res.status(403).json({ error: 'Acesso negado' });
                return;
            }

            const pagamentos = await prisma.pagamento.findMany({
                where: { orcamentoId: Number(orcamentoId) },
                orderBy: { dataPagamento: 'asc' }
            });
            res.json(pagamentos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao listar pagamentos' });
        }
    },

    async criar(req: Request, res: Response): Promise<void> {
        try {
            const { orcamentoId } = req.params;
            const { descricao, valor, dataPagamento } = req.body;

            const orcamento = await prisma.orcamento.findFirst({
                where: { id: Number(orcamentoId), userId: req.userId }
            });
            if (!orcamento) {
                res.status(403).json({ error: 'Acesso negado' });
                return;
            }

            const pagamento = await prisma.pagamento.create({
                data: {
                    orcamentoId: Number(orcamentoId),
                    descricao,
                    valor: Number(valor),
                    dataPagamento: dataPagamento ? new Date(dataPagamento) : new Date()
                }
            });
            res.status(201).json(pagamento);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao registrar pagamento' });
        }
    },

    async excluir(req: Request, res: Response): Promise<void> {
        try {
            const { orcamentoId, id } = req.params;

            const orcamento = await prisma.orcamento.findFirst({
                where: { id: Number(orcamentoId), userId: req.userId }
            });
            if (!orcamento) {
                res.status(403).json({ error: 'Acesso negado' });
                return;
            }

            const pagamento = await prisma.pagamento.findFirst({
                where: { id: Number(id), orcamentoId: Number(orcamentoId) }
            });
            if (!pagamento) {
                res.status(404).json({ error: 'Pagamento não encontrado' });
                return;
            }

            await prisma.pagamento.delete({ where: { id: Number(id) } });
            res.json({ message: 'Pagamento excluído' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao excluir pagamento' });
        }
    },

    async listarTodos(req: Request, res: Response): Promise<void> {
        try {
            const orcamentos = await prisma.orcamento.findMany({
                where: { userId: req.userId, totalFinal: { gt: 0 } },
                select: {
                    id: true,
                    titulo: true,
                    totalFinal: true,
                    status: true,
                    createdAt: true,
                    cliente: { select: { nome: true } },
                    pagamentos: {
                        select: { id: true, descricao: true, valor: true, dataPagamento: true },
                        orderBy: { dataPagamento: 'asc' }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(orcamentos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao listar financeiro' });
        }
    }
};
