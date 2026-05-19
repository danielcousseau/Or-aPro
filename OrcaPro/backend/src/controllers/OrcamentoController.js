const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken'); // [SecOps] JWT para gerar links públicos e seguros

module.exports = {
    async listar(req, res) {
        try {
            // O "include" faz o Prisma trazer os dados do cliente e os materiais junto!
            const orcamentos = await prisma.orcamento.findMany({
                where: { userId: req.userId }, // [SaaS] Isola os orçamentos
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
                titulo, clienteId, tipoMaoDeObra, maoDeObraValor, maoDeObraQtde, 
                tipoLucro, lucroValor, lucroQtde, totalFinal, tipoMovel, ambiente, medidas, 
                prazo, pagamento, validade, observacoes, materiais
            } = req.body;

            const novoOrcamento = await prisma.orcamento.create({
                data: {
                    titulo, 
                    clienteId,
                    tipoMaoDeObra, 
                    maoDeObraValor,
                    maoDeObraQtde,
                    tipoLucro, 
                    lucroValor,
                    lucroQtde,
                    totalFinal,
                    tipoMovel, ambiente, medidas, prazo, pagamento, validade, observacoes,
                    userId: req.userId, // [SaaS] Etiqueta de posse
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
                titulo, clienteId, tipoMaoDeObra, maoDeObraValor, maoDeObraQtde, 
                tipoLucro, lucroValor, lucroQtde, totalFinal, tipoMovel, ambiente, medidas, 
                prazo, pagamento, validade, observacoes, materiais
            } = req.body;

            const pertence = await prisma.orcamento.findFirst({ where: { id: Number(id), userId: req.userId } });
            if (!pertence) return res.status(403).json({ error: 'Acesso negado' });

            const orcamentoAtualizado = await prisma.orcamento.update({
                where: { id: Number(id) },
                data: {
                    titulo, 
                    clienteId,
                    tipoMaoDeObra, 
                    maoDeObraValor,
                    maoDeObraQtde,
                    tipoLucro, 
                    lucroValor,
                    lucroQtde,
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
            
            const pertence = await prisma.orcamento.findFirst({ where: { id: Number(id), userId: req.userId } });
            if (!pertence) return res.status(403).json({ error: 'Acesso negado' });

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
            const orcamento = await prisma.orcamento.findFirst({
                where: { id: Number(id), userId: req.userId }, // [SaaS] Traz se for o dono
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
            
            // [SaaS] Valida se o orçamento pertence ao usuário antes de alterar o status
            const pertence = await prisma.orcamento.findFirst({ where: { id: Number(id), userId: req.userId } });
            if (!pertence) return res.status(403).json({ error: 'Acesso negado' });

            const orcamentoAtualizado = await prisma.orcamento.update({
                where: { id: Number(id) },
                data: { status }
            });
            return res.json(orcamentoAtualizado);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao atualizar status' });
        }
    },

    // =========================================================
    // [SecOps] Geração de Link Público Temporário para Clientes
    // =========================================================
    async gerarTokenPublico(req, res) {
        try {
            const { id } = req.params;
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) return res.status(500).json({ error: 'Erro interno de configuração de segurança.' });

            const orcamento = await prisma.orcamento.findFirst({ where: { id: Number(id), userId: req.userId } });
            if (!orcamento) return res.status(404).json({ error: 'Orçamento não encontrado.' });

            // Assina um token válido por 7 dias contendo APENAS o ID
            const token = jwt.sign({ orcamentoId: Number(id) }, jwtSecret, { expiresIn: '7d' });
            return res.json({ token, expiraEm: '7 dias' });
        } catch (error) {
            console.error("Erro ao gerar token público:", error);
            return res.status(500).json({ error: 'Erro ao gerar link de compartilhamento.' });
        }
    },

    async buscarPorTokenPublico(req, res) {
        try {
            const { token } = req.params;
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) return res.status(500).json({ error: 'Erro interno de configuração de segurança.' });

            // Descriptografa o token de forma segura
            const decoded = jwt.verify(token, jwtSecret);
            
            // Busca APENAS os dados necessários para o cliente (esconde os custos internos e materiais)
            const orcamento = await prisma.orcamento.findUnique({
                where: { id: Number(decoded.orcamentoId) },
                include: { cliente: true }
            });

            if (!orcamento) return res.status(404).json({ error: 'Orçamento não encontrado.' });
            return res.json(orcamento);
        } catch (error) {
            return res.status(401).json({ error: 'Link inválido ou expirado.' });
        }
    }
};