const prisma = require('../lib/prisma');
const { registrar } = require('../services/audit');

module.exports = {
    async listar(req, res) {
        try {
            const clientes = await prisma.cliente.findMany({
                where: { userId: req.userId } // [SaaS] Traz apenas os clientes deste usuário
            });
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
                data: {
                    ...dados,
                    userId: req.userId // [SaaS] Carimba o ID do dono no cliente
                }
            });

            await registrar(req.userId, 'criou', 'Cliente', novoCliente.id, novoCliente.nome);
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

            // [SaaS] Valida se o usuário é dono do cliente antes de editar
            const pertence = await prisma.cliente.findFirst({ where: { id: Number(id), userId: req.userId }});
            if (!pertence) return res.status(403).json({ error: 'Acesso negado' });

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
                    telegramChatId: dados.telegramChatId !== undefined ? dados.telegramChatId : pertence.telegramChatId,
                }
            });

            await registrar(req.userId, 'atualizou', 'Cliente', clienteAtualizado.id, clienteAtualizado.nome);
            return res.json(clienteAtualizado);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao atualizar cliente' });
        }
    },

    async excluir(req, res) {
        try {
            const { id } = req.params;

            const pertence = await prisma.cliente.findFirst({ where: { id: Number(id), userId: req.userId }});
            if (!pertence) return res.status(403).json({ error: 'Acesso negado' });

            const totalOrcamentos = await prisma.orcamento.count({ where: { clienteId: Number(id) } });
            if (totalOrcamentos > 0) {
                return res.status(409).json({
                    error: `Este cliente possui ${totalOrcamentos} orçamento(s) vinculado(s). Exclua os orçamentos antes de excluir o cliente.`
                });
            }

            await registrar(req.userId, 'excluiu', 'Cliente', pertence.id, pertence.nome);
            await prisma.cliente.delete({ where: { id: Number(id) } });

            return res.json({ message: 'Cliente excluído com sucesso!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao excluir cliente.' });
        }
    },

    async buscarPorId(req, res) {
        try {
            const { id } = req.params;
            const cliente = await prisma.cliente.findFirst({
                where: { id: Number(id), userId: req.userId } // [SaaS] Traz apenas se for dono
            });

            if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado' });

            return res.json(cliente);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar cliente' });
        }
    }
};