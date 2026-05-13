const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
    async listar(req, res) {
        try {
            const formas = await prisma.formaPagamento.findMany();
            return res.json(formas);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao listar formas de pagamento' });
        }
    },

    async criar(req, res) {
        try {
            const { nome } = req.body;
            const novaForma = await prisma.formaPagamento.create({
                data: { nome }
            });
            return res.status(201).json(novaForma);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao criar forma de pagamento' });
        }
    },

    async atualizar(req, res) {
        try {
            const { id } = req.params;
            const { nome } = req.body;

            const formaAtualizada = await prisma.formaPagamento.update({
                where: { id: Number(id) },
                data: { nome }
            });
            return res.json(formaAtualizada);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao atualizar forma de pagamento' });
        }
    },

    async excluir(req, res) {
        try {
            const { id } = req.params;
            await prisma.formaPagamento.delete({
                where: { id: Number(id) }
            });
            return res.json({ message: 'Forma de pagamento excluída com sucesso!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao excluir forma de pagamento.' });
        }
    }
};