// Siglas para identificar cada módulo (móvel) de um projeto na hora da montagem.
// Ex.: ["Roupeiro" (Quarto), "Armário" (Cozinha)] → ["ROP", "ARM"].
// A sigla vem do NOME do móvel (ou do ambiente, se não houver nome): primeiras
// 3 letras, sem acento, em maiúsculas. Se dois módulos derem a mesma sigla,
// elas são numeradas (ARM1, ARM2) para nunca confundir as peças.
// O código de cada peça fica "SIGLA-N" (ex.: ROP-3 = roupeiro, peça 3).

interface ModuloIdent {
  nome?: string;
  ambiente?: string;
}

const semAcento = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

function siglaBase(m: ModuloIdent): string {
  const fonte = semAcento(
    (m.nome?.trim() || m.ambiente?.trim() || "MOD").toUpperCase(),
  );
  const letras = fonte.replace(/[^A-Z]/g, "");
  return letras.slice(0, 3) || "MOD";
}

// Gera uma sigla única por módulo, na mesma ordem da lista recebida.
export function gerarSiglasModulos(modulos: ModuloIdent[]): string[] {
  const total = new Map<string, number>();
  for (const m of modulos) {
    const b = siglaBase(m);
    total.set(b, (total.get(b) ?? 0) + 1);
  }
  const usado = new Map<string, number>();
  return modulos.map((m) => {
    const b = siglaBase(m);
    const n = (usado.get(b) ?? 0) + 1;
    usado.set(b, n);
    // Só numera quando a mesma sigla aparece em mais de um módulo do projeto.
    return (total.get(b) ?? 0) > 1 ? `${b}${n}` : b;
  });
}

// Código da peça: sigla do módulo + número sequencial (ROP-1, ROP-2...).
export function codigoPeca(sigla: string, indicePeca: number): string {
  return `${sigla}-${indicePeca}`;
}
