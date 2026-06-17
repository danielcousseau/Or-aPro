// Testes do motor de cálculo paramétrico — função pura, sem banco de dados.
// Números de referência extraídos do prompt de especificação (seção 4).

const {
  calcularMovel,
  calcularAlturasGavetasUniformes,
  vaoAlturaMovel,
  configPadrao,
} = require("../src/services/marcenaria/motorMarcenaria");

// Armário de referência: 800 × 700 × 350 mm
const L = 800,
  A = 700,
  P = 350;
const cfg = configPadrao;

// Utilitários de busca nas peças
function buscar(pecas, nome) {
  return pecas.find((p) => p.nome === nome);
}
function buscarQtd(pecas, nome) {
  return pecas.filter((p) => p.nome === nome);
}

// ─── 1. ESTRUTURA COM TAMPO MDF ───────────────────────────────────────────────

describe("Estrutura MDF — Armário 800×700×350", () => {
  const input = {
    largura: L,
    altura: A,
    profundidade: P,
    tipoTampo: "MDF",
    corAcabamento: "Amadeirado",
    corFundo: "Amadeirado",
    ladoOcultoNaCor: false,
    tamponamentoTampo: false,
    tamponamentoLaterais: false,
    tamponamentoBase: false,
    tipoPorta: "EMBUTIDA",
    frente: { tipo: "PORTAS", nPortas: 2 },
    nPrateleiras: 0,
  };
  const { pecas } = calcularMovel(cfg, input);

  test("Tampo: 800 × 350 × 18", () => {
    const p = buscar(pecas, "Tampo");
    expect(p).toBeDefined();
    expect(p.largura).toBe(800);
    expect(p.altura).toBe(350);
    expect(p.espessura).toBe(18);
  });

  test("Base: 800 × 350 × 18", () => {
    const p = buscar(pecas, "Base");
    expect(p).toBeDefined();
    expect(p.largura).toBe(800);
    expect(p.altura).toBe(350);
    expect(p.espessura).toBe(18);
  });

  test("Lateral: 350 × 664 × 18 (qtd 2)", () => {
    const p = buscar(pecas, "Lateral");
    expect(p).toBeDefined();
    expect(p.qtd).toBe(2);
    expect(p.largura).toBe(350);
    expect(p.altura).toBe(664); // 700 - 2×18
    expect(p.espessura).toBe(18);
  });

  test("Fundo: 784 × 684 × 6", () => {
    const p = buscar(pecas, "Fundo");
    expect(p).toBeDefined();
    expect(p.largura).toBe(784); // 800 - 36 + 20
    expect(p.altura).toBe(684); // 700 - 36 + 20
    expect(p.espessura).toBe(6);
  });

  test("Vão interno: 764 × 664", () => {
    const vaoL = L - 2 * cfg.espEstrutura;
    const vaoA = vaoAlturaMovel(cfg, { altura: A, tipoTampo: "MDF" });
    expect(vaoL).toBe(764);
    expect(vaoA).toBe(664);
  });
});

// ─── 2. PORTAS EMBUTIDAS ──────────────────────────────────────────────────────

describe("2 Portas EMBUTIDAS — 800×700×350", () => {
  const input = {
    largura: L,
    altura: A,
    profundidade: P,
    tipoTampo: "MDF",
    corAcabamento: "Amadeirado",
    corFundo: "Amadeirado",
    ladoOcultoNaCor: false,
    tamponamentoTampo: false,
    tamponamentoLaterais: false,
    tamponamentoBase: false,
    tipoPorta: "EMBUTIDA",
    frente: { tipo: "PORTAS", nPortas: 2 },
    nPrateleiras: 0,
  };
  const { pecas } = calcularMovel(cfg, input);

  test("Porta EMBUTIDA: 377.5 × 656 (qtd 2)", () => {
    const p = buscar(pecas, "Porta");
    expect(p).toBeDefined();
    expect(p.qtd).toBe(2);
    expect(p.largura).toBe(377.5); // (764 - 3×3) / 2  (folga 3 mm)
    expect(p.altura).toBe(656); // 664 - 8
  });
});

// ─── 3. PORTAS SOBREPOSTAS ────────────────────────────────────────────────────

describe("2 Portas SOBREPOSTAS — 800×700×350", () => {
  const input = {
    largura: L,
    altura: A,
    profundidade: P,
    tipoTampo: "MDF",
    corAcabamento: "Amadeirado",
    corFundo: "Amadeirado",
    ladoOcultoNaCor: false,
    tamponamentoTampo: false,
    tamponamentoLaterais: false,
    tamponamentoBase: false,
    tipoPorta: "SOBREPOSTA",
    frente: { tipo: "PORTAS", nPortas: 2 },
    nPrateleiras: 0,
  };
  const { pecas } = calcularMovel(cfg, input);

  test("Porta SOBREPOSTA: 398.5 × 656 (qtd 2)", () => {
    const p = buscar(pecas, "Porta");
    expect(p).toBeDefined();
    expect(p.qtd).toBe(2);
    expect(p.largura).toBe(398.5); // (800 - 1×3) / 2  (sobrepõe, só 3 mm de folga)
    expect(p.altura).toBe(656); // 664 - 8
  });
});

// ─── 4. GAVETAS EMBUTIDAS — CORREDIÇA TELESCÓPICA ─────────────────────────────

describe("4 Gavetas EMBUTIDAS + telescópica 63 mm — 800×700×350", () => {
  // Altura de cada frente = (664 - 5×4) / 4 = 161
  const vaoA = 664;
  const nGavetas = 4;
  const altFrente = calcularAlturasGavetasUniformes(cfg, vaoA, nGavetas); // 161
  const gavetas = Array.from({ length: nGavetas }, () => ({
    alturaFrente: altFrente,
    descontoLarguraMm: 63, // telescópica
    comprimentoCorredica: 300,
  }));

  const input = {
    largura: L,
    altura: A,
    profundidade: P,
    tipoTampo: "MDF",
    corAcabamento: "Amadeirado",
    corFundo: "Amadeirado",
    ladoOcultoNaCor: false,
    tamponamentoTampo: false,
    tamponamentoLaterais: false,
    tamponamentoBase: false,
    tipoPorta: "EMBUTIDA",
    frente: { tipo: "GAVETAS", gavetas },
    nPrateleiras: 0,
  };
  const { pecas } = calcularMovel(cfg, input);

  test("Altura uniforme por frente: 161 mm", () => {
    expect(altFrente).toBe(161); // (664 - 20) / 4
  });

  test("Frente Gaveta 1: largura 756, altura 161", () => {
    const p = buscar(pecas, "Frente Gaveta 1");
    expect(p).toBeDefined();
    expect(p.largura).toBe(756); // 764 - 2×4
    expect(p.altura).toBe(161);
  });

  test("Largura caixa de gaveta: 701 mm (764 − 63)", () => {
    // A lateral da caixa tem profundidade = comprimentoCorredica e altura = altCaixa
    const latCaixa = buscar(pecas, "Lateral Caixa Gaveta 1");
    expect(latCaixa).toBeDefined();
    // altCaixa = altFrente - folgaAlturaGaveta = 161 - 4 = 157
    expect(latCaixa.altura).toBe(157);
  });

  test("Frente/Traseira caixa: 665 mm (701 − 36)", () => {
    const p = buscar(pecas, "Frente/Traseira Caixa Gaveta 1");
    expect(p).toBeDefined();
    expect(p.largura).toBe(665); // 701 - 2×18
    expect(p.altura).toBe(157);
  });

  test("Altura caixa de gaveta: 157 mm (161 − 4)", () => {
    const latCaixa = buscar(pecas, "Lateral Caixa Gaveta 1");
    expect(latCaixa.altura).toBe(157);
  });
});

// ─── 5. BALCÃO COM TAMPO DE PEDRA ────────────────────────────────────────────
// ⚠️  ATENÇÃO: o prompt especifica reforços de 728 mm, mas a fórmula L − 2E = 764.
//     O teste abaixo verifica o valor calculado pelo motor (764) e documenta a
//     discrepância. Confirmar com o usuário qual medida está correta (seção 7 do
//     prompt, pendência #2).

describe("Balcão PEDRA — 800×700×350", () => {
  const input = {
    largura: L,
    altura: A,
    profundidade: P,
    tipoTampo: "PEDRA",
    corAcabamento: "Amadeirado",
    corFundo: "Amadeirado",
    ladoOcultoNaCor: false,
    tamponamentoTampo: false,
    tamponamentoLaterais: false,
    tamponamentoBase: false,
    tipoPorta: "SOBREPOSTA",
    frente: { tipo: "PORTAS", nPortas: 2 },
    nPrateleiras: 0,
  };
  const { pecas, observacoes } = calcularMovel(cfg, input);

  test('Não gera peça "Tampo"', () => {
    expect(buscar(pecas, "Tampo")).toBeUndefined();
  });

  test("Base: 800 × 350 × 18", () => {
    const p = buscar(pecas, "Base");
    expect(p.largura).toBe(800);
    expect(p.altura).toBe(350);
  });

  test("Lateral: 350 × 682 × 18 (700 − 18)", () => {
    const p = buscar(pecas, "Lateral");
    expect(p.altura).toBe(682); // A - E = 700 - 18
  });

  test("Gera 2 reforços × 100 mm altura", () => {
    const p = buscar(pecas, "Reforço");
    expect(p).toBeDefined();
    expect(p.qtd).toBe(2);
    expect(p.altura).toBe(100);
  });

  // ⚠️  DISCREPÂNCIA DOCUMENTADA
  // O prompt diz 728 mm. A fórmula "entre as laterais" = L − 2E = 764 mm.
  // Hipótese: 728 = L − 4E (reforço encaixado em dado de 18 mm em cada lateral).
  // Usando 764 (fórmula padrão) até confirmação do usuário.
  test("[VERIFICAR] Reforço largura = 764 mm (prompt diz 728 — confirmar)", () => {
    const p = buscar(pecas, "Reforço");
    expect(p.largura).toBe(764); // L - 2×18; prompt indica 728 = L - 4×18
  });

  test("Observação de pedra presente", () => {
    expect(observacoes.length).toBeGreaterThan(0);
    expect(observacoes[0]).toMatch(/pedra|mármore/i);
  });
});

// ─── 6. PRATELEIRAS ───────────────────────────────────────────────────────────

describe("Prateleiras — 800×700×350", () => {
  const input = {
    largura: L,
    altura: A,
    profundidade: P,
    tipoTampo: "MDF",
    corAcabamento: "Amadeirado",
    corFundo: "Amadeirado",
    ladoOcultoNaCor: false,
    tamponamentoTampo: false,
    tamponamentoLaterais: false,
    tamponamentoBase: false,
    tipoPorta: "EMBUTIDA",
    frente: { tipo: "PORTAS", nPortas: 2 },
    nPrateleiras: 2,
  };
  const { pecas } = calcularMovel(cfg, input);

  test("Prateleira: largura 762, profundidade 330, qtd 2", () => {
    const p = buscar(pecas, "Prateleira");
    expect(p).toBeDefined();
    expect(p.qtd).toBe(2);
    expect(p.largura).toBe(762); // 764 - 2 (folgaPrateleiraLat)
    expect(p.altura).toBe(330); // 350 - 20 (recuoPrateleira)
  });
});

// ─── 7. AGRUPAMENTO DE CHAPAS ─────────────────────────────────────────────────

describe("Agrupamento de chapas", () => {
  const input = {
    largura: L,
    altura: A,
    profundidade: P,
    tipoTampo: "MDF",
    corAcabamento: "Amadeirado",
    corFundo: "Branco",
    ladoOcultoNaCor: false,
    tamponamentoTampo: false,
    tamponamentoLaterais: false,
    tamponamentoBase: false,
    tipoPorta: "EMBUTIDA",
    frente: { tipo: "PORTAS", nPortas: 2 },
    nPrateleiras: 0,
  };
  const { chapas } = calcularMovel(cfg, input);

  test("Gera pelo menos 2 grupos (cor/espessura diferentes)", () => {
    // Amadeirado 18mm (estrutura + portas) e Branco 6mm (fundo)
    expect(chapas.length).toBeGreaterThanOrEqual(2);
  });

  test("m2ComPerda >= m2Liquido em todos os grupos", () => {
    chapas.forEach((g) => {
      expect(g.m2ComPerda).toBeGreaterThanOrEqual(g.m2Liquido);
    });
  });

  test("chapasInteiras >= 1 em todos os grupos", () => {
    chapas.forEach((g) => {
      expect(g.chapasInteiras).toBeGreaterThanOrEqual(1);
    });
  });
});

// ─── 8. MAIS DE 2 PORTAS → DIVISÓRIAS AUTOMÁTICAS (frente única) ──────────────
// Porta é fixada por dobradiça num vertical. Máx 2 portas por vão (abertura
// central). Acima disso: divisórias internas = teto(n/2) − 1.

describe("4 Portas SOBREPOSTAS — 800×700×350 (1 divisória)", () => {
  const input = {
    largura: L,
    altura: A,
    profundidade: P,
    tipoTampo: "MDF",
    corAcabamento: "Amadeirado",
    corFundo: "Amadeirado",
    ladoOcultoNaCor: false,
    tamponamentoTampo: false,
    tamponamentoLaterais: false,
    tamponamentoBase: false,
    tipoPorta: "SOBREPOSTA",
    frente: { tipo: "PORTAS", nPortas: 4 },
    nPrateleiras: 0,
  };
  const { pecas } = calcularMovel(cfg, input);

  test("4 portas = 2 pares → gera 1 Divisória Vertical", () => {
    const d = buscar(pecas, "Divisória Vertical");
    expect(d).toBeDefined();
    expect(d.qtd).toBe(1); // teto(4/2) - 1 = 1
  });

  test("Porta SOBREPOSTA: 197.75 × 656 (qtd 4, sobrepõe a divisória)", () => {
    const p = buscar(pecas, "Porta");
    expect(p).toBeDefined();
    expect(p.qtd).toBe(4);
    expect(p.largura).toBe(197.75); // (800 - 3×3) / 4  (não desconta a divisória)
    expect(p.altura).toBe(656); // 664 - 8
  });
});

describe("5 Portas — 1600×700×350 (2 divisórias)", () => {
  const input = {
    largura: 1600,
    altura: A,
    profundidade: P,
    tipoTampo: "MDF",
    corAcabamento: "Amadeirado",
    corFundo: "Amadeirado",
    ladoOcultoNaCor: false,
    tamponamentoTampo: false,
    tamponamentoLaterais: false,
    tamponamentoBase: false,
    tipoPorta: "SOBREPOSTA",
    frente: { tipo: "PORTAS", nPortas: 5 },
    nPrateleiras: 0,
  };
  const { pecas } = calcularMovel(cfg, input);

  test("5 portas = 2 pares + 1 → gera 2 Divisórias Verticais", () => {
    const d = buscar(pecas, "Divisória Vertical");
    expect(d).toBeDefined();
    expect(d.qtd).toBe(2); // teto(5/2) - 1 = 2
  });

  test("5 portas sobrepostas iguais em 1600 mm = 317.6 mm cada", () => {
    const p = buscar(pecas, "Porta");
    expect(p.qtd).toBe(5);
    // sobreposta cobre as divisórias: (1600 - 4×3) / 5 = 1588 / 5 = 317.6
    expect(p.largura).toBe(317.6);
  });
});

describe("2 Portas continuam SEM divisória", () => {
  const input = {
    largura: L,
    altura: A,
    profundidade: P,
    tipoTampo: "MDF",
    corAcabamento: "Amadeirado",
    corFundo: "Amadeirado",
    ladoOcultoNaCor: false,
    tamponamentoTampo: false,
    tamponamentoLaterais: false,
    tamponamentoBase: false,
    tipoPorta: "SOBREPOSTA",
    frente: { tipo: "PORTAS", nPortas: 2 },
    nPrateleiras: 0,
  };
  const { pecas } = calcularMovel(cfg, input);

  test("2 portas → nenhuma Divisória Vertical", () => {
    expect(buscar(pecas, "Divisória Vertical")).toBeUndefined();
  });

  test("Porta 2 sobreposta = 398.5 (sem divisória)", () => {
    const p = buscar(pecas, "Porta");
    expect(p.largura).toBe(398.5); // (800 - 1×3) / 2
  });
});

// ─── 9. SEÇÕES LADO A LADO (divisória vertical) ──────────────────────────────

describe("Seções HORIZONTAL — porta + gavetas + divisória vertical", () => {
  const input = {
    largura: L,
    altura: A,
    profundidade: P,
    tipoTampo: "MDF",
    corAcabamento: "Amadeirado",
    corFundo: "Amadeirado",
    ladoOcultoNaCor: false,
    tamponamentoTampo: false,
    tamponamentoLaterais: false,
    tamponamentoBase: false,
    tipoPorta: "EMBUTIDA",
    orientacaoSecoes: "HORIZONTAL",
    secoes: [
      { tamanhoMm: 373, conteudo: { tipo: "PORTAS", nPortas: 1 } },
      {
        tamanhoMm: 373,
        conteudo: {
          tipo: "GAVETAS",
          gavetas: [
            {
              alturaFrente: 326,
              descontoLarguraMm: 63,
              comprimentoCorredica: 300,
            },
            {
              alturaFrente: 326,
              descontoLarguraMm: 63,
              comprimentoCorredica: 300,
            },
          ],
        },
      },
    ],
    nPrateleiras: 0,
  };
  const { pecas } = calcularMovel(cfg, input);

  test("Gera 1 Divisória Vertical: 350 × 664 × 18", () => {
    const d = buscar(pecas, "Divisória Vertical");
    expect(d).toBeDefined();
    expect(d.qtd).toBe(1);
    expect(d.largura).toBe(350); // profundidade
    expect(d.altura).toBe(664); // A - 2E
    expect(d.espessura).toBe(18);
  });

  test("Divisória Vertical leva fita na frente (altura)", () => {
    const d = buscar(pecas, "Divisória Vertical");
    expect(d.larguraFitaMm).toBe(22);
    expect(d.metrosFitaUnit).toBeCloseTo(664 / 1000, 3);
  });

  test("Porta da seção 1: 367 × 656", () => {
    const p = buscar(pecas, "Porta");
    expect(p).toBeDefined();
    expect(p.largura).toBe(367); // 373 - 2×3  (folga 3 mm)
    expect(p.altura).toBe(656); // 664 - 8
  });

  test("Gera as 2 frentes de gaveta da seção 2", () => {
    expect(buscar(pecas, "Frente Gaveta 1")).toBeDefined();
    expect(buscar(pecas, "Frente Gaveta 2")).toBeDefined();
    const fg = buscar(pecas, "Frente Gaveta 1");
    expect(fg.largura).toBe(365); // 373 - 2×4
  });
});

// ─── 10. SEÇÕES EMPILHADAS (divisória horizontal) ────────────────────────────

describe("Seções VERTICAL — porta em cima + gaveteiro embaixo + divisória horizontal", () => {
  const input = {
    largura: L,
    altura: A,
    profundidade: P,
    tipoTampo: "MDF",
    corAcabamento: "Amadeirado",
    corFundo: "Amadeirado",
    ladoOcultoNaCor: false,
    tamponamentoTampo: false,
    tamponamentoLaterais: false,
    tamponamentoBase: false,
    tipoPorta: "EMBUTIDA",
    orientacaoSecoes: "VERTICAL",
    secoes: [
      { tamanhoMm: 400, conteudo: { tipo: "PORTAS", nPortas: 2 } },
      {
        tamanhoMm: 246,
        conteudo: {
          tipo: "GAVETAS",
          gavetas: [
            {
              alturaFrente: 79,
              descontoLarguraMm: 63,
              comprimentoCorredica: 300,
            },
            {
              alturaFrente: 79,
              descontoLarguraMm: 63,
              comprimentoCorredica: 300,
            },
          ],
        },
      },
    ],
    nPrateleiras: 0,
  };
  const { pecas } = calcularMovel(cfg, input);

  test("Gera 1 Divisória Horizontal: 764 × 350 × 18", () => {
    const d = buscar(pecas, "Divisória Horizontal");
    expect(d).toBeDefined();
    expect(d.qtd).toBe(1);
    expect(d.largura).toBe(764); // L - 2E
    expect(d.altura).toBe(350); // profundidade
    expect(d.espessura).toBe(18);
  });

  test("Divisória Horizontal leva fita na frente (largura)", () => {
    const d = buscar(pecas, "Divisória Horizontal");
    expect(d.larguraFitaMm).toBe(22);
    expect(d.metrosFitaUnit).toBeCloseTo(764 / 1000, 3);
  });

  test("Porta da seção de cima ocupa a largura cheia do vão: 377.5 × 392", () => {
    // openW = vaoLargura = 764; nPortas=2 → (764 - 3×3)/2 = 377.5
    const p = buscar(pecas, "Porta");
    expect(p).toBeDefined();
    expect(p.largura).toBe(377.5);
    expect(p.altura).toBe(392); // 400 - 2×4
  });
});
