const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
    async listar(req, res) {
        try {
            const clientes = await prisma.cliente.findMany();
            return res.json(clientes);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao listar clientes' });
        }
    },

    async criar(req, res) {
        try {
            const dados = req.body;
            
            const novoCliente = await prisma.cliente.create({
                data: dados
            });

            return res.status(201).json(novoCliente);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao criar cliente' });
        }
    },

    async atualizar(req, res) {
        try {
            const { id } = req.params;
            const dados = req.body;

            const clienteAtualizado = await prisma.cliente.update({
                where: { id: Number(id) },
                data: dados
            });

            return res.json(clienteAtualizado);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao atualizar cliente' });
        }
    },

    async excluir(req, res) {
        try {
            const { id } = req.params;
            
            await prisma.cliente.delete({
                where: { id: Number(id) }
            });

            return res.json({ message: 'Cliente excluído com sucesso!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao excluir cliente.' });
        }
    },

    async buscarPorId(req, res) {
        try {
            const { id } = req.params;
            const cliente = await prisma.cliente.findUnique({
                where: { id: Number(id) }
            });

            if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado' });

            return res.json(cliente);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar cliente' });
        }
    }
};