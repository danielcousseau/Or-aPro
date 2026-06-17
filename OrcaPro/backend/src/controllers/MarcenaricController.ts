import { Request, Response } from "express";
import prisma = require("../lib/prisma");
import {
  calcularMovel,
  ConfigMotor,
  MovelInput,
  CatalogMotor,
} from "../services/marcenaria/motorMarcenaria";

// ─── helpers ──────────────────────────────────────────────────────────────────

async function getConfig(userId: number) {
  return prisma.configuracaoMarcenaria.findUnique({
    where: { userId },
    include: {
      tiposMovel: true,
      chapas: true,
      fitas: true,
      corredicas: true,
      ferragens: true,
    },
  });
}

// Garante que o registro pai pertence ao usuário — rejeita se não existir
async function requireConfig(userId: number, res: Response) {
  const config = await prisma.configuracaoMarcenaria.findUnique({
    where: { userId },
  });
  if (!config) {
    res.status(400).json({ error: "Configure sua marcenaria primeiro." });
    return null;
  }
  return config;
}

// ─── controller ───────────────────────────────────────────────────────────────

export default {
  // GET /api/marcenaria/config
  async buscarConfig(req: Request, res: Response): Promise<void> {
    const config = await getConfig(req.userId!);
    res.json({ data: config ?? null });
  },

  // POST /api/marcenaria/config — upsert dos campos base
  async salvarConfig(req: Request, res: Response): Promise<void> {
    const userId = req.userId!;
    const dados = req.body;

    const config = await prisma.configuracaoMarcenaria.upsert({
      where: { userId },
      create: { userId, ...dados },
      update: dados,
      include: {
        tiposMovel: true,
        chapas: true,
        fitas: true,
        corredicas: true,
        ferragens: true,
      },
    });

    res.json({ data: config });
  },

  // ── Tipos de Móvel ───────────────────────────────────────────────────────────

  async criarTipo(req: Request, res: Response): Promise<void> {
    const config = await requireConfig(req.userId!, res);
    if (!config) return;

    const tipo = await prisma.tipoMovel.create({
      data: { configId: config.id, ...req.body },
    });
    res.status(201).json({ data: tipo });
  },

  async atualizarTipo(req: Request, res: Response): Promise<void> {
    const config = await requireConfig(req.userId!, res);
    if (!config) return;

    const id = Number(req.params.id as string);
    const updated = await prisma.tipoMovel.updateMany({
      where: { id, configId: config.id },
      data: req.body,
    });

    if (updated.count === 0) {
      res.status(404).json({ error: "Tipo de móvel não encontrado." });
      return;
    }
    const tipo = await prisma.tipoMovel.findUnique({ where: { id } });
    res.json({ data: tipo });
  },

  async deletarTipo(req: Request, res: Response): Promise<void> {
    const config = await requireConfig(req.userId!, res);
    if (!config) return;

    const id = Number(req.params.id as string);
    const deleted = await prisma.tipoMovel.deleteMany({
      where: { id, configId: config.id },
    });

    if (deleted.count === 0) {
      res.status(404).json({ error: "Tipo de móvel não encontrado." });
      return;
    }
    res.json({ message: "Tipo de móvel removido." });
  },

  // ── Chapas ───────────────────────────────────────────────────────────────────

  async criarChapa(req: Request, res: Response): Promise<void> {
    const config = await requireConfig(req.userId!, res);
    if (!config) return;

    const chapa = await prisma.chapa.create({
      data: { configId: config.id, ...req.body },
    });
    res.status(201).json({ data: chapa });
  },

  async atualizarChapa(req: Request, res: Response): Promise<void> {
    const config = await requireConfig(req.userId!, res);
    if (!config) return;

    const id = Number(req.params.id as string);
    const updated = await prisma.chapa.updateMany({
      where: { id, configId: config.id },
      data: req.body,
    });

    if (updated.count === 0) {
      res.status(404).json({ error: "Chapa não encontrada." });
      return;
    }
    const chapa = await prisma.chapa.findUnique({ where: { id } });
    res.json({ data: chapa });
  },

  async deletarChapa(req: Request, res: Response): Promise<void> {
    const config = await requireConfig(req.userId!, res);
    if (!config) return;

    const id = Number(req.params.id as string);
    const deleted = await prisma.chapa.deleteMany({
      where: { id, configId: config.id },
    });

    if (deleted.count === 0) {
      res.status(404).json({ error: "Chapa não encontrada." });
      return;
    }
    res.json({ message: "Chapa removida." });
  },

  // ── Fitas ────────────────────────────────────────────────────────────────────

  async criarFita(req: Request, res: Response): Promise<void> {
    const config = await requireConfig(req.userId!, res);
    if (!config) return;

    const fita = await prisma.fita.create({
      data: { configId: config.id, ...req.body },
    });
    res.status(201).json({ data: fita });
  },

  async atualizarFita(req: Request, res: Response): Promise<void> {
    const config = await requireConfig(req.userId!, res);
    if (!config) return;

    const id = Number(req.params.id as string);
    const updated = await prisma.fita.updateMany({
      where: { id, configId: config.id },
      data: req.body,
    });

    if (updated.count === 0) {
      res.status(404).json({ error: "Fita não encontrada." });
      return;
    }
    const fita = await prisma.fita.findUnique({ where: { id } });
    res.json({ data: fita });
  },

  async deletarFita(req: Request, res: Response): Promise<void> {
    const config = await requireConfig(req.userId!, res);
    if (!config) return;

    const id = Number(req.params.id as string);
    const deleted = await prisma.fita.deleteMany({
      where: { id, configId: config.id },
    });

    if (deleted.count === 0) {
      res.status(404).json({ error: "Fita não encontrada." });
      return;
    }
    res.json({ message: "Fita removida." });
  },

  // ── Corrediças ───────────────────────────────────────────────────────────────

  async criarCorredica(req: Request, res: Response): Promise<void> {
    const config = await requireConfig(req.userId!, res);
    if (!config) return;

    const corredica = await prisma.corredica.create({
      data: { configId: config.id, ...req.body },
    });
    res.status(201).json({ data: corredica });
  },

  async atualizarCorredica(req: Request, res: Response): Promise<void> {
    const config = await requireConfig(req.userId!, res);
    if (!config) return;

    const id = Number(req.params.id as string);
    const updated = await prisma.corredica.updateMany({
      where: { id, configId: config.id },
      data: req.body,
    });

    if (updated.count === 0) {
      res.status(404).json({ error: "Corrediça não encontrada." });
      return;
    }
    const corredica = await prisma.corredica.findUnique({ where: { id } });
    res.json({ data: corredica });
  },

  async deletarCorredica(req: Request, res: Response): Promise<void> {
    const config = await requireConfig(req.userId!, res);
    if (!config) return;

    const id = Number(req.params.id as string);
    const deleted = await prisma.corredica.deleteMany({
      where: { id, configId: config.id },
    });

    if (deleted.count === 0) {
      res.status(404).json({ error: "Corrediça não encontrada." });
      return;
    }
    res.json({ message: "Corrediça removida." });
  },

  // ── Ferragens ────────────────────────────────────────────────────────────────

  async criarFerragem(req: Request, res: Response): Promise<void> {
    const config = await requireConfig(req.userId!, res);
    if (!config) return;

    const ferragem = await prisma.ferragem.create({
      data: { configId: config.id, ...req.body },
    });
    res.status(201).json({ data: ferragem });
  },

  async atualizarFerragem(req: Request, res: Response): Promise<void> {
    const config = await requireConfig(req.userId!, res);
    if (!config) return;

    const id = Number(req.params.id as string);
    const updated = await prisma.ferragem.updateMany({
      where: { id, configId: config.id },
      data: req.body,
    });

    if (updated.count === 0) {
      res.status(404).json({ error: "Ferragem não encontrada." });
      return;
    }
    const ferragem = await prisma.ferragem.findUnique({ where: { id } });
    res.json({ data: ferragem });
  },

  async deletarFerragem(req: Request, res: Response): Promise<void> {
    const config = await requireConfig(req.userId!, res);
    if (!config) return;

    const id = Number(req.params.id as string);
    const deleted = await prisma.ferragem.deleteMany({
      where: { id, configId: config.id },
    });

    if (deleted.count === 0) {
      res.status(404).json({ error: "Ferragem não encontrada." });
      return;
    }
    res.json({ message: "Ferragem removida." });
  },

  // ── Motor de cálculo ─────────────────────────────────────────────────────────

  // POST /api/marcenaria/calcular
  async calcular(req: Request, res: Response): Promise<void> {
    const userId = req.userId!;

    const configDb = await prisma.configuracaoMarcenaria.findUnique({
      where: { userId },
      include: { chapas: true, fitas: true },
    });

    if (!configDb) {
      res
        .status(400)
        .json({ error: "Configure sua marcenaria antes de calcular." });
      return;
    }

    const configMotor: ConfigMotor = {
      espEstrutura: configDb.espEstrutura,
      espFundo: configDb.espFundo,
      rasgoProfundidade: configDb.rasgoProfundidade,
      rasgoBorda: configDb.rasgoBorda,
      folgaPorta: configDb.folgaPorta,
      avancoTamponamento: configDb.avancoTamponamento,
      larguraReforco: configDb.larguraReforco,
      larguraTiraOculta: configDb.larguraTiraOculta,
      kerfSerra: configDb.kerfSerra,
      margemPerda: configDb.margemPerda,
      recuoPrateleira: configDb.recuoPrateleira,
      folgaPrateleiraLat: configDb.folgaPrateleiraLat,
      folgaAlturaGaveta: configDb.folgaAlturaGaveta,
      corCaixaInterna: configDb.corCaixaInterna,
      chapaLargura: configDb.chapaLargura,
      chapaAltura: configDb.chapaAltura,
    };

    const catalogo: CatalogMotor = {
      chapas: configDb.chapas.map((c) => ({
        cor: c.cor,
        espessura: c.espessura,
        precoChapa: c.precoChapa,
      })),
      fitas: configDb.fitas.map((f) => ({
        cor: f.cor,
        largura: f.largura,
        precoMetro: f.precoMetro,
      })),
    };

    const resultado = calcularMovel(
      configMotor,
      req.body as MovelInput,
      catalogo,
    );

    // Enriquecer chapas com precoM2 para exibição no frontend
    const chapaM2 = (configDb.chapaLargura * configDb.chapaAltura) / 1_000_000;
    const chapasEnriquecidas = resultado.chapas.map((g) => ({
      ...g,
      precoM2:
        g.precoChapa != null
          ? Math.round((g.precoChapa / chapaM2) * 100) / 100
          : null,
    }));

    res.json({ data: { ...resultado, chapas: chapasEnriquecidas } });
  },
};
