const prisma = require('../lib/prisma');

const TIPOS_VALIDOS = ['ambiente', 'pagamento', 'material_categoria', 'material_unidade'];

module.exports = {
    async listar(req, res) {
        try {
            const { tipo } = req.query;
            if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
                return res.status(400).json({ error: 'Tipo inválido.' });
            }
            const opcoes = await prisma.opcaoCustomizada.findMany({
                where: { userId: req.userId, tipo },
                orderBy: { nome: 'asc' },
                select: { id: true, nome: true }
            });
            return res.json(opcoes);
        } catch (error) {
            console.error('[OpcaoCustomizada.listar]', error);
            return res.status(500).json({ error: 'Erro ao listar opções.' });
        }
    },

    async criar(req, res) {
        try {
            const { tipo, nome } = req.body;
            if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
                return res.status(400).json({ error: 'Tipo inválido.' });
            }
            if (!nome || !nome.trim()) {
                return res.status(400).json({ error: 'Nome é obrigatório.' });
            }
            const nomeLimpo = nome.trim();
            try {
                const opcao = await prisma.opcaoCustomizada.create({
                    data: { tipo, nome: nomeLimpo, userId: req.userId }
                });
                return res.status(201).json(opcao);
            } catch (createError) {
                // P2002 = violação de unique (opção já existe) — trata como sucesso
                if (createError.code === 'P2002') {
                    const existente = await prisma.opcaoCustomizada.findFirst({
                        where: { tipo, nome: nomeLimpo, userId: req.userId },
                        select: { id: true, nome: true }
                    });
                    return res.status(200).json(existente);
                }
                throw createError;
            }
        } catch (error) {
            console.error('[OpcaoCustomizada.criar]', error);
            return res.status(500).json({ error: 'Erro ao salvar opção.' });
        }
    },

    async excluir(req, res) {
        try {
            const id = Number(req.params.id);
            const opcao = await prisma.opcaoCustomizada.findFirst({
                where: { id, userId: req.userId }
            });
            if (!opcao) return res.status(404).json({ error: 'Opção não encontrada.' });
            await prisma.opcaoCustomizada.delete({ where: { id } });
            return res.status(204).send();
        } catch (error) {
            console.error('[OpcaoCustomizada.excluir]', error);
            return res.status(500).json({ error: 'Erro ao excluir opção.' });
        }
    }
};
