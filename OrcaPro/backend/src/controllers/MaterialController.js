const prisma = require('../lib/prisma');

module.exports = {
    async listar(req, res) {
        try {
            const materiais = await prisma.material.findMany({
                where: { userId: req.userId }, // [SaaS]
                orderBy: { createdAt: 'desc' }
            });
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

            await prisma.material.delete({ where: { id: Number(id) } });
            return res.json({ message: 'Material excluído com sucesso!' });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao excluir material' });
        }
    }
};