// Motor de cálculo paramétrico de marcenaria — função pura, sem Prisma, sem Express.
// Todas as medidas em milímetros.

export interface ConfigMotor {
  espEstrutura: number; // espessura MDF estrutural (18 mm)
  espFundo: number; // espessura MDF fundo (6 mm)
  rasgoProfundidade: number; // profundidade do rasgo (10 mm)
  rasgoBorda: number; // distância da borda ao rasgo (10 mm)
  folgaPorta: number; // folga portas/gavetas (4 mm)
  avancoTamponamento: number; // avanço frontal do tamponamento (25 mm)
  larguraReforco: number; // altura dos reforços no balcão de pedra (100 mm)
  larguraTiraOculta: number; // largura da tira do lado oculto (60 mm)
  kerfSerra: number; // largura do disco da serra (3 mm)
  margemPerda: number; // margem de perda de chapa (0.10 = 10%)
  recuoPrateleira: number; // recuo frontal da prateleira (20 mm)
  folgaPrateleiraLat: number; // folga lateral total da prateleira (2 mm)
  folgaAlturaGaveta: number; // diferença de altura caixa vs frente da gaveta (4 mm)
  corCaixaInterna: string; // cor da caixa interna em móveis tamponados ("Branco")
  chapaLargura: number; // largura da chapa padrão (2750 mm)
  chapaAltura: number; // altura da chapa padrão (1850 mm)
}

export const configPadrao: ConfigMotor = {
  espEstrutura: 18,
  espFundo: 6,
  rasgoProfundidade: 10,
  rasgoBorda: 10,
  folgaPorta: 4,
  avancoTamponamento: 25,
  larguraReforco: 100,
  larguraTiraOculta: 60,
  kerfSerra: 3,
  margemPerda: 0.1,
  recuoPrateleira: 20,
  folgaPrateleiraLat: 2,
  folgaAlturaGaveta: 4,
  corCaixaInterna: "Branco",
  chapaLargura: 2750,
  chapaAltura: 1850,
};

export type TipoPorta = "SOBREPOSTA" | "EMBUTIDA" | "MEIA";
export type TipoTampo = "MDF" | "PEDRA";

export interface GavetaInput {
  alturaFrente: number; // altura da frente/tampa da gaveta (mm)
  descontoLarguraMm: number; // desconto total das corrediças já em mm (ex: 63)
  comprimentoCorredica: number; // comprimento da corrediça = profundidade da caixa (mm)
}

export type FrenteInput =
  | { tipo: "PORTAS"; nPortas: number }
  | { tipo: "GAVETAS"; gavetas: GavetaInput[] };

// Uma seção da frente (parte do móvel) com seu tamanho e conteúdo.
// tamanhoMm = largura da seção (orientação HORIZONTAL) ou altura (VERTICAL).
export interface SecaoFrente {
  tamanhoMm: number;
  conteudo: FrenteInput;
}

export interface FerragemInput {
  id: number;
  nome: string;
  qtd: number;
  preco?: number; // preço cadastrado (passado pelo controller via catálogo)
}

export interface MovelInput {
  largura: number;
  altura: number;
  profundidade: number;
  tipoTampo: TipoTampo;
  corAcabamento: string;
  corFundo: string;
  ladoOcultoNaCor: boolean;
  tamponamentoTampo: boolean;
  tamponamentoLaterais: boolean;
  tamponamentoBase: boolean;
  tipoPorta: TipoPorta;
  // Modelo antigo: uma única frente para todo o vão (mantido por compatibilidade)
  frente?: FrenteInput;
  // Modelo novo: frente dividida em seções com divisórias automáticas.
  // HORIZONTAL = seções lado a lado (divisória em pé / vertical).
  // VERTICAL = seções empilhadas (divisória deitada / horizontal).
  orientacaoSecoes?: "HORIZONTAL" | "VERTICAL";
  secoes?: SecaoFrente[];
  nPrateleiras: number;
  ferragens?: FerragemInput[]; // ferragens informadas pelo usuário
}

// ─── Catálogo (passado opcionalmente pelo controller — motor permanece puro) ──

export interface CatalogMotor {
  chapas: Array<{ cor: string; espessura: number; precoChapa: number }>;
  fitas: Array<{ cor: string; largura: number; precoMetro: number }>;
}

// ─── Saída ────────────────────────────────────────────────────────────────────

export interface Peca {
  nome: string;
  qtd: number;
  largura: number;
  altura: number;
  espessura: number;
  cor: string;
  m2Unit: number;
  metrosFitaUnit: number; // metros de fita por unidade (0 = não leva)
  larguraFitaMm: number; // 22 ou 44 mm (0 se não leva)
}

export interface GrupoChapa {
  cor: string;
  espessura: number;
  m2Liquido: number;
  m2ComPerda: number;
  chapasInteiras: number;
  precoChapa: number | null;
  custoChapas: number | null;
}

export interface GrupoFita {
  cor: string;
  largura: number; // mm
  metros: number;
  precoMetro: number | null;
  custoFita: number | null;
}

export interface FerragemResultado {
  id: number;
  nome: string;
  qtd: number;
  preco: number | null;
  custo: number | null;
}

export interface CustosMovel {
  chapas: number;
  fita: number;
  ferragens: number;
  total: number;
}

export interface ResultadoMovel {
  pecas: Peca[];
  chapas: GrupoChapa[];
  fita: GrupoFita[];
  ferragens: FerragemResultado[];
  custos: CustosMovel;
  observacoes: string[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function m2(largura: number, altura: number): number {
  return (largura * altura) / 1_000_000;
}

// Regras padrão de fita de borda (seção 2.2 do spec)
// Fundo 6 mm: NUNCA. Caixas internas de gaveta: nunca.
// Lateral: frente (1 aresta vertical longa) + 2 horizontais (topo e base).
// Tampo / Base / Tamponamento*: só frente (aresta da largura).
// Porta / Frente de gaveta: 4 bordas.
// Prateleira: só frente.
// Todos os 18 mm → fita 22 mm (v1 — peça dupla/36 mm → 44 mm é v2).
function metrosFitaUnit(
  nome: string,
  espessura: number,
  largura: number,
  altura: number,
): { metros: number; larguraFita: number } {
  if (espessura !== 18) return { metros: 0, larguraFita: 0 };

  const nomeL = nome.toLowerCase();

  // Peças internas de caixa de gaveta e reforços: sem fita
  if (
    nomeL.includes("fundo") ||
    nomeL.includes("lateral caixa") ||
    nomeL.includes("frente/traseira caixa") ||
    nomeL.includes("fundo caixa") ||
    nomeL.includes("reforço") ||
    nomeL.includes("tira tamponamento")
  ) {
    return { metros: 0, larguraFita: 0 };
  }

  // Lateral: frente (aresta = altura) + 2 horizontais (arestas = largura cada)
  if (nomeL === "lateral") {
    return { metros: (altura + 2 * largura) / 1000, larguraFita: 22 };
  }

  // Porta ou frente de gaveta: 4 bordas
  if (nomeL === "porta" || nomeL.startsWith("frente gaveta")) {
    return { metros: (2 * largura + 2 * altura) / 1000, larguraFita: 22 };
  }

  // Prateleira: só frente (aresta = largura)
  if (nomeL === "prateleira") {
    return { metros: largura / 1000, larguraFita: 22 };
  }

  // Divisória vertical (painel em pé): fita só na frente vertical (= altura)
  if (nomeL === "divisória vertical") {
    return { metros: altura / 1000, larguraFita: 22 };
  }

  // Divisória horizontal (painel deitado): fita só na frente horizontal (= largura)
  if (nomeL === "divisória horizontal") {
    return { metros: largura / 1000, larguraFita: 22 };
  }

  // Tampo, Base, Tamponamento*: só frente (aresta = largura)
  return { metros: largura / 1000, larguraFita: 22 };
}

function pecaFn(
  nome: string,
  qtd: number,
  largura: number,
  altura: number,
  espessura: number,
  cor: string,
): Peca {
  const { metros, larguraFita } = metrosFitaUnit(
    nome,
    espessura,
    largura,
    altura,
  );
  return {
    nome,
    qtd,
    largura,
    altura,
    espessura,
    cor,
    m2Unit: m2(largura, altura),
    metrosFitaUnit: metros,
    larguraFitaMm: larguraFita,
  };
}

// ─── motor principal ──────────────────────────────────────────────────────────

export function calcularMovel(
  config: ConfigMotor,
  input: MovelInput,
  catalogo?: CatalogMotor,
): ResultadoMovel {
  const {
    espEstrutura: E,
    espFundo: EF,
    rasgoProfundidade: RP,
    folgaPorta: FP,
    recuoPrateleira,
    folgaPrateleiraLat,
    folgaAlturaGaveta,
  } = config;

  const { largura: L, altura: A, profundidade: P } = input;
  const pecas: Peca[] = [];
  const observacoes: string[] = [];

  // ── cores ────────────────────────────────────────────────────────────────────
  const temTamponamento =
    input.tamponamentoTampo ||
    input.tamponamentoLaterais ||
    input.tamponamentoBase;
  const corCaixa = temTamponamento
    ? config.corCaixaInterna
    : input.corAcabamento;
  const corAcab = input.corAcabamento;
  const corOculto = input.ladoOcultoNaCor
    ? input.corAcabamento
    : config.corCaixaInterna;

  // ── 1. ESTRUTURA ─────────────────────────────────────────────────────────────

  if (input.tipoTampo === "MDF") {
    pecas.push(pecaFn("Tampo", 1, L, P, E, corCaixa));
    pecas.push(pecaFn("Base", 1, L, P, E, corCaixa));
    pecas.push(pecaFn("Lateral", 2, P, A - 2 * E, E, corCaixa));
    pecas.push(
      pecaFn(
        "Fundo",
        1,
        L - 2 * E + 2 * RP,
        A - 2 * E + 2 * RP,
        EF,
        input.corFundo,
      ),
    );
  } else {
    pecas.push(pecaFn("Base", 1, L, P, E, corCaixa));
    const altLateralPedra = A - E;
    pecas.push(pecaFn("Lateral", 2, P, altLateralPedra, E, corCaixa));
    const largReforco = L - 2 * E;
    pecas.push(
      pecaFn("Reforço", 2, largReforco, config.larguraReforco, E, corCaixa),
    );
    pecas.push(
      pecaFn(
        "Fundo",
        1,
        L - 2 * E + 2 * RP,
        altLateralPedra + RP,
        EF,
        input.corFundo,
      ),
    );
    observacoes.push(
      "Tampo em pedra/mármore — não incluído no plano de corte. Providenciar com marmoreiro.",
    );
  }

  // ── 2. TAMPONAMENTO ──────────────────────────────────────────────────────────

  const altLateralEfetiva = input.tipoTampo === "MDF" ? A - 2 * E : A - E;

  if (input.tamponamentoTampo) {
    pecas.push(pecaFn("Tamponamento Tampo", 1, L, P, E, corAcab));
  }

  if (input.tamponamentoLaterais) {
    pecas.push(
      pecaFn(
        "Tamponamento Lateral Visível",
        1,
        P,
        altLateralEfetiva,
        E,
        corAcab,
      ),
    );
    pecas.push(
      pecaFn(
        "Tira Tamponamento Oculto",
        1,
        config.larguraTiraOculta,
        altLateralEfetiva,
        E,
        corOculto,
      ),
    );
  }

  if (input.tamponamentoBase) {
    pecas.push(pecaFn("Tamponamento Base", 1, L, P, E, corAcab));
  }

  // ── 3. FRENTE: PORTAS OU GAVETAS ─────────────────────────────────────────────

  const vaoLargura = L - 2 * E;
  const vaoAltura =
    input.tipoTampo === "MDF" ? A - 2 * E : A - E - config.larguraReforco;

  // Folga entre portas vizinhas (mm). Na divisória de 18 mm as duas portas
  // sobrepõem ~7,5 mm cada, sobrando estes 3 mm de folga no meio.
  const FOLGA_ENTRE_PORTAS = 3;

  // A divisória é menor que a lateral: não encosta no fundo (rebaixe de 1 cm)
  // e fica abaixo do reforço do topo (36 mm).
  const REBAIXE_FUNDO = RP; // rasgoProfundidade (1 cm)
  const ALTURA_REFORCO = 36; // reforço no topo (3,6 cm)
  const divProf = P - REBAIXE_FUNDO; // profundidade da divisória

  // Gera as peças da frente de uma abertura (vão), com a frente embutida no vão.
  // Usada pelo modelo em seções. gavetaSeq numera as gavetas de forma contínua.
  let gavetaSeq = 0;
  const gerarFrenteDoVao = (
    openW: number,
    openH: number,
    conteudo: FrenteInput,
  ) => {
    if (conteudo.tipo === "PORTAS") {
      const n = conteudo.nPortas;
      // Porta é fixada por dobradiça num vertical. Cada vão comporta no máximo
      // 2 portas (abertura central). Acima disso, divisórias internas dão onde
      // fixar as portas do meio: nº de divisórias = teto(n/2) − 1.
      // No vão (embutida), a porta fica dentro: desconta a divisória + folgas.
      const nDiv = Math.ceil(n / 2) - 1;
      const largPorta = (openW - nDiv * E - (n + 1) * FOLGA_ENTRE_PORTAS) / n;
      const altPorta = openH - 2 * FP;
      pecas.push(pecaFn("Porta", n, largPorta, altPorta, E, corAcab));
      if (nDiv > 0) {
        pecas.push(
          pecaFn(
            "Divisória Vertical",
            nDiv,
            divProf,
            openH - ALTURA_REFORCO,
            E,
            corCaixa,
          ),
        );
      }
    } else {
      for (const g of conteudo.gavetas) {
        gavetaSeq++;
        const label = `Gaveta ${gavetaSeq}`;
        const altFrente = g.alturaFrente;
        const largFrente = openW - 2 * FP;
        pecas.push(
          pecaFn(
            `Frente Gaveta ${gavetaSeq}`,
            1,
            largFrente,
            altFrente,
            E,
            corAcab,
          ),
        );
        const largCaixa = openW - g.descontoLarguraMm;
        const altCaixa = altFrente - folgaAlturaGaveta;
        const profCaixa = g.comprimentoCorredica;
        pecas.push(
          pecaFn(
            `Lateral Caixa ${label}`,
            2,
            profCaixa,
            altCaixa,
            E,
            config.corCaixaInterna,
          ),
        );
        const largFrenteCaixa = largCaixa - 2 * E;
        pecas.push(
          pecaFn(
            `Frente/Traseira Caixa ${label}`,
            2,
            largFrenteCaixa,
            altCaixa,
            E,
            config.corCaixaInterna,
          ),
        );
        pecas.push(
          pecaFn(
            `Fundo Caixa ${label}`,
            1,
            largCaixa - 2 * E + 2 * RP,
            profCaixa - 2 * E + 2 * RP,
            EF,
            config.corCaixaInterna,
          ),
        );
      }
    }
  };

  if (input.secoes && input.secoes.length > 0) {
    // ── MODELO EM SEÇÕES com divisórias automáticas ──
    const orient = input.orientacaoSecoes ?? "HORIZONTAL";
    const secoes = input.secoes;
    const nDiv = secoes.length - 1;
    const somaSecoes = secoes.reduce((a, s) => a + s.tamanhoMm, 0) + nDiv * E;

    if (orient === "HORIZONTAL") {
      // Seções lado a lado → divisórias verticais (em pé), altura cheia
      for (const s of secoes)
        gerarFrenteDoVao(s.tamanhoMm, vaoAltura, s.conteudo);
      if (nDiv > 0) {
        pecas.push(
          pecaFn(
            "Divisória Vertical",
            nDiv,
            divProf,
            altLateralEfetiva - ALTURA_REFORCO,
            E,
            corCaixa,
          ),
        );
      }
      if (Math.abs(somaSecoes - vaoLargura) > 1) {
        observacoes.push(
          `As seções + divisórias somam ${Math.round(somaSecoes)} mm, mas o vão interno de largura é ${vaoLargura} mm. Ajuste as larguras das seções.`,
        );
      }
    } else {
      // Seções empilhadas → divisórias horizontais (deitadas), largura cheia
      for (const s of secoes)
        gerarFrenteDoVao(vaoLargura, s.tamanhoMm, s.conteudo);
      if (nDiv > 0) {
        pecas.push(
          pecaFn("Divisória Horizontal", nDiv, vaoLargura, P, E, corCaixa),
        );
      }
      if (Math.abs(somaSecoes - vaoAltura) > 1) {
        observacoes.push(
          `As seções + divisórias somam ${Math.round(somaSecoes)} mm, mas o vão interno de altura é ${vaoAltura} mm. Ajuste as alturas das seções.`,
        );
      }
    }
  } else if (input.frente) {
    // ── MODELO ANTIGO: uma única frente para todo o vão ──
    if (input.frente.tipo === "PORTAS") {
      const { nPortas } = input.frente;
      // Máx 2 portas por vão; acima disso, divisórias internas para as dobradiças
      const nDiv = Math.ceil(nPortas / 2) - 1;
      let largPorta: number;
      if (input.tipoPorta === "EMBUTIDA") {
        // Porta dentro do vão: desconta as divisórias (18 mm) + folgas
        largPorta =
          (vaoLargura - nDiv * E - (nPortas + 1) * FOLGA_ENTRE_PORTAS) /
          nPortas;
      } else {
        // SOBREPOSTA/MEIA: a porta sobrepõe a estrutura e as divisórias,
        // então NÃO desconta a divisória — só os 3 mm de folga entre portas.
        largPorta = (L - (nPortas - 1) * FOLGA_ENTRE_PORTAS) / nPortas;
      }
      const altPorta = vaoAltura - 2 * FP;
      pecas.push(pecaFn("Porta", nPortas, largPorta, altPorta, E, corAcab));
      if (nDiv > 0) {
        pecas.push(
          pecaFn(
            "Divisória Vertical",
            nDiv,
            divProf,
            altLateralEfetiva - ALTURA_REFORCO,
            E,
            corCaixa,
          ),
        );
      }
    } else {
      const { gavetas } = input.frente;
      const largFrente =
        input.tipoPorta === "EMBUTIDA" ? vaoLargura - 2 * FP : L - 2 * FP;

      gavetas.forEach((g, i) => {
        const label = `Gaveta ${i + 1}`;
        const altFrente = g.alturaFrente;

        pecas.push(
          pecaFn(
            `Frente Gaveta ${i + 1}`,
            1,
            largFrente,
            altFrente,
            E,
            corAcab,
          ),
        );

        const largCaixa = vaoLargura - g.descontoLarguraMm;
        const altCaixa = altFrente - folgaAlturaGaveta;
        const profCaixa = g.comprimentoCorredica;

        pecas.push(
          pecaFn(
            `Lateral Caixa ${label}`,
            2,
            profCaixa,
            altCaixa,
            E,
            config.corCaixaInterna,
          ),
        );
        const largFrenteCaixa = largCaixa - 2 * E;
        pecas.push(
          pecaFn(
            `Frente/Traseira Caixa ${label}`,
            2,
            largFrenteCaixa,
            altCaixa,
            E,
            config.corCaixaInterna,
          ),
        );
        pecas.push(
          pecaFn(
            `Fundo Caixa ${label}`,
            1,
            largCaixa - 2 * E + 2 * RP,
            profCaixa - 2 * E + 2 * RP,
            EF,
            config.corCaixaInterna,
          ),
        );
      });
    }
  }

  // ── 4. PRATELEIRAS ───────────────────────────────────────────────────────────

  if (input.nPrateleiras > 0) {
    const largPrat = vaoLargura - folgaPrateleiraLat;
    const profPrat = P - recuoPrateleira;
    pecas.push(
      pecaFn("Prateleira", input.nPrateleiras, largPrat, profPrat, E, corCaixa),
    );
  }

  // ── 5. AGRUPAMENTO DE CHAPAS com custo ───────────────────────────────────────

  const chapaM2 = (config.chapaLargura * config.chapaAltura) / 1_000_000;
  const gruposMap = new Map<
    string,
    { cor: string; espessura: number; m2Liq: number }
  >();

  for (const p of pecas) {
    const key = `${p.cor}|${p.espessura}`;
    const g = gruposMap.get(key);
    const area = p.m2Unit * p.qtd;
    if (g) {
      g.m2Liq += area;
    } else {
      gruposMap.set(key, { cor: p.cor, espessura: p.espessura, m2Liq: area });
    }
  }

  const chapas: GrupoChapa[] = Array.from(gruposMap.values()).map((g) => {
    const m2ComPerda = g.m2Liq * (1 + config.margemPerda);
    const chapasInteiras = Math.ceil(m2ComPerda / chapaM2);
    const registro = catalogo?.chapas.find(
      (c) => c.cor === g.cor && c.espessura === g.espessura,
    );
    const precoChapa = registro?.precoChapa ?? null;
    return {
      cor: g.cor,
      espessura: g.espessura,
      m2Liquido: Math.round(g.m2Liq * 10000) / 10000,
      m2ComPerda: Math.round(m2ComPerda * 10000) / 10000,
      chapasInteiras,
      precoChapa,
      custoChapas: precoChapa != null ? chapasInteiras * precoChapa : null,
    };
  });

  // ── 6. AGRUPAMENTO DE FITA com custo ─────────────────────────────────────────

  const fitaMap = new Map<
    string,
    { cor: string; largura: number; metros: number }
  >();

  for (const p of pecas) {
    if (p.metrosFitaUnit === 0) continue;
    const key = `${p.cor}|${p.larguraFitaMm}`;
    const g = fitaMap.get(key) ?? {
      cor: p.cor,
      largura: p.larguraFitaMm,
      metros: 0,
    };
    g.metros += p.metrosFitaUnit * p.qtd;
    fitaMap.set(key, g);
  }

  const fita: GrupoFita[] = Array.from(fitaMap.values()).map((g) => {
    const registro = catalogo?.fitas.find(
      (f) => f.cor === g.cor && f.largura === g.largura,
    );
    const precoMetro = registro?.precoMetro ?? null;
    const metros = Math.round(g.metros * 100) / 100;
    return {
      cor: g.cor,
      largura: g.largura,
      metros,
      precoMetro,
      custoFita: precoMetro != null ? metros * precoMetro : null,
    };
  });

  // ── 7. FERRAGENS ─────────────────────────────────────────────────────────────

  const ferragens: FerragemResultado[] = (input.ferragens ?? []).map((f) => ({
    id: f.id,
    nome: f.nome,
    qtd: f.qtd,
    preco: f.preco ?? null,
    custo: f.preco != null ? f.qtd * f.preco : null,
  }));

  // ── 8. CUSTOS TOTAIS ─────────────────────────────────────────────────────────

  const custoChapasTotal = chapas.reduce((s, g) => s + (g.custoChapas ?? 0), 0);
  const custoFitaTotal = fita.reduce((s, g) => s + (g.custoFita ?? 0), 0);
  const custoFerragensTotal = ferragens.reduce((s, f) => s + (f.custo ?? 0), 0);

  const custos: CustosMovel = {
    chapas: Math.round(custoChapasTotal * 100) / 100,
    fita: Math.round(custoFitaTotal * 100) / 100,
    ferragens: Math.round(custoFerragensTotal * 100) / 100,
    total:
      Math.round(
        (custoChapasTotal + custoFitaTotal + custoFerragensTotal) * 100,
      ) / 100,
  };

  return { pecas, chapas, fita, ferragens, custos, observacoes };
}

// ─── helpers exportados ───────────────────────────────────────────────────────

export function calcularAlturasGavetasUniformes(
  config: ConfigMotor,
  vaoAltura: number,
  nGavetas: number,
): number {
  const alturaFrente =
    (vaoAltura - (nGavetas + 1) * config.folgaPorta) / nGavetas;
  return Math.round(alturaFrente * 100) / 100;
}

export function vaoAlturaMovel(
  config: ConfigMotor,
  input: Pick<MovelInput, "altura" | "tipoTampo">,
): number {
  return input.tipoTampo === "MDF"
    ? input.altura - 2 * config.espEstrutura
    : input.altura - config.espEstrutura - config.larguraReforco;
}
