export interface Cliente {
  id: number;
  nome: string;
  telefone?: string;
  email?: string;
  cpfCnpj?: string;
  rua?: string;
  cidade?: string;
  bairro?: string;
  numero?: string;
  cep?: string;
  observacoes?: string;
  telegramChatId?: string;
}

export interface Material {
  id: number;
  nome: string;
  valor: number;
  quantidade?: number;
  categoria?: string;
  unidade?: string;
  quantidadeEstoque?: number | null;
  estoqueMinimo?: number | null;
}

export interface OrcamentoMaterialItem {
  id: number;
  nome: string;
  valor: number;
  quantidade: number;
  materialId?: number | null;
}

export interface MaterialSelecionado {
  idFalso: string | number;
  id?: number;
  materialId?: number | null;
  nome: string;
  valor: string;
  quantidade: number;
}

export interface OrcamentoFormData {
  titulo: string;
  clienteId: string | number;
  tipoMovel: string;
  ambiente: string;
  medidas?: string;
  tipoMaoDeObra: string;
  maoDeObraValor: string | number;
  maoDeObraQtde?: number;
  tipoLucro: string;
  lucroValor: string | number;
  lucroQtde?: number;
  prazo: string;
  pagamento: string;
  validade: string;
  observacoes: string;
}

export interface Totais {
  materiais: number;
  maoDeObra: number;
  lucro: number;
  final: number;
}

export interface FormaPagamento {
  id: number;
  nome: string;
}

export interface Orcamento {
  id: number;
  titulo: string;
  clienteId: number;
  cliente?: Cliente;
  tipoMovel?: string;
  ambiente?: string;
  status?: string;
  totalFinal: number;
  createdAt: string;
  tipoLucro?: string;
  lucroValor?: number;
  lucroQtde?: number;
  materiais?: OrcamentoMaterialItem[];
  prazo?: string;
  pagamento?: string;
  validade?: string;
  observacoes?: string;
  tipoMaoDeObra?: string;
  maoDeObraValor?: number;
  maoDeObraQtde?: number;
  medidas?: string;
  contratoToken?: string | null;
  contratoGeradoEm?: string | null;
  contratoAceito?: boolean;
  contratoAceitoEm?: string | null;
}

export interface AuditLog {
  id: number;
  acao: string;
  recurso: string;
  detalhe?: string;
  criadoEm: string;
  user?: { usuario: string };
}

export interface User {
  nome?: string;
  usuario?: string;
  email?: string;
  avatar?: string | null;
  nomeMarcenaria?: string;
  logoMarcenaria?: string | null;
}
