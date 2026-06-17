import api from "./api";

// ─── tipos ────────────────────────────────────────────────────────────────────

export interface ConfigBase {
  espEstrutura?: number;
  espFundo?: number;
  rasgoProfundidade?: number;
  rasgoBorda?: number;
  folgaPorta?: number;
  avancoTamponamento?: number;
  larguraReforco?: number;
  larguraTiraOculta?: number;
  kerfSerra?: number;
  margemPerda?: number;
  recuoPrateleira?: number;
  folgaPrateleiraLat?: number;
  folgaAlturaGaveta?: number;
  corCaixaInterna?: string;
  chapaLargura?: number;
  chapaAltura?: number;
  configurado?: boolean;
}

export interface TipoMovel {
  id: number;
  configId: number;
  nome: string;
  tamponamentoTampo: boolean;
  tamponamentoLaterais: boolean;
  tamponamentoBase: boolean;
  tipoPorta: string;
}

export interface Chapa {
  id: number;
  configId: number;
  cor: string;
  espessura: number;
  precoChapa: number;
}

export interface Fita {
  id: number;
  configId: number;
  cor: string;
  largura: number;
  precoMetro: number;
}

export interface Corredica {
  id: number;
  configId: number;
  tipo: string;
  nome: string;
  descontoLarguraMm: number;
  comprimentos: string;
}

export interface Ferragem {
  id: number;
  configId: number;
  nome: string;
  tipo: string; // DOBRADICA|PUXADOR|PE|OUTRO
  unidade: string; // "un" | "par"
  preco: number;
}

export interface ConfiguracaoMarcenaria extends ConfigBase {
  id: number;
  userId: number;
  configurado: boolean;
  tiposMovel: TipoMovel[];
  chapas: Chapa[];
  fitas: Fita[];
  corredicas: Corredica[];
  ferragens: Ferragem[];
}

export type GavetaInput = {
  alturaFrente: number;
  descontoLarguraMm: number;
  comprimentoCorredica: number;
};

export type FrenteInput =
  | { tipo: "PORTAS"; nPortas: number }
  | { tipo: "GAVETAS"; gavetas: GavetaInput[] };

// Uma seção da frente: tamanho em mm + conteúdo (portas ou gavetas)
export interface SecaoFrente {
  tamanhoMm: number;
  conteudo: FrenteInput;
}

export interface MovelInput {
  largura: number;
  altura: number;
  profundidade: number;
  tipoTampo: "MDF" | "PEDRA";
  corAcabamento: string;
  corFundo: string;
  ladoOcultoNaCor: boolean;
  tamponamentoTampo: boolean;
  tamponamentoLaterais: boolean;
  tamponamentoBase: boolean;
  tipoPorta: "SOBREPOSTA" | "EMBUTIDA" | "MEIA";
  // Modelo antigo: uma frente única
  frente?: FrenteInput;
  // Modelo novo: seções com divisórias automáticas
  orientacaoSecoes?: "HORIZONTAL" | "VERTICAL";
  secoes?: SecaoFrente[];
  nPrateleiras: number;
}

export interface Peca {
  nome: string;
  qtd: number;
  largura: number;
  altura: number;
  espessura: number;
  cor: string;
  m2Unit: number;
  metrosFitaUnit: number;
  larguraFitaMm: number;
}

export interface GrupoChapa {
  cor: string;
  espessura: number;
  m2Liquido: number;
  m2ComPerda: number;
  chapasInteiras: number;
  precoChapa: number | null;
  precoM2: number | null;
  custoChapas: number | null;
}

export interface GrupoFita {
  cor: string;
  largura: number;
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

// ─── api calls ────────────────────────────────────────────────────────────────

type SemId<T> = Omit<T, "id" | "configId">;

const marcenariaApi = {
  buscarConfig: () =>
    api.get<{ data: ConfiguracaoMarcenaria | null }>("/marcenaria/config"),

  salvarConfig: (data: ConfigBase) =>
    api.post<{ data: ConfiguracaoMarcenaria }>("/marcenaria/config", data),

  // Chapas
  criarChapa: (data: SemId<Chapa>) =>
    api.post<{ data: Chapa }>("/marcenaria/config/chapas", data),
  atualizarChapa: (id: number, data: SemId<Chapa>) =>
    api.put<{ data: Chapa }>(`/marcenaria/config/chapas/${id}`, data),
  deletarChapa: (id: number) => api.delete(`/marcenaria/config/chapas/${id}`),

  // Fitas
  criarFita: (data: SemId<Fita>) =>
    api.post<{ data: Fita }>("/marcenaria/config/fitas", data),
  atualizarFita: (id: number, data: SemId<Fita>) =>
    api.put<{ data: Fita }>(`/marcenaria/config/fitas/${id}`, data),
  deletarFita: (id: number) => api.delete(`/marcenaria/config/fitas/${id}`),

  // Tipos de móvel
  criarTipo: (data: SemId<TipoMovel>) =>
    api.post<{ data: TipoMovel }>("/marcenaria/config/tipos", data),
  atualizarTipo: (id: number, data: SemId<TipoMovel>) =>
    api.put<{ data: TipoMovel }>(`/marcenaria/config/tipos/${id}`, data),
  deletarTipo: (id: number) => api.delete(`/marcenaria/config/tipos/${id}`),

  // Corrediças
  criarCorredica: (data: SemId<Corredica>) =>
    api.post<{ data: Corredica }>("/marcenaria/config/corredicas", data),
  atualizarCorredica: (id: number, data: SemId<Corredica>) =>
    api.put<{ data: Corredica }>(`/marcenaria/config/corredicas/${id}`, data),
  deletarCorredica: (id: number) =>
    api.delete(`/marcenaria/config/corredicas/${id}`),

  // Ferragens
  criarFerragem: (data: SemId<Ferragem>) =>
    api.post<{ data: Ferragem }>("/marcenaria/config/ferragens", data),
  atualizarFerragem: (id: number, data: SemId<Ferragem>) =>
    api.put<{ data: Ferragem }>(`/marcenaria/config/ferragens/${id}`, data),
  deletarFerragem: (id: number) =>
    api.delete(`/marcenaria/config/ferragens/${id}`),

  // Motor de cálculo
  calcular: (data: MovelInput) =>
    api.post<{ data: ResultadoMovel }>("/marcenaria/calcular", data),
};

export default marcenariaApi;
