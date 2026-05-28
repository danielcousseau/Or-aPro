"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma = require("../lib/prisma");
const audit_1 = require("../services/audit");
const telegram_1 = require("../services/telegram");
const formatarMoedaBR = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
async function descontarEstoque(materiais, userId) {
  const descontos = new Map();
  for (const mat of materiais) {
    if (mat.materialId) {
      descontos.set(
        mat.materialId,
        (descontos.get(mat.materialId) ?? 0) + mat.quantidade,
      );
    }
  }
  const alertas = [];
  for (const [materialId, qtd] of descontos) {
    const material = await prisma.material.findFirst({
      where: { id: materialId, userId },
    });
    if (material && material.quantidadeEstoque !== null) {
      const novoEstoque = Math.max(0, material.quantidadeEstoque - qtd);
      await prisma.material.update({
        where: { id: materialId },
        data: { quantidadeEstoque: novoEstoque },
      });
      if (
        material.estoqueMinimo !== null &&
        novoEstoque < material.estoqueMinimo
      ) {
        alertas.push(material.nome);
      }
    }
  }
  return alertas;
}
async function ajustarDiffEstoque(materiaisAntes, materiaisDepois, userId) {
  const beforeMap = new Map();
  for (const m of materiaisAntes) {
    if (m.materialId) {
      beforeMap.set(
        m.materialId,
        (beforeMap.get(m.materialId) ?? 0) + m.quantidade,
      );
    }
  }
  const afterMap = new Map();
  for (const m of materiaisDepois) {
    if (m.materialId) {
      afterMap.set(
        m.materialId,
        (afterMap.get(m.materialId) ?? 0) + m.quantidade,
      );
    }
  }
  const allIds = new Set([...beforeMap.keys(), ...afterMap.keys()]);
  const alertas = [];
  for (const materialId of allIds) {
    const before = beforeMap.get(materialId) ?? 0;
    const after = afterMap.get(materialId) ?? 0;
    const diff = after - before;
    if (diff === 0) continue;
    const material = await prisma.material.findFirst({
      where: { id: materialId, userId },
    });
    if (material && material.quantidadeEstoque !== null) {
      const novoEstoque = Math.max(0, material.quantidadeEstoque - diff);
      await prisma.material.update({
        where: { id: materialId },
        data: { quantidadeEstoque: novoEstoque },
      });
      if (
        material.estoqueMinimo !== null &&
        novoEstoque < material.estoqueMinimo
      ) {
        alertas.push(material.nome);
      }
    }
  }
  return alertas;
}
exports.default = {
  async listar(req, res) {
    try {
      const orcamentos = await prisma.orcamento.findMany({
        where: { userId: req.userId },
        include: { cliente: true, materiais: true },
        orderBy: { createdAt: "desc" },
      });
      res.json(orcamentos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao listar orçamentos" });
    }
  },
  async criar(req, res) {
    try {
      const {
        titulo,
        clienteId,
        tipoMaoDeObra,
        maoDeObraValor,
        maoDeObraQtde,
        tipoLucro,
        lucroValor,
        lucroQtde,
        totalFinal,
        tipoMovel,
        ambiente,
        medidas,
        prazo,
        pagamento,
        validade,
        observacoes,
        materiais,
      } = req.body;
      const clienteDoUsuario = await prisma.cliente.findFirst({
        where: { id: clienteId, userId: req.userId },
      });
      if (!clienteDoUsuario) {
        res.status(403).json({ error: "Cliente não encontrado." });
        return;
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
          tipoMovel,
          ambiente,
          medidas,
          prazo,
          pagamento,
          validade,
          observacoes,
          userId: req.userId,
          materiais: {
            create: materiais.map((mat) => ({
              nome: mat.nome,
              valor: mat.valor,
              quantidade: mat.quantidade,
              materialId: mat.materialId ?? null,
            })),
          },
        },
      });
      const alertasEstoque = await descontarEstoque(
        materiais,
        req.userId,
      ).catch(() => []);
      await (0, audit_1.registrar)(
        req.userId,
        "criou",
        "Orçamento",
        novoOrcamento.id,
        novoOrcamento.titulo,
      );
      res.status(201).json({ ...novoOrcamento, alertasEstoque });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao criar orçamento" });
    }
  },
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const {
        titulo,
        clienteId,
        tipoMaoDeObra,
        maoDeObraValor,
        maoDeObraQtde,
        tipoLucro,
        lucroValor,
        lucroQtde,
        totalFinal,
        tipoMovel,
        ambiente,
        medidas,
        prazo,
        pagamento,
        validade,
        observacoes,
        materiais,
      } = req.body;
      const pertence = await prisma.orcamento.findFirst({
        where: { id: Number(id), userId: req.userId },
      });
      if (!pertence) {
        res.status(403).json({ error: "Acesso negado" });
        return;
      }
      const clienteDoUsuario = await prisma.cliente.findFirst({
        where: { id: clienteId, userId: req.userId },
      });
      if (!clienteDoUsuario) {
        res.status(403).json({ error: "Cliente não encontrado." });
        return;
      }
      // Carrega linhas atuais para calcular diff de estoque
      const linhasAtuais = await prisma.orcamentoMaterial.findMany({
        where: { orcamentoId: Number(id) },
        select: { id: true, materialId: true, quantidade: true },
      });
      const novasMateriais = materiais;
      const existingIds = novasMateriais.filter((m) => m.id).map((m) => m.id);
      // Exclui linhas removidas
      if (existingIds.length > 0) {
        await prisma.orcamentoMaterial.deleteMany({
          where: { orcamentoId: Number(id), id: { notIn: existingIds } },
        });
      } else {
        await prisma.orcamentoMaterial.deleteMany({
          where: { orcamentoId: Number(id) },
        });
      }
      // Atualiza linhas existentes
      for (const mat of novasMateriais.filter((m) => m.id)) {
        await prisma.orcamentoMaterial.update({
          where: { id: mat.id },
          data: {
            nome: mat.nome,
            valor: mat.valor,
            quantidade: mat.quantidade,
            materialId: mat.materialId ?? null,
          },
        });
      }
      // Cria novas linhas
      const linhasNovas = novasMateriais.filter((m) => !m.id);
      if (linhasNovas.length > 0) {
        await prisma.orcamentoMaterial.createMany({
          data: linhasNovas.map((mat) => ({
            orcamentoId: Number(id),
            nome: mat.nome,
            valor: mat.valor,
            quantidade: mat.quantidade,
            materialId: mat.materialId ?? null,
          })),
        });
      }
      const alertasEstoque = await ajustarDiffEstoque(
        linhasAtuais,
        novasMateriais,
        req.userId,
      ).catch(() => []);
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
          tipoMovel,
          ambiente,
          medidas,
          prazo,
          pagamento,
          validade,
          observacoes,
        },
      });
      await (0, audit_1.registrar)(
        req.userId,
        "atualizou",
        "Orçamento",
        orcamentoAtualizado.id,
        orcamentoAtualizado.titulo,
      );
      res.json({ ...orcamentoAtualizado, alertasEstoque });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao atualizar orçamento" });
    }
  },
  async excluir(req, res) {
    try {
      const { id } = req.params;
      const pertence = await prisma.orcamento.findFirst({
        where: { id: Number(id), userId: req.userId },
      });
      if (!pertence) {
        res.status(403).json({ error: "Acesso negado" });
        return;
      }
      await (0, audit_1.registrar)(
        req.userId,
        "excluiu",
        "Orçamento",
        pertence.id,
        pertence.titulo,
      );
      await prisma.orcamento.delete({ where: { id: Number(id) } });
      res.json({ message: "Orçamento excluído com sucesso!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao excluir orçamento." });
    }
  },
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const orcamento = await prisma.orcamento.findFirst({
        where: { id: Number(id), userId: req.userId },
        include: { cliente: true, materiais: true },
      });
      if (!orcamento) {
        res.status(404).json({ error: "Orçamento não encontrado" });
        return;
      }
      res.json(orcamento);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar orçamento" });
    }
  },
  async atualizarStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const pertence = await prisma.orcamento.findFirst({
        where: { id: Number(id), userId: req.userId },
        include: { cliente: true },
      });
      if (!pertence) {
        res.status(403).json({ error: "Acesso negado" });
        return;
      }
      const orcamentoAtualizado = await prisma.orcamento.update({
        where: { id: Number(id) },
        data: { status },
      });
      await (0, audit_1.registrar)(
        req.userId,
        "atualizou status",
        "Orçamento",
        orcamentoAtualizado.id,
        `${orcamentoAtualizado.titulo} → ${status}`,
      );
      (0, telegram_1.notificarMudancaStatus)(
        pertence.cliente,
        pertence.titulo,
        status,
      ).catch(() => {});
      res.json(orcamentoAtualizado);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao atualizar status" });
    }
  },
  async gerarTokenPublico(req, res) {
    try {
      const { id } = req.params;
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        res
          .status(500)
          .json({ error: "Erro interno de configuração de segurança." });
        return;
      }
      const orcamento = await prisma.orcamento.findFirst({
        where: { id: Number(id), userId: req.userId },
      });
      if (!orcamento) {
        res.status(404).json({ error: "Orçamento não encontrado." });
        return;
      }
      const token = jsonwebtoken_1.default.sign(
        { orcamentoId: Number(id) },
        jwtSecret,
        { expiresIn: "7d" },
      );
      res.json({ token, expiraEm: "7 dias" });
    } catch (error) {
      console.error("Erro ao gerar token público:", error);
      res
        .status(500)
        .json({ error: "Erro ao gerar link de compartilhamento." });
    }
  },
  async gerarPDF(req, res) {
    try {
      const { id } = req.params;
      const [orcamento, todos] = await Promise.all([
        prisma.orcamento.findFirst({
          where: { id: Number(id), userId: req.userId },
          include: { cliente: true },
        }),
        prisma.orcamento.findMany({
          where: { userId: req.userId },
          select: { id: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
      ]);
      if (!orcamento) {
        res.status(404).json({ error: "Orçamento não encontrado." });
        return;
      }
      const posicao = todos.findIndex((o) => o.id === Number(id));
      const numeroLocal = posicao !== -1 ? posicao + 1 : Number(id);
      const nomeArquivo = `Orcamento_${numeroLocal}_${orcamento.cliente.nome.replace(/\s+/g, "_")}.pdf`;
      const pdfBuffer = await new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({
          size: "A4",
          margin: 0,
          compress: true,
        });
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        const X = 50;
        const W = 495;
        const COL = 240;
        const X_DIR = 310;
        const LINE_H = 18;
        const VERDE = "#10B981";
        const CINZA = "#64748B";
        const ESCURO = "#333333";
        const BORDA_CINZA = "#dddddd";
        const logoPath = path_1.default.join(
          __dirname,
          "../../../frontend/public/logo-orcapro.png",
        );
        if (fs_1.default.existsSync(logoPath)) {
          doc.image(logoPath, X, 40, { fit: [200, 55] });
        } else {
          doc
            .fontSize(22)
            .font("Helvetica-Bold")
            .fillColor("#0056A3")
            .text("OrcaPro", X, 48);
        }
        doc
          .fontSize(18)
          .font("Helvetica-Bold")
          .fillColor(ESCURO)
          .text(`Orcamento #${numeroLocal}`, X, 45, {
            align: "right",
            width: W,
          });
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor(CINZA)
          .text(
            `Data: ${new Date(orcamento.createdAt).toLocaleDateString("pt-BR")}`,
            X,
            72,
            { align: "right", width: W },
          );
        doc
          .moveTo(X, 108)
          .lineTo(545, 108)
          .lineWidth(2)
          .strokeColor(ESCURO)
          .stroke();
        const Y_SEC = 126;
        const Y_DATA = Y_SEC + 22;
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .fillColor(ESCURO)
          .text("Dados do Cliente", X, Y_SEC, { width: COL });
        doc
          .moveTo(X, Y_SEC + 18)
          .lineTo(X + COL, Y_SEC + 18)
          .lineWidth(0.7)
          .strokeColor(BORDA_CINZA)
          .stroke();
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .fillColor(ESCURO)
          .text("Projeto", X_DIR, Y_SEC, { width: COL });
        doc
          .moveTo(X_DIR, Y_SEC + 18)
          .lineTo(X_DIR + COL, Y_SEC + 18)
          .lineWidth(0.7)
          .strokeColor(BORDA_CINZA)
          .stroke();
        doc.fontSize(10).fillColor(ESCURO);
        doc
          .font("Helvetica-Bold")
          .text("Nome: ", X, Y_DATA, { continued: true, width: COL });
        doc.font("Helvetica").text(orcamento.cliente.nome || "-");
        doc.font("Helvetica-Bold").text("Telefone: ", X, Y_DATA + LINE_H, {
          continued: true,
          width: COL,
        });
        doc.font("Helvetica").text(orcamento.cliente.telefone || "-");
        doc.font("Helvetica-Bold").text("Cidade: ", X, Y_DATA + LINE_H * 2, {
          continued: true,
          width: COL,
        });
        doc.font("Helvetica").text(orcamento.cliente.cidade || "-");
        doc
          .font("Helvetica-Bold")
          .text("Titulo: ", X_DIR, Y_DATA, { continued: true, width: COL });
        doc.font("Helvetica").text(orcamento.titulo || "-");
        doc.font("Helvetica-Bold").text("Ambiente: ", X_DIR, Y_DATA + LINE_H, {
          continued: true,
          width: COL,
        });
        doc.font("Helvetica").text(orcamento.ambiente || "-");
        doc.font("Helvetica-Bold").text("Movel: ", X_DIR, Y_DATA + LINE_H * 2, {
          continued: true,
          width: COL,
        });
        doc.font("Helvetica").text(orcamento.tipoMovel || "-");
        const Y_TOTAL = 260;
        const LARGURA_BOX = 250;
        const X_BOX = 545 - LARGURA_BOX;
        doc
          .rect(X_BOX, Y_TOTAL, LARGURA_BOX, 90)
          .lineWidth(2)
          .strokeColor(ESCURO)
          .stroke();
        doc.fontSize(10).font("Helvetica").fillColor(ESCURO);
        doc.text(
          `Prazo: ${orcamento.prazo || "A combinar"}`,
          X_BOX + 15,
          Y_TOTAL + 13,
          { width: LARGURA_BOX - 25 },
        );
        doc.text(
          `Pagamento: ${orcamento.pagamento || "A combinar"}`,
          X_BOX + 15,
          Y_TOTAL + 31,
          { width: LARGURA_BOX - 25 },
        );
        doc
          .moveTo(X_BOX + 10, Y_TOTAL + 54)
          .lineTo(X_BOX + LARGURA_BOX - 10, Y_TOTAL + 54)
          .lineWidth(0.5)
          .strokeColor(BORDA_CINZA)
          .stroke();
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .fillColor(VERDE)
          .text(
            `Total: ${formatarMoedaBR(orcamento.totalFinal)}`,
            X_BOX + 15,
            Y_TOTAL + 61,
            { width: LARGURA_BOX - 25 },
          );
        const Y_FOOTER = 720;
        doc
          .moveTo(X, Y_FOOTER)
          .lineTo(545, Y_FOOTER)
          .lineWidth(0.5)
          .strokeColor(BORDA_CINZA)
          .stroke();
        doc.fontSize(9).font("Helvetica").fillColor(CINZA);
        doc.text(
          `Este orcamento e valido por ${orcamento.validade || "7 dias"}.`,
          X,
          Y_FOOTER + 14,
          { width: W },
        );
        if (orcamento.observacoes) {
          doc.text(`Observacoes: ${orcamento.observacoes}`, X, Y_FOOTER + 29, {
            width: W,
          });
        }
        doc.end();
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${nomeArquivo}"`,
      );
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Erro ao gerar o PDF." });
      }
    }
  },
  async buscarPorTokenPublico(req, res) {
    try {
      const token = req.params.token;
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        res
          .status(500)
          .json({ error: "Erro interno de configuração de segurança." });
        return;
      }
      const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
      const orcamento = await prisma.orcamento.findUnique({
        where: { id: Number(decoded.orcamentoId) },
        include: { cliente: true },
      });
      if (!orcamento) {
        res.status(404).json({ error: "Orçamento não encontrado." });
        return;
      }
      res.json(orcamento);
    } catch (error) {
      console.error(error);
      res.status(401).json({ error: "Link inválido ou expirado." });
    }
  },
};
