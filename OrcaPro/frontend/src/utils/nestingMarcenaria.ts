// Algoritmo de corte guilhotina em 2 estágios (FFDH — First Fit Decreasing Height).
// Estágio 1: corta a chapa em FAIXAS — cada corte vai de ponta a ponta da chapa.
// Estágio 2: vira a faixa e corta as PEÇAS — cada corte vai de ponta a ponta da faixa.
// Nenhum corte para no meio. A direção das faixas (horizontal ou vertical) é
// escolhida automaticamente: testamos as duas e ficamos com a de menor desperdício.
// Todas as medidas em milímetros.

export interface PecaNesting {
  nome: string;
  largura: number;
  altura: number;
  cor: string;
  espessura: number;
  codigo?: string; // código da peça (ex: P1, P2) para cruzar com o relatório
}

export interface PecaPosicionada {
  nome: string;
  x: number;
  y: number;
  larg: number;
  alt: number;
  rotacionada: boolean;
  codigo?: string; // código da peça (ex: P1, P2)
}

// Uma linha de corte — sempre de ponta a ponta da região onde é aplicada
export interface LinhaCorte {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ChapaLayout {
  indice: number;
  pecas: PecaPosicionada[];
  cortes: LinhaCorte[];
}

export interface GrupoNesting {
  cor: string;
  espessura: number;
  chapas: ChapaLayout[];
}

export interface ResultadoNesting {
  grupos: GrupoNesting[];
  totalChapasNesting: number;
}

// Empacota peças em FAIXAS HORIZONTAIS (estágio 1 = cortes horizontais de ponta a ponta).
// Dentro de cada faixa, peças lado a lado (estágio 2 = cortes verticais na faixa).
function empacotarHorizontal(
  pecas: PecaNesting[],
  sheetW: number,
  sheetH: number,
  kerf: number,
  respeitarVeio: boolean,
): ChapaLayout[] {
  // Empacota na ordem recebida (quem chama decide a ordenação a testar)
  const ord = pecas;

  interface Faixa {
    y: number;
    h: number; // espessura da faixa = altura da peça mais alta nela
    xUsado: number;
    pecas: PecaPosicionada[];
  }
  interface Sheet {
    faixas: Faixa[];
    yProx: number;
  }

  const sheets: Sheet[] = [];

  const tentarNaSheet = (sheet: Sheet, p: PecaNesting): boolean => {
    // 1) Tenta encaixar em faixa existente (sem e com rotação)
    for (const f of sheet.faixas) {
      if (p.altura <= f.h && f.xUsado + p.largura <= sheetW) {
        f.pecas.push({
          nome: p.nome,
          x: f.xUsado,
          y: f.y,
          larg: p.largura,
          alt: p.altura,
          rotacionada: false,
          codigo: p.codigo,
        });
        f.xUsado += p.largura + kerf;
        return true;
      }
      if (
        !respeitarVeio &&
        p.largura !== p.altura &&
        p.largura <= f.h &&
        f.xUsado + p.altura <= sheetW
      ) {
        f.pecas.push({
          nome: p.nome,
          x: f.xUsado,
          y: f.y,
          larg: p.altura,
          alt: p.largura,
          rotacionada: true,
          codigo: p.codigo,
        });
        f.xUsado += p.altura + kerf;
        return true;
      }
    }

    // 2) Abre nova faixa (sem rotação)
    if (sheet.yProx + p.altura <= sheetH && p.largura <= sheetW) {
      sheet.faixas.push({
        y: sheet.yProx,
        h: p.altura,
        xUsado: p.largura + kerf,
        pecas: [
          {
            nome: p.nome,
            x: 0,
            y: sheet.yProx,
            larg: p.largura,
            alt: p.altura,
            rotacionada: false,
            codigo: p.codigo,
          },
        ],
      });
      sheet.yProx += p.altura + kerf;
      return true;
    }

    // 3) Abre nova faixa rotacionada (se cabe melhor)
    if (!respeitarVeio && p.largura !== p.altura) {
      if (sheet.yProx + p.largura <= sheetH && p.altura <= sheetW) {
        sheet.faixas.push({
          y: sheet.yProx,
          h: p.largura,
          xUsado: p.altura + kerf,
          pecas: [
            {
              nome: p.nome,
              x: 0,
              y: sheet.yProx,
              larg: p.altura,
              alt: p.largura,
              rotacionada: true,
              codigo: p.codigo,
            },
          ],
        });
        sheet.yProx += p.largura + kerf;
        return true;
      }
    }

    return false;
  };

  for (const p of ord) {
    let placed = false;
    for (const sheet of sheets) {
      if (tentarNaSheet(sheet, p)) {
        placed = true;
        break;
      }
    }
    if (!placed) {
      const sheet: Sheet = { faixas: [], yProx: 0 };
      sheets.push(sheet);
      if (!tentarNaSheet(sheet, p)) {
        // Peça maior que a chapa inteira — força posição (caso extremo)
        const larg = Math.min(p.largura, sheetW);
        const alt = Math.min(p.altura, sheetH);
        sheet.faixas.push({
          y: 0,
          h: alt,
          xUsado: larg + kerf,
          pecas: [
            {
              nome: p.nome,
              x: 0,
              y: 0,
              larg,
              alt,
              rotacionada: false,
              codigo: p.codigo,
            },
          ],
        });
        sheet.yProx = alt + kerf;
      }
    }
  }

  // Gera as linhas de corte de cada chapa
  return sheets.map((sheet, idx) => {
    const pecasOut: PecaPosicionada[] = [];
    const cortes: LinhaCorte[] = [];

    for (const f of sheet.faixas) {
      const faixaBottom = f.y + f.h;

      // Estágio 1: corte horizontal de ponta a ponta na base da faixa
      // (só se há material abaixo para separar)
      if (faixaBottom < sheetH - 0.5) {
        cortes.push({ x1: 0, y1: faixaBottom, x2: sheetW, y2: faixaBottom });
      }

      for (const pc of f.pecas) {
        pecasOut.push(pc);
        const right = pc.x + pc.larg;

        // Estágio 2: corte vertical de ponta a ponta da faixa, à direita da peça
        if (right < sheetW - 0.5) {
          cortes.push({ x1: right, y1: f.y, x2: right, y2: faixaBottom });
        }

        // Estágio 3: se a peça é mais baixa que a faixa, corte horizontal
        // de ponta a ponta da COLUNA da peça (refila a sobra)
        const pieceBottom = pc.y + pc.alt;
        if (pieceBottom < faixaBottom - 0.5) {
          cortes.push({
            x1: pc.x,
            y1: pieceBottom,
            x2: right,
            y2: pieceBottom,
          });
        }
      }
    }

    return { indice: idx + 1, pecas: pecasOut, cortes };
  });
}

// Empacota em FAIXAS VERTICAIS — transpõe o problema (gira 90°), empacota como
// horizontal e transpõe o resultado de volta. Respeita o veio (a transposição
// é só troca de eixos de cálculo, não gira a peça em relação à chapa).
function empacotarVertical(
  pecas: PecaNesting[],
  sheetW: number,
  sheetH: number,
  kerf: number,
  respeitarVeio: boolean,
): ChapaLayout[] {
  const pecasT = pecas.map((p) => ({
    ...p,
    largura: p.altura,
    altura: p.largura,
  }));
  const chapasT = empacotarHorizontal(
    pecasT,
    sheetH,
    sheetW,
    kerf,
    respeitarVeio,
  );

  return chapasT.map((ch) => ({
    indice: ch.indice,
    pecas: ch.pecas.map((pc) => ({
      nome: pc.nome,
      x: pc.y,
      y: pc.x,
      larg: pc.alt,
      alt: pc.larg,
      rotacionada: pc.rotacionada,
      codigo: pc.codigo,
    })),
    cortes: ch.cortes.map((c) => ({
      x1: c.y1,
      y1: c.x1,
      x2: c.y2,
      y2: c.x2,
    })),
  }));
}

// Gerador pseudoaleatório com semente (mulberry32) — determinístico:
// mesma entrada sempre gera o mesmo plano.
function criarRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Embaralhamento Fisher–Yates usando o rng com semente
function embaralhar(lista: PecaNesting[], rand: () => number): PecaNesting[] {
  const arr = [...lista];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function ordenarPor(
  lista: PecaNesting[],
  chave: (p: PecaNesting) => number,
): PecaNesting[] {
  return [...lista].sort((a, b) => chave(b) - chave(a));
}

// Pontuação: menos chapas é o que importa (cada chapa = material comprado);
// em empate, menos cortes (plano mais simples).
function pontuar(chapas: ChapaLayout[]): number {
  const cortes = chapas.reduce((s, c) => s + c.cortes.length, 0);
  return chapas.length * 1_000_000 + cortes;
}

export function calcularNesting(
  pecas: PecaNesting[],
  chapaLarg: number,
  chapaAlt: number,
  kerf: number,
  // Veio por material: `true` = todos respeitam; `false` = nenhum respeita;
  // `Set<"cor|espessura">` = só os materiais nesse conjunto respeitam.
  respeitarVeio: boolean | Set<string>,
): ResultadoNesting {
  // Agrupa por material (cor + espessura)
  const mapa = new Map<string, PecaNesting[]>();
  for (const p of pecas) {
    const key = `${p.cor}|${p.espessura}`;
    if (!mapa.has(key)) mapa.set(key, []);
    mapa.get(key)!.push(p);
  }

  const grupos: GrupoNesting[] = [];
  let totalChapasNesting = 0;

  for (const [key, lista] of mapa) {
    const [cor, espStr] = key.split("|");
    const espessura = Number(espStr);

    // Este material respeita o veio?
    const veioGrupo =
      respeitarVeio === true
        ? true
        : respeitarVeio instanceof Set
          ? respeitarVeio.has(key)
          : false;

    // Candidatos de ordenação a testar (cada um pode dar um plano diferente)
    const candidatos: PecaNesting[][] = [
      lista, // ordem original
      ordenarPor(lista, (p) => p.altura), // maior altura primeiro (FFDH clássico)
      ordenarPor(lista, (p) => p.largura), // maior largura primeiro
      ordenarPor(lista, (p) => p.largura * p.altura), // maior área primeiro
      ordenarPor(lista, (p) => Math.max(p.largura, p.altura)), // maior lado
    ];

    // + várias tentativas embaralhadas (determinísticas via semente)
    const semente =
      lista.length * 2654435761 +
      lista.reduce((s, p) => s + p.largura + p.altura * 31, 0);
    const rand = criarRng(semente);
    const tentativas = lista.length > 1 ? 60 : 0;
    for (let i = 0; i < tentativas; i++)
      candidatos.push(embaralhar(lista, rand));

    // Para cada ordenação, testa faixa horizontal E vertical; guarda a melhor
    let melhor: ChapaLayout[] | null = null;
    let melhorScore = Infinity;
    for (const ordem of candidatos) {
      const h = empacotarHorizontal(
        ordem,
        chapaLarg,
        chapaAlt,
        kerf,
        veioGrupo,
      );
      const v = empacotarVertical(ordem, chapaLarg, chapaAlt, kerf, veioGrupo);
      for (const chapas of [h, v]) {
        const score = pontuar(chapas);
        if (score < melhorScore) {
          melhorScore = score;
          melhor = chapas;
        }
      }
    }

    const escolha = melhor ?? [];
    escolha.forEach((c, i) => (c.indice = i + 1));

    totalChapasNesting += escolha.length;
    grupos.push({ cor, espessura, chapas: escolha });
  }

  return { grupos, totalChapasNesting };
}

// Expande pecas[] do motor (que têm qtd) para lista plana para o nesting.
// Se a peça já trouxer um `codigo` (ex: "2.3" no modo projeto), ele é mantido;
// senão, gera P1, P2... pela ordem dos tipos.
export function expandirPecas(
  pecas: Array<{
    nome: string;
    qtd: number;
    largura: number;
    altura: number;
    espessura: number;
    cor: string;
    codigo?: string;
  }>,
): PecaNesting[] {
  const resultado: PecaNesting[] = [];
  pecas.forEach((p, tipoIdx) => {
    const codigo = p.codigo ?? `P${tipoIdx + 1}`;
    for (let i = 0; i < p.qtd; i++) {
      resultado.push({
        nome: p.nome,
        largura: p.largura,
        altura: p.altura,
        cor: p.cor,
        espessura: p.espessura,
        codigo,
      });
    }
  });
  return resultado;
}
