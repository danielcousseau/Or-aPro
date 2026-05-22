const prisma = require('../lib/prisma');
const jwt = require('jsonwebtoken');
const { registrar } = require('../services/audit');
const { notificarMudancaStatus } = require('../services/telegram');

const formatarMoedaBR = (valor) =>
    Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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

            // Garante que o clienteId pertence a este usuário — impede associação cross-tenant
            const clienteDoUsuario = await prisma.cliente.findFirst({
                where: { id: clienteId, userId: req.userId }
            });
            if (!clienteDoUsuario) {
                return res.status(403).json({ error: 'Cliente não encontrado.' });
            }

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

            await registrar(req.userId, 'criou', 'Orçamento', novoOrcamento.id, novoOrcamento.titulo);
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

            // Garante que o novo clienteId também pertence a este usuário
            const clienteDoUsuario = await prisma.cliente.findFirst({
                where: { id: clienteId, userId: req.userId }
            });
            if (!clienteDoUsuario) {
                return res.status(403).json({ error: 'Cliente não encontrado.' });
            }

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
            await registrar(req.userId, 'atualizou', 'Orçamento', orcamentoAtualizado.id, orcamentoAtualizado.titulo);
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

            await registrar(req.userId, 'excluiu', 'Orçamento', pertence.id, pertence.titulo);
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

            const pertence = await prisma.orcamento.findFirst({
                where: { id: Number(id), userId: req.userId },
                include: { cliente: true }
            });
            if (!pertence) return res.status(403).json({ error: 'Acesso negado' });

            const orcamentoAtualizado = await prisma.orcamento.update({
                where: { id: Number(id) },
                data: { status }
            });

            await registrar(req.userId, 'atualizou status', 'Orçamento', orcamentoAtualizado.id, `${orcamentoAtualizado.titulo} → ${status}`);
            notificarMudancaStatus(pertence.cliente, pertence.titulo, status).catch(() => {});
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

    // =========================================================
    // [PDF] Gera PDF do orçamento direto no servidor (pdfkit)
    // =========================================================
    async gerarPDF(req, res) {
        try {
            const PDFDocument = require('pdfkit');
            const { id } = req.params;

            const [orcamento, todos] = await Promise.all([
                prisma.orcamento.findFirst({
                    where: { id: Number(id), userId: req.userId },
                    include: { cliente: true }
                }),
                prisma.orcamento.findMany({
                    where: { userId: req.userId },
                    select: { id: true, createdAt: true },
                    orderBy: { createdAt: 'asc' }
                })
            ]);

            if (!orcamento) return res.status(404).json({ error: 'Orçamento não encontrado.' });

            const posicao = todos.findIndex(o => o.id === Number(id));
            const numeroLocal = posicao !== -1 ? posicao + 1 : Number(id);
            const nomeArquivo = `Orcamento_${numeroLocal}_${orcamento.cliente.nome.replace(/\s+/g, '_')}.pdf`;

            // Gera em buffer para poder retornar erro JSON se falhar
            const pdfBuffer = await new Promise((resolve, reject) => {
                const path = require('path');
                const fs = require('fs');

                // margin: 0 evita que pdfkit crie segunda página automática baseado em cursor
                const doc = new PDFDocument({ size: 'A4', margin: 0, compress: true });
                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                const X = 50;        // margem esquerda
                const W = 495;       // largura útil (595 - 2×50)
                const COL = 240;     // largura de cada coluna
                const X_DIR = 310;   // início da coluna direita
                const LINE_H = 18;   // altura de linha
                const VERDE = '#10B981';
                const CINZA = '#64748B';
                const ESCURO = '#333333';
                const BORDA_CINZA = '#dddddd';

                // === CABEÇALHO ===
                const logoPath = path.join(__dirname, '../../../frontend/public/logo-orcapro.png');
                if (fs.existsSync(logoPath)) {
                    doc.image(logoPath, X, 40, { fit: [200, 55] });
                } else {
                    doc.fontSize(22).font('Helvetica-Bold').fillColor('#0056A3').text('OrcaPro', X, 48);
                }

                // Número e data alinhados à direita
                doc.fontSize(18).font('Helvetica-Bold').fillColor(ESCURO)
                   .text(`Orcamento #${numeroLocal}`, X, 45, { align: 'right', width: W });
                doc.fontSize(10).font('Helvetica').fillColor(CINZA)
                   .text(`Data: ${new Date(orcamento.createdAt).toLocaleDateString('pt-BR')}`, X, 72, { align: 'right', width: W });

                // Linha separadora escura (igual ao borderBottom: 2px solid #333 do HTML)
                doc.moveTo(X, 108).lineTo(545, 108).lineWidth(2).strokeColor(ESCURO).stroke();

                // === SEÇÕES DE DADOS ===
                const Y_SEC = 126;
                const Y_DATA = Y_SEC + 22;

                // Títulos de seção em negrito com underline cinza (igual ao HTML)
                doc.fontSize(12).font('Helvetica-Bold').fillColor(ESCURO)
                   .text('Dados do Cliente', X, Y_SEC, { width: COL });
                doc.moveTo(X, Y_SEC + 18).lineTo(X + COL, Y_SEC + 18)
                   .lineWidth(0.7).strokeColor(BORDA_CINZA).stroke();

                doc.fontSize(12).font('Helvetica-Bold').fillColor(ESCURO)
                   .text('Projeto', X_DIR, Y_SEC, { width: COL });
                doc.moveTo(X_DIR, Y_SEC + 18).lineTo(X_DIR + COL, Y_SEC + 18)
                   .lineWidth(0.7).strokeColor(BORDA_CINZA).stroke();

                // Dados: label em bold + valor em regular (continued: true com 4 args — sem NaN)
                doc.fontSize(10).fillColor(ESCURO);

                doc.font('Helvetica-Bold').text('Nome: ', X, Y_DATA, { continued: true, width: COL });
                doc.font('Helvetica').text(orcamento.cliente.nome || '-');

                doc.font('Helvetica-Bold').text('Telefone: ', X, Y_DATA + LINE_H, { continued: true, width: COL });
                doc.font('Helvetica').text(orcamento.cliente.telefone || '-');

                doc.font('Helvetica-Bold').text('Cidade: ', X, Y_DATA + LINE_H * 2, { continued: true, width: COL });
                doc.font('Helvetica').text(orcamento.cliente.cidade || '-');

                doc.font('Helvetica-Bold').text('Titulo: ', X_DIR, Y_DATA, { continued: true, width: COL });
                doc.font('Helvetica').text(orcamento.titulo || '-');

                doc.font('Helvetica-Bold').text('Ambiente: ', X_DIR, Y_DATA + LINE_H, { continued: true, width: COL });
                doc.font('Helvetica').text(orcamento.ambiente || '-');

                doc.font('Helvetica-Bold').text('Movel: ', X_DIR, Y_DATA + LINE_H * 2, { continued: true, width: COL });
                doc.font('Helvetica').text(orcamento.tipoMovel || '-');

                // === CAIXA DE TOTAIS (borda escura, sem fundo — igual ao HTML) ===
                const Y_TOTAL = 260;
                const LARGURA_BOX = 250;
                const X_BOX = 545 - LARGURA_BOX;

                doc.rect(X_BOX, Y_TOTAL, LARGURA_BOX, 90)
                   .lineWidth(2).strokeColor(ESCURO).stroke();

                doc.fontSize(10).font('Helvetica').fillColor(ESCURO);
                doc.text(`Prazo: ${orcamento.prazo || 'A combinar'}`, X_BOX + 15, Y_TOTAL + 13, { width: LARGURA_BOX - 25 });
                doc.text(`Pagamento: ${orcamento.pagamento || 'A combinar'}`, X_BOX + 15, Y_TOTAL + 31, { width: LARGURA_BOX - 25 });

                doc.moveTo(X_BOX + 10, Y_TOTAL + 54).lineTo(X_BOX + LARGURA_BOX - 10, Y_TOTAL + 54)
                   .lineWidth(0.5).strokeColor(BORDA_CINZA).stroke();

                doc.fontSize(16).font('Helvetica-Bold').fillColor(VERDE)
                   .text(`Total: ${formatarMoedaBR(orcamento.totalFinal)}`, X_BOX + 15, Y_TOTAL + 61, { width: LARGURA_BOX - 25 });

                // === RODAPÉ ===
                const Y_FOOTER = 720;
                doc.moveTo(X, Y_FOOTER).lineTo(545, Y_FOOTER)
                   .lineWidth(0.5).strokeColor(BORDA_CINZA).stroke();
                doc.fontSize(9).font('Helvetica').fillColor(CINZA);
                doc.text(`Este orcamento e valido por ${orcamento.validade || '7 dias'}.`, X, Y_FOOTER + 14, { width: W });
                if (orcamento.observacoes) {
                    doc.text(`Observacoes: ${orcamento.observacoes}`, X, Y_FOOTER + 29, { width: W });
                }

                doc.end();
            });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            return res.send(pdfBuffer);

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            if (!res.headersSent) {
                return res.status(500).json({ error: 'Erro ao gerar o PDF.' });
            }
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