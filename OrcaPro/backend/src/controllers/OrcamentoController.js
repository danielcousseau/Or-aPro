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

                const doc = new PDFDocument({ size: 'A4', margin: 50, compress: true });
                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                const W = 495;
                const COL = 240;
                const LINE_H = 17;
                const X_DIR = 310;
                const AZUL = '#0056A3';
                const VERDE = '#10B981';
                const CINZA = '#64748B';
                const BORDA = '#E2E8F0';

                // === CABECALHO ===
                const logoPath = path.join(__dirname, '../../../frontend/public/logo-orcapro.png');
                if (fs.existsSync(logoPath)) {
                    doc.image(logoPath, 50, 40, { fit: [200, 55] });
                } else {
                    doc.fontSize(22).font('Helvetica-Bold').fillColor(AZUL).text('Orca Pro', 50, 48);
                }

                doc.fontSize(18).font('Helvetica-Bold').fillColor('#1E293B')
                   .text(`Orcamento #${numeroLocal}`, 50, 45, { align: 'right', width: W });
                doc.fontSize(10).font('Helvetica').fillColor(CINZA)
                   .text(`Data: ${new Date(orcamento.createdAt).toLocaleDateString('pt-BR')}`, 50, 70, { align: 'right', width: W });

                // Linha fina azul separando cabecalho
                doc.moveTo(50, 108).lineTo(545, 108).lineWidth(1.5).strokeColor(AZUL).stroke();

                // === DADOS (duas colunas sem bordas pesadas) ===
                const Y_SEC = 124;
                const Y_DATA = Y_SEC + 18;

                doc.fontSize(11).font('Helvetica-Bold').fillColor(AZUL)
                   .text('Dados do Cliente', 50, Y_SEC, { width: COL });
                doc.fontSize(11).font('Helvetica-Bold').fillColor(AZUL)
                   .text('Projeto', X_DIR, Y_SEC, { width: COL });

                doc.fontSize(10).font('Helvetica').fillColor('#1E293B');
                doc.text(`Nome: ${orcamento.cliente.nome}`, 50, Y_DATA, { width: COL });
                doc.text(`Telefone: ${orcamento.cliente.telefone || '-'}`, 50, Y_DATA + LINE_H, { width: COL });
                doc.text(`Cidade: ${orcamento.cliente.cidade || '-'}`, 50, Y_DATA + LINE_H * 2, { width: COL });

                doc.text(`Titulo: ${orcamento.titulo}`, X_DIR, Y_DATA, { width: COL });
                doc.text(`Ambiente: ${orcamento.ambiente || '-'}`, X_DIR, Y_DATA + LINE_H, { width: COL });
                doc.text(`Movel: ${orcamento.tipoMovel || '-'}`, X_DIR, Y_DATA + LINE_H * 2, { width: COL });

                // === CAIXA DE TOTAIS (fundo cinza suave, borda leve) ===
                const Y_TOTAL = 240;
                const LARGURA_BOX = 250;
                const X_BOX = 545 - LARGURA_BOX;

                doc.roundedRect(X_BOX, Y_TOTAL, LARGURA_BOX, 90, 6)
                   .fillAndStroke('#F9FAFC', BORDA);

                doc.fontSize(10).font('Helvetica').fillColor('#1E293B');
                doc.text(`Prazo: ${orcamento.prazo || 'A combinar'}`, X_BOX + 16, Y_TOTAL + 13, { width: LARGURA_BOX - 28 });
                doc.text(`Pagamento: ${orcamento.pagamento || 'A combinar'}`, X_BOX + 16, Y_TOTAL + 31, { width: LARGURA_BOX - 28 });

                doc.moveTo(X_BOX + 14, Y_TOTAL + 52).lineTo(X_BOX + LARGURA_BOX - 14, Y_TOTAL + 52)
                   .lineWidth(0.5).strokeColor(BORDA).stroke();

                doc.fontSize(16).font('Helvetica-Bold').fillColor(VERDE)
                   .text(`Total: ${formatarMoedaBR(orcamento.totalFinal)}`, X_BOX + 16, Y_TOTAL + 60, { width: LARGURA_BOX - 28 });

                // === RODAPE ===
                const Y_FOOTER = 720;
                doc.moveTo(50, Y_FOOTER).lineTo(545, Y_FOOTER)
                   .lineWidth(0.5).strokeColor(BORDA).stroke();
                doc.fontSize(9).font('Helvetica').fillColor(CINZA);
                doc.text(`Este orcamento e valido por ${orcamento.validade || '7 dias'}.`, 50, Y_FOOTER + 14, { width: W });
                if (orcamento.observacoes) {
                    doc.text(`Observacoes: ${orcamento.observacoes}`, 50, Y_FOOTER + 29, { width: W });
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