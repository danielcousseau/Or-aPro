const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
    async listar(req, res) {
        try {
            // O "include" faz o Prisma trazer os dados do cliente e os materiais junto!
            const orcamentos = await prisma.orcamento.findMany({
                include: { 
                    cliente: true,
                    materiais: true 
                },
                orderBy: { createdAt: 'desc' }
            });
            return res.json(orcamentos);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao listar orçamentos' });
        }
    },

    async criar(req, res) {
        try {
            const {
                titulo, clienteId, tipoMaoDeObra, maoDeObraValor, tipoLucro, 
                lucroValor, totalFinal, tipoMovel, ambiente, medidas, 
                prazo, pagamento, validade, observacoes, materiais
            } = req.body;

            const novoOrcamento = await prisma.orcamento.create({
                data: {
                    titulo, 
                    clienteId,
                    tipoMaoDeObra, 
                    maoDeObraValor,
                    tipoLucro, 
                    lucroValor,
                    totalFinal,
                    tipoMovel, ambiente, medidas, prazo, pagamento, validade, observacoes,
                    // Aqui ele já cria e vincula os materiais automaticamente
                    materiais: {
                        create: materiais.map(mat => ({
                            nome: mat.nome,
                            valor: mat.valor,
                            quantidade: mat.quantidade
                        }))
                    }
                }
            });

            return res.status(201).json(novoOrcamento);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao criar orçamento' });
        }
    },

    async atualizar(req, res) {
        try {
            const { id } = req.params;
            const {
                titulo, clienteId, tipoMaoDeObra, maoDeObraValor, tipoLucro, 
                lucroValor, totalFinal, tipoMovel, ambiente, medidas, 
                prazo, pagamento, validade, observacoes, materiais
            } = req.body;

            const orcamentoAtualizado = await prisma.orcamento.update({
                where: { id: Number(id) },
                data: {
                    titulo, 
                    clienteId,
                    tipoMaoDeObra, 
                    maoDeObraValor,
                    tipoLucro, 
                    lucroValor,
                    totalFinal,
                    tipoMovel, ambiente, medidas, prazo, pagamento, validade, observacoes,
                    materiais: {
                        deleteMany: {}, // Limpa os materiais antigos
                        create: materiais.map(mat => ({ // Salva a lista atualizada
                            nome: mat.nome,
                            valor: mat.valor,
                            quantidade: mat.quantidade
                        }))
                    }
                }
            });
            return res.json(orcamentoAtualizado);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao atualizar orçamento' });
        }
    },

    async excluir(req, res) {
        try {
            const { id } = req.params;
            // Os materiais relacionados serão excluídos em cascata pelo Prisma
            await prisma.orcamento.delete({
                where: { id: Number(id) },
            });
            return res.json({ message: 'Orçamento excluído com sucesso!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao excluir orçamento.' });
        }
    },

    async buscarPorId(req, res) {
        try {
            const { id } = req.params;
            const orcamento = await prisma.orcamento.findUnique({
                where: { id: Number(id) },
                include: { 
                    cliente: true,
                    materiais: true 
                }
            });

            if (!orcamento) return res.status(404).json({ error: 'Orçamento não encontrado' });

            return res.json(orcamento);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar orçamento' });
        }
    },

    async atualizarStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            const orcamentoAtualizado = await prisma.orcamento.update({
                where: { id: Number(id) },
                data: { status }
            });
            return res.json(orcamentoAtualizado);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao atualizar status' });
        }
    }
};