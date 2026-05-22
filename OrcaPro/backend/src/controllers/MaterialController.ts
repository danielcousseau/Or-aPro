import { Request, Response } from 'express';
import prisma = require('../lib/prisma');
import MATERIAIS_PADRAO from '../constants/materiaisPadrao';
import { registrar } from '../services/audit';

export default {
    async listar(req: Request, res: Response): Promise<void> {
        try {
            let materiais = await prisma.material.findMany({
                where: { userId: req.userId },
                orderBy: { createdAt: 'desc' }
            });

            const nomesExistentes = new Set(materiais.map(m => m.nome));
            const faltando = MATERIAIS_PADRAO.filter(m => !nomesExistentes.has(m.nome));
            if (faltando.length > 0) {
                await prisma.material.createMany({
                    data: faltando.map(m => ({ ...m, userId: req.userId! }))
                });
                materiais = await prisma.material.findMany({
                    where: { userId: req.userId },
                    orderBy: { nome: 'asc' }
                });
            }

            res.json(materiais);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao listar materiais' });
        }
    },

    async criar(req: Request, res: Response): Promise<void> {
        try {
            const dados = req.body;
            const novoMaterial = await prisma.material.create({
                data: { ...dados, userId: req.userId! }
            });
            await registrar(req.userId!, 'criou', 'Material', novoMaterial.id, novoMaterial.nome);
            res.status(201).json(novoMaterial);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao criar material' });
        }
    },

    async atualizar(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const pertence = await prisma.material.findFirst({ where: { id: Number(id), userId: req.userId } });
            if (!pertence) {
                res.status(403).json({ error: 'Acesso negado' });
                return;
            }

            const dados = req.body;
            const materialAtualizado = await prisma.material.update({
                where: { id: Number(id) },
                data: dados
            });
            await registrar(req.userId!, 'atualizou', 'Material', materialAtualizado.id, materialAtualizado.nome);
            res.json(materialAtualizado);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao atualizar material' });
        }
    },

    async excluir(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const pertence = await prisma.material.findFirst({ where: { id: Number(id), userId: req.userId } });
            if (!pertence) {
                res.status(403).json({ error: 'Acesso negado' });
                return;
            }

            await registrar(req.userId!, 'excluiu', 'Material', pertence.id, pertence.nome);
            await prisma.material.delete({ where: { id: Number(id) } });
            res.json({ message: 'Material excluído com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao excluir material' });
        }
    }
};
