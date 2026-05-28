import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import { formatarMoeda } from "../utils/format";
import { mascaraMoeda, desmascararMoeda } from "../utils/masks";
import { CORES_STATUS } from "../constants/status";

interface Pagamento {
  id: number;
  descricao: string;
  valor: number;
  dataPagamento: string;
}

interface OrcamentoFinanceiro {
  id: number;
  titulo: string;
  totalFinal: number;
  status: string;
  createdAt: string;
  cliente: { nome: string };
  pagamentos: Pagamento[];
}

interface OrcamentoRentabilidade {
  id: number;
  titulo: string;
  totalFinal: number;
  custoMateriais: number;
  valorRecebido: number;
  lucro: number;
  margem: number;
  status: string;
  createdAt: string;
  cliente: { nome: string };
}

type Aba = "recebimentos" | "rentabilidade";
type FiltroRecebimentos = "todos" | "pendentes" | "pagos";
type FiltroRentabilidade =
  | "todos"
  | "Aguardando"
  | "Aprovado"
  | "Produção"
  | "Instalação"
  | "Entregue";

const FILTROS_RECEBIMENTOS: { valor: FiltroRecebimentos; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "pendentes", label: "Com saldo pendente" },
  { valor: "pagos", label: "Pagos" },
];

function totalPago(orcamento: OrcamentoFinanceiro): number {
  return orcamento.pagamentos.reduce((acc, p) => acc + p.valor, 0);
}

function estaPago(orcamento: OrcamentoFinanceiro): boolean {
  return totalPago(orcamento) >= orcamento.totalFinal;
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function corMargem(margem: number): string {
  if (margem >= 40) return "var(--success)";
  if (margem >= 20) return "#f59e0b";
  return "var(--danger)";
}

export default function Financeiro() {
  const [aba, setAba] = useState<Aba>("recebimentos");

  // --- Recebimentos ---
  const [orcamentos, setOrcamentos] = useState<OrcamentoFinanceiro[]>([]);
  const [carregandoRecebimentos, setCarregandoRecebimentos] = useState(true);
  const [filtroRecebimentos, setFiltroRecebimentos] =
    useState<FiltroRecebimentos>("todos");
  const [expandido, setExpandido] = useState<number | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [orcamentoSelecionado, setOrcamentoSelecionado] =
    useState<OrcamentoFinanceiro | null>(null);
  const [formDescricao, setFormDescricao] = useState("");
  const [formValor, setFormValor] = useState("");
  const [formData, setFormData] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [salvando, setSalvando] = useState(false);

  // --- Rentabilidade ---
  const [rentabilidade, setRentabilidade] = useState<OrcamentoRentabilidade[]>(
    [],
  );
  const [carregandoRent, setCarregandoRent] = useState(false);
  const [filtroRent, setFiltroRent] = useState<FiltroRentabilidade>("todos");

  useEffect(() => {
    carregarRecebimentos();
  }, []);

  useEffect(() => {
    if (
      aba === "rentabilidade" &&
      rentabilidade.length === 0 &&
      !carregandoRent
    ) {
      carregarRentabilidade();
    }
  }, [aba]);

  async function carregarRecebimentos() {
    try {
      const { data } = await api.get<OrcamentoFinanceiro[]>("/pagamentos");
      setOrcamentos(data);
    } catch {
      toast.error("Erro ao carregar recebimentos");
    } finally {
      setCarregandoRecebimentos(false);
    }
  }

  async function carregarRentabilidade() {
    setCarregandoRent(true);
    try {
      const { data } = await api.get<OrcamentoRentabilidade[]>(
        "/pagamentos/rentabilidade",
      );
      setRentabilidade(data);
    } catch {
      toast.error("Erro ao carregar rentabilidade");
    } finally {
      setCarregandoRent(false);
    }
  }

  // --- Recebimentos: derivados ---
  const orcamentosFiltrados = useMemo(() => {
    if (filtroRecebimentos === "pagos") return orcamentos.filter(estaPago);
    if (filtroRecebimentos === "pendentes")
      return orcamentos.filter((o) => !estaPago(o));
    return orcamentos;
  }, [orcamentos, filtroRecebimentos]);

  const totalAReceber = useMemo(
    () =>
      orcamentos
        .filter((o) => !estaPago(o))
        .reduce((acc, o) => acc + (o.totalFinal - totalPago(o)), 0),
    [orcamentos],
  );

  const totalRecebido = useMemo(
    () => orcamentos.reduce((acc, o) => acc + totalPago(o), 0),
    [orcamentos],
  );

  // --- Rentabilidade: derivados ---
  const rentFiltrada = useMemo(() => {
    if (filtroRent === "todos") return rentabilidade;
    return rentabilidade.filter((o) => o.status === filtroRent);
  }, [rentabilidade, filtroRent]);

  const resumoRent = useMemo(() => {
    const receita = rentFiltrada.reduce((acc, o) => acc + o.totalFinal, 0);
    const custo = rentFiltrada.reduce((acc, o) => acc + o.custoMateriais, 0);
    const lucro = receita - custo;
    const margem = receita > 0 ? (lucro / receita) * 100 : 0;
    return { receita, custo, lucro, margem: Math.round(margem * 10) / 10 };
  }, [rentFiltrada]);

  // --- Handlers de recebimentos ---
  function abrirModal(orcamento: OrcamentoFinanceiro) {
    setOrcamentoSelecionado(orcamento);
    setFormDescricao("");
    setFormValor("");
    setFormData(new Date().toISOString().slice(0, 10));
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setOrcamentoSelecionado(null);
  }

  async function registrarPagamento() {
    if (!orcamentoSelecionado) return;
    const valor = desmascararMoeda(formValor);
    if (!formDescricao.trim() || valor <= 0) {
      toast.warning("Preencha descrição e valor");
      return;
    }
    if (salvando) return;
    setSalvando(true);
    try {
      const { data } = await api.post<Pagamento>(
        `/pagamentos/${orcamentoSelecionado.id}`,
        {
          descricao: formDescricao.trim(),
          valor,
          dataPagamento: formData,
        },
      );
      setOrcamentos((prev) =>
        prev.map((o) =>
          o.id === orcamentoSelecionado.id
            ? { ...o, pagamentos: [...o.pagamentos, data] }
            : o,
        ),
      );
      setRentabilidade((prev) =>
        prev.map((o) =>
          o.id === orcamentoSelecionado.id
            ? { ...o, valorRecebido: o.valorRecebido + data.valor }
            : o,
        ),
      );
      toast.success("Pagamento registrado");
      fecharModal();
    } catch {
      toast.error("Erro ao registrar pagamento");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirPagamento(
    orcamentoId: number,
    pagamentoId: number,
    valor: number,
  ) {
    try {
      await api.delete(`/pagamentos/${orcamentoId}/${pagamentoId}`);
      setOrcamentos((prev) =>
        prev.map((o) =>
          o.id === orcamentoId
            ? {
                ...o,
                pagamentos: o.pagamentos.filter((p) => p.id !== pagamentoId),
              }
            : o,
        ),
      );
      setRentabilidade((prev) =>
        prev.map((o) =>
          o.id === orcamentoId
            ? { ...o, valorRecebido: o.valorRecebido - valor }
            : o,
        ),
      );
      toast.success("Pagamento removido");
    } catch {
      toast.error("Erro ao remover pagamento");
    }
  }

  const STATUS_FILTRO: FiltroRentabilidade[] = [
    "todos",
    "Aguardando",
    "Aprovado",
    "Produção",
    "Instalação",
    "Entregue",
  ];

  return (
    <div className="financeiro-page">
      <div className="financeiro-header">
        <h1 className="financeiro-title">Financeiro</h1>
      </div>

      <div className="fin-abas">
        <button
          className={`fin-aba${aba === "recebimentos" ? " fin-aba--ativa" : ""}`}
          onClick={() => setAba("recebimentos")}
        >
          Recebimentos
        </button>
        <button
          className={`fin-aba${aba === "rentabilidade" ? " fin-aba--ativa" : ""}`}
          onClick={() => setAba("rentabilidade")}
        >
          Rentabilidade
        </button>
      </div>

      {/* ===== ABA RECEBIMENTOS ===== */}
      {aba === "recebimentos" && (
        <>
          {carregandoRecebimentos ? (
            <div className="page-loading">Carregando...</div>
          ) : (
            <>
              <div className="financeiro-resumo">
                <div className="resumo-card resumo-receber">
                  <span className="resumo-label">A receber</span>
                  <span className="resumo-valor">
                    {formatarMoeda(totalAReceber)}
                  </span>
                </div>
                <div className="resumo-card resumo-recebido">
                  <span className="resumo-label">Já recebido</span>
                  <span className="resumo-valor">
                    {formatarMoeda(totalRecebido)}
                  </span>
                </div>
              </div>

              <div className="financeiro-filtros">
                {FILTROS_RECEBIMENTOS.map((f) => (
                  <button
                    key={f.valor}
                    className={`filtro-btn${filtroRecebimentos === f.valor ? " filtro-btn--ativo" : ""}`}
                    onClick={() => setFiltroRecebimentos(f.valor)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {orcamentosFiltrados.length === 0 ? (
                <p className="financeiro-vazio">Nenhum orçamento encontrado.</p>
              ) : (
                <div className="financeiro-lista">
                  {orcamentosFiltrados.map((orcamento) => {
                    const pago = totalPago(orcamento);
                    const restante = Math.max(0, orcamento.totalFinal - pago);
                    const percentual =
                      orcamento.totalFinal > 0
                        ? Math.min(
                            100,
                            Math.round((pago / orcamento.totalFinal) * 100),
                          )
                        : 0;
                    const quitado = estaPago(orcamento);
                    const aberto = expandido === orcamento.id;

                    return (
                      <div
                        key={orcamento.id}
                        className={`fin-card${quitado ? " fin-card--pago" : ""}`}
                      >
                        <div className="fin-card-topo">
                          <div className="fin-card-info">
                            <span className="fin-cliente">
                              {orcamento.cliente.nome}
                            </span>
                            <span className="fin-titulo">
                              {orcamento.titulo}
                            </span>
                            <span className="fin-data">
                              {formatarData(orcamento.createdAt)}
                            </span>
                          </div>
                          <div className="fin-card-direita">
                            <span
                              className="fin-status-badge"
                              style={{
                                background:
                                  CORES_STATUS[orcamento.status] || "#999",
                              }}
                            >
                              {orcamento.status}
                            </span>
                            {quitado && (
                              <span className="fin-badge-pago">Pago</span>
                            )}
                          </div>
                        </div>

                        <div className="fin-progress-area">
                          <div className="fin-progress-bar">
                            <div
                              className="fin-progress-fill"
                              style={{
                                width: `${percentual}%`,
                                background: quitado
                                  ? "var(--success)"
                                  : "var(--primary)",
                              }}
                            />
                          </div>
                          <span className="fin-progress-pct">
                            {percentual}%
                          </span>
                        </div>

                        <div className="fin-valores">
                          <span className="fin-valor-item">
                            <span className="fin-valor-label">Total</span>
                            <span className="fin-valor-num">
                              {formatarMoeda(orcamento.totalFinal)}
                            </span>
                          </span>
                          <span className="fin-valor-item">
                            <span className="fin-valor-label">Recebido</span>
                            <span className="fin-valor-num fin-valor-recebido">
                              {formatarMoeda(pago)}
                            </span>
                          </span>
                          {!quitado && (
                            <span className="fin-valor-item">
                              <span className="fin-valor-label">Falta</span>
                              <span className="fin-valor-num fin-valor-falta">
                                {formatarMoeda(restante)}
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="fin-acoes">
                          {!quitado && (
                            <button
                              className="btn-add"
                              onClick={() => abrirModal(orcamento)}
                            >
                              + Registrar Pagamento
                            </button>
                          )}
                          {orcamento.pagamentos.length > 0 && (
                            <button
                              className="btn-ghost"
                              onClick={() =>
                                setExpandido(aberto ? null : orcamento.id)
                              }
                            >
                              {aberto
                                ? "Ocultar"
                                : `Ver ${orcamento.pagamentos.length} pagamento${orcamento.pagamentos.length > 1 ? "s" : ""}`}
                            </button>
                          )}
                        </div>

                        {aberto && (
                          <div className="fin-pagamentos-lista">
                            {orcamento.pagamentos.map((p) => (
                              <div key={p.id} className="fin-pagamento-item">
                                <span className="fin-pag-data">
                                  {formatarData(p.dataPagamento)}
                                </span>
                                <span className="fin-pag-desc">
                                  {p.descricao}
                                </span>
                                <span className="fin-pag-valor">
                                  {formatarMoeda(p.valor)}
                                </span>
                                <button
                                  className="fin-pag-excluir"
                                  onClick={() =>
                                    excluirPagamento(
                                      orcamento.id,
                                      p.id,
                                      p.valor,
                                    )
                                  }
                                  title="Remover pagamento"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ===== ABA RENTABILIDADE ===== */}
      {aba === "rentabilidade" && (
        <>
          {carregandoRent ? (
            <div className="page-loading">Carregando...</div>
          ) : (
            <>
              <div className="rent-resumo">
                <div className="resumo-card">
                  <span className="resumo-label">Receita total</span>
                  <span className="resumo-valor">
                    {formatarMoeda(resumoRent.receita)}
                  </span>
                </div>
                <div className="resumo-card">
                  <span className="resumo-label">Custo materiais</span>
                  <span className="resumo-valor resumo-custo">
                    {formatarMoeda(resumoRent.custo)}
                  </span>
                </div>
                <div className="resumo-card">
                  <span className="resumo-label">Lucro bruto</span>
                  <span className="resumo-valor resumo-lucro">
                    {formatarMoeda(resumoRent.lucro)}
                  </span>
                </div>
                <div
                  className="resumo-card resumo-card--margem"
                  style={{ borderColor: corMargem(resumoRent.margem) }}
                >
                  <span className="resumo-label">Margem média</span>
                  <span
                    className="resumo-valor"
                    style={{ color: corMargem(resumoRent.margem) }}
                  >
                    {resumoRent.margem.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="financeiro-filtros">
                {STATUS_FILTRO.map((s) => (
                  <button
                    key={s}
                    className={`filtro-btn${filtroRent === s ? " filtro-btn--ativo" : ""}`}
                    onClick={() => setFiltroRent(s)}
                    style={
                      s !== "todos" && filtroRent === s
                        ? {
                            background: CORES_STATUS[s] || undefined,
                            borderColor: CORES_STATUS[s] || undefined,
                            color: "#fff",
                          }
                        : undefined
                    }
                  >
                    {s === "todos" ? "Todos" : s}
                  </button>
                ))}
              </div>

              {rentFiltrada.length === 0 ? (
                <p className="financeiro-vazio">Nenhum orçamento encontrado.</p>
              ) : (
                <div className="financeiro-lista">
                  {rentFiltrada.map((o) => (
                    <div key={o.id} className="fin-card rent-card">
                      <div className="fin-card-topo">
                        <div className="fin-card-info">
                          <span className="fin-cliente">{o.cliente.nome}</span>
                          <span className="fin-titulo">{o.titulo}</span>
                          <span className="fin-data">
                            {formatarData(o.createdAt)}
                          </span>
                        </div>
                        <div className="fin-card-direita">
                          <span
                            className="fin-status-badge"
                            style={{
                              background: CORES_STATUS[o.status] || "#999",
                            }}
                          >
                            {o.status}
                          </span>
                          <span
                            className="rent-margem-badge"
                            style={{ background: corMargem(o.margem) }}
                          >
                            {o.margem.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="rent-barra-wrap">
                        <div className="rent-barra-fundo">
                          <div
                            className="rent-barra-custo"
                            style={{
                              width:
                                o.totalFinal > 0
                                  ? `${Math.min(100, (o.custoMateriais / o.totalFinal) * 100)}%`
                                  : "0%",
                            }}
                            title={`Custo: ${formatarMoeda(o.custoMateriais)}`}
                          />
                        </div>
                        <div className="rent-barra-legenda">
                          <span className="rent-leg-custo">Custo</span>
                          <span className="rent-leg-lucro">Lucro</span>
                        </div>
                      </div>

                      <div className="fin-valores">
                        <span className="fin-valor-item">
                          <span className="fin-valor-label">Receita</span>
                          <span className="fin-valor-num">
                            {formatarMoeda(o.totalFinal)}
                          </span>
                        </span>
                        <span className="fin-valor-item">
                          <span className="fin-valor-label">Custo mat.</span>
                          <span className="fin-valor-num fin-valor-falta">
                            {formatarMoeda(o.custoMateriais)}
                          </span>
                        </span>
                        <span className="fin-valor-item">
                          <span className="fin-valor-label">Lucro</span>
                          <span className="fin-valor-num fin-valor-recebido">
                            {formatarMoeda(o.lucro)}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ===== MODAL REGISTRAR PAGAMENTO ===== */}
      {modalAberto && orcamentoSelecionado && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Registrar Pagamento</h2>
            <p className="modal-subtitle">
              {orcamentoSelecionado.cliente.nome} —{" "}
              {orcamentoSelecionado.titulo}
            </p>

            <div className="form-group">
              <label className="form-label">Descrição</label>
              <input
                className="form-input"
                placeholder="Ex: Sinal, Parcela 1, Saldo final"
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Valor</label>
              <input
                className="form-input"
                placeholder="R$ 0,00"
                value={formValor}
                onChange={(e) => setFormValor(mascaraMoeda(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Data do pagamento</label>
              <input
                className="form-input"
                type="date"
                value={formData}
                onChange={(e) => setFormData(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={fecharModal}>
                Cancelar
              </button>
              <button
                className="btn-add"
                onClick={registrarPagamento}
                disabled={salvando}
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
