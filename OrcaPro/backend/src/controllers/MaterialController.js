const prisma = require('../lib/prisma');
const MATERIAIS_PADRAO = require('../constants/materiaisPadrao');
const { registrar } = require('../services/audit');

module.exports = {
    async listar(req, res) {
        try {
            let materiais = await prisma.material.findMany({
                where: { userId: req.userId },
                orderBy: { createdAt: 'desc' }
            });

            // Injeta materiais padrão que ainda não existem para este usuário (por nome)
            const nomesExistentes = new Set(materiais.map(m => m.nome));
            const faltando = MATERIAIS_PADRAO.filter(m => !nomesExistentes.has(m.nome));
            if (faltando.length > 0) {
                await prisma.material.createMany({
                    data: faltando.map(m => ({ ...m, userId: req.userId }))
                });
                materiais = await prisma.material.findMany({
                    where: { userId: req.userId },
                    orderBy: { nome: 'asc' }
                });
            }

            return res.json(materiais);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao listar materiais' });
        }
    },

    async criar(req, res) {
        try {
            const dados = req.body; // Zod já validou e converteu os dados
            const novoMaterial = await prisma.material.create({
                data: {
                    ...dados,
                    userId: req.userId // [SaaS]
                }
            });
            await registrar(req.userId, 'criou', 'Material', novoMaterial.id, novoMaterial.nome);
            return res.status(201).json(novoMaterial);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao criar material' });
        }
    },

    async atualizar(req, res) {
        try {
            const { id } = req.params;
            
            const pertence = await prisma.material.findFirst({ where: { id: Number(id), userId: req.userId } });
            if (!pertence) return res.status(403).json({ error: 'Acesso negado' });

            const dados = req.body; // Zod já validou e converteu os dados
            const materialAtualizado = await prisma.material.update({
                where: { id: Number(id) },
                data: dados
            });
            await registrar(req.userId, 'atualizou', 'Material', materialAtualizado.id, materialAtualizado.nome);
            return res.json(materialAtualizado);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao atualizar material' });
        }
    },

    async excluir(req, res) {
        try {
            const { id } = req.params;
            
            const pertence = await prisma.material.findFirst({ where: { id: Number(id), userId: req.userId } });
            if (!pertence) return res.status(403).json({ error: 'Acesso negado' });

            await registrar(req.userId, 'excluiu', 'Material', pertence.id, pertence.nome);
            await prisma.material.delete({ where: { id: Number(id) } });
            return res.json({ message: 'Material excluído com sucesso!' });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao excluir material' });
        }
    }
};