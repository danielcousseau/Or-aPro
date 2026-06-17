// Determina em quais bordas de uma peça vai fita de borda.
// Replica fielmente a regra do motor (backend metorMarcenaria.ts → metrosFitaUnit),
// para que o relatório mostre AO funcionário onde colar a fita.
//
// Cada peça é um retângulo largura × altura. Cada medida tem 2 lados:
//   - largura → 2 arestas horizontais (topo e base)
//   - altura  → 2 arestas verticais (esquerda e direita)
// Retornamos QUANTOS lados de cada medida levam fita (0, 1 ou 2).

export interface ArestasFita {
  // Quantos lados do comprimento "largura" levam fita (0, 1 ou 2)
  ladosLargura: 0 | 1 | 2;
  // Quantos lados do comprimento "altura" levam fita (0, 1 ou 2)
  ladosAltura: 0 | 1 | 2;
  larguraFitaMm: number; // 22 (0 se não leva)
}

const SEM_FITA: ArestasFita = {
  ladosLargura: 0,
  ladosAltura: 0,
  larguraFitaMm: 0,
};

export function arestasFita(nome: string, espessura: number): ArestasFita {
  // Apenas peças de 18 mm levam fita (igual ao motor)
  if (espessura !== 18) return SEM_FITA;

  const nomeL = nome.toLowerCase();

  // Peças internas de caixa de gaveta, reforços e tiras ocultas: sem fita
  if (
    nomeL.includes("fundo") ||
    nomeL.includes("lateral caixa") ||
    nomeL.includes("frente/traseira caixa") ||
    nomeL.includes("fundo caixa") ||
    nomeL.includes("reforço") ||
    nomeL.includes("tira tamponamento")
  ) {
    return SEM_FITA;
  }

  // Lateral: frente (1 aresta vertical = altura) + topo e base (2 arestas = largura)
  if (nomeL === "lateral") {
    return { ladosLargura: 2, ladosAltura: 1, larguraFitaMm: 22 };
  }

  // Porta ou frente de gaveta: 4 bordas
  if (nomeL === "porta" || nomeL.startsWith("frente gaveta")) {
    return { ladosLargura: 2, ladosAltura: 2, larguraFitaMm: 22 };
  }

  // Prateleira: só a frente (1 aresta = largura)
  if (nomeL === "prateleira") {
    return { ladosLargura: 1, ladosAltura: 0, larguraFitaMm: 22 };
  }

  // Divisória vertical (painel em pé): fita na frente vertical (= altura)
  if (nomeL === "divisória vertical") {
    return { ladosLargura: 0, ladosAltura: 1, larguraFitaMm: 22 };
  }

  // Divisória horizontal (painel deitado): fita na frente horizontal (= largura)
  if (nomeL === "divisória horizontal") {
    return { ladosLargura: 1, ladosAltura: 0, larguraFitaMm: 22 };
  }

  // Tampo, Base, Tamponamento*: só a frente (1 aresta = largura)
  return { ladosLargura: 1, ladosAltura: 0, larguraFitaMm: 22 };
}
