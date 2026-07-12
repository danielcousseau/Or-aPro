export const formatarMoeda = (
  valor: number | string | null | undefined,
): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
};

/** Gera título do orçamento a partir de ambiente, tipo de móvel e cliente. */
export function gerarTituloOrcamento(
  clienteNome: string | undefined,
  ambiente?: string,
  tipoMovel?: string,
): string {
  const partes: string[] = [];
  if (ambiente?.trim()) partes.push(ambiente.trim());
  if (tipoMovel?.trim()) partes.push(tipoMovel.trim());
  const base = partes.length > 0 ? partes.join(" — ") : "Orçamento";
  if (clienteNome?.trim()) {
    return `${base} — ${clienteNome.trim()}`;
  }
  return base.length >= 3 ? base : "Orçamento novo";
}
