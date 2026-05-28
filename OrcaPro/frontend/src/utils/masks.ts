export const mascaraCpfCnpj = (valor: string): string => {
  let v = valor.replace(/\D/g, "");

  if (v.length <= 11) {
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
  }
  return v.substring(0, 18);
};

export const mascaraTelefone = (valor: string): string => {
  let v = valor.replace(/\D/g, "");
  // Remove código do país 55 se vier colado (ex: "5551995154309")
  if (v.length > 11 && v.startsWith("55")) v = v.slice(2);
  v = v.substring(0, 11);
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
  v = v.replace(/(\d{4,5})(\d{4})$/, "$1-$2");
  return v;
};

export const mascaraCep = (valor: string): string => {
  let v = valor.replace(/\D/g, "");
  v = v.replace(/^(\d{5})(\d)/, "$1-$2");
  return v.substring(0, 9);
};

export const mascaraMoeda = (
  valor: string | number | null | undefined,
): string => {
  if (valor === undefined || valor === null) return "";

  let strValor = typeof valor === "number" ? valor.toFixed(2) : String(valor);
  let v = strValor.replace(/\D/g, "");
  if (!v) return "";
  v = (Number(v) / 100).toFixed(2);
  v = v.replace(".", ",");
  v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
  return `R$ ${v}`;
};

export const desmascararMoeda = (
  valor: string | number | null | undefined,
): number => {
  if (!valor) return 0;
  if (typeof valor === "number") return valor;
  const strValor = String(valor);
  if (!strValor.includes("R$") && !strValor.includes(","))
    return Number(strValor) || 0;
  const v = strValor.replace(/[^\d,-]/g, "").replace(",", ".");
  return Number(v) || 0;
};
