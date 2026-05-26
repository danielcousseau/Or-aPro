import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { formatarMoeda } from '../utils/format';
import { mascaraMoeda, desmascararMoeda } from '../utils/masks';
import { CORES_STATUS } from '../constants/status';

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

type Filtro = 'todos' | 'pendentes' | 'pagos';

const FILTROS: { valor: Filtro; label: string }[] = [
    { valor: 'todos', label: 'Todos' },
    { valor: 'pendentes', label: 'Com saldo pendente' },
    { valor: 'pagos', label: 'Pagos' },
];

function totalPago(orcamento: OrcamentoFinanceiro): number {
    return orcamento.pagamentos.reduce((acc, p) => acc + p.valor, 0);
}

function estaPago(orcamento: OrcamentoFinanceiro): boolean {
    return totalPago(orcamento) >= orcamento.totalFinal;
}

function formatarData(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR');
}

export default function Financeiro() {
    const [orcamentos, setOrcamentos] = useState<OrcamentoFinanceiro[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [filtro, setFiltro] = useState<Filtro>('todos');
    const [expandido, setExpandido] = useState<number | null>(null);

    const [modalAberto, setModalAberto] = useState(false);
    const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<OrcamentoFinanceiro | null>(null);
    const [formDescricao, setFormDescricao] = useState('');
    const [formValor, setFormValor] = useState('');
    const [formData, setFormData] = useState(() => new Date().toISOString().slice(0, 10));
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        try {
            const { data } = await api.get<OrcamentoFinanceiro[]>('/pagamentos');
            setOrcamentos(data);
        } catch {
            toast.error('Erro ao carregar dados financeiros');
        } finally {
            setCarregando(false);
        }
    }

    const orcamentosFiltrados = useMemo(() => {
        if (filtro === 'pagos') return orcamentos.filter(estaPago);
        if (filtro === 'pendentes') return orcamentos.filter(o => !estaPago(o));
        return orcamentos;
    }, [orcamentos, filtro]);

    const totalAReceber = useMemo(() =>
        orcamentos.filter(o => !estaPago(o)).reduce((acc, o) => acc + (o.totalFinal - totalPago(o)), 0),
        [orcamentos]
    );

    const totalRecebido = useMemo(() =>
        orcamentos.reduce((acc, o) => acc + totalPago(o), 0),
        [orcamentos]
    );

    function abrirModal(orcamento: OrcamentoFinanceiro) {
        setOrcamentoSelecionado(orcamento);
        setFormDescricao('');
        setFormValor('');
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
            toast.warning('Preencha descrição e valor');
            return;
        }
        if (salvando) return;
        setSalvando(true);
        try {
            const { data } = await api.post<Pagamento>(`/pagamentos/${orcamentoSelecionado.id}`, {
                descricao: formDescricao.trim(),
                valor,
                dataPagamento: formData
            });
            setOrcamentos(prev => prev.map(o =>
                o.id === orcamentoSelecionado.id
                    ? { ...o, pagamentos: [...o.pagamentos, data] }
                    : o
            ));
            toast.success('Pagamento registrado');
            fecharModal();
        } catch {
            toast.error('Erro ao registrar pagamento');
        } finally {
            setSalvando(false);
        }
    }

    async function excluirPagamento(orcamentoId: number, pagamentoId: number) {
        try {
            await api.delete(`/pagamentos/${orcamentoId}/${pagamentoId}`);
            setOrcamentos(prev => prev.map(o =>
                o.id === orcamentoId
                    ? { ...o, pagamentos: o.pagamentos.filter(p => p.id !== pagamentoId) }
                    : o
            ));
            toast.success('Pagamento removido');
        } catch {
            toast.error('Erro ao remover pagamento');
        }
    }

    if (carregando) return <div className="page-loading">Carregando...</div>;

    return (
        <div className="financeiro-page">
            <div className="financeiro-header">
                <h1 className="financeiro-title">Financeiro</h1>
                <div className="financeiro-resumo">
                    <div className="resumo-card resumo-receber">
                        <span className="resumo-label">A receber</span>
                        <span className="resumo-valor">{formatarMoeda(totalAReceber)}</span>
                    </div>
                    <div className="resumo-card resumo-recebido">
                        <span className="resumo-label">Já recebido</span>
                        <span className="resumo-valor">{formatarMoeda(totalRecebido)}</span>
                    </div>
                </div>
            </div>

            <div className="financeiro-filtros">
                {FILTROS.map(f => (
                    <button
                        key={f.valor}
                        className={`filtro-btn${filtro === f.valor ? ' filtro-btn--ativo' : ''}`}
                        onClick={() => setFiltro(f.valor)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {orcamentosFiltrados.length === 0 ? (
                <p className="financeiro-vazio">Nenhum orçamento encontrado.</p>
            ) : (
                <div className="financeiro-lista">
                    {orcamentosFiltrados.map(orcamento => {
                        const pago = totalPago(orcamento);
                        const restante = Math.max(0, orcamento.totalFinal - pago);
                        const percentual = orcamento.totalFinal > 0
                            ? Math.min(100, Math.round((pago / orcamento.totalFinal) * 100))
                            : 0;
                        const quitado = estaPago(orcamento);
                        const aberto = expandido === orcamento.id;

                        return (
                            <div key={orcamento.id} className={`fin-card${quitado ? ' fin-card--pago' : ''}`}>
                                <div className="fin-card-topo">
                                    <div className="fin-card-info">
                                        <span className="fin-cliente">{orcamento.cliente.nome}</span>
                                        <span className="fin-titulo">{orcamento.titulo}</span>
                                        <span className="fin-data">{formatarData(orcamento.createdAt)}</span>
                                    </div>
                                    <div className="fin-card-direita">
                                        <span
                                            className="fin-status-badge"
                                            style={{ background: CORES_STATUS[orcamento.status] || '#999' }}
                                        >
                                            {orcamento.status}
                                        </span>
                                        {quitado && <span className="fin-badge-pago">Pago</span>}
                                    </div>
                                </div>

                                <div className="fin-progress-area">
                                    <div className="fin-progress-bar">
                                        <div
                                            className="fin-progress-fill"
                                            style={{
                                                width: `${percentual}%`,
                                                background: quitado ? 'var(--success)' : 'var(--primary)'
                                            }}
                                        />
                                    </div>
                                    <span className="fin-progress-pct">{percentual}%</span>
                                </div>

                                <div className="fin-valores">
                                    <span className="fin-valor-item">
                                        <span className="fin-valor-label">Total</span>
                                        <span className="fin-valor-num">{formatarMoeda(orcamento.totalFinal)}</span>
                                    </span>
                                    <span className="fin-valor-item">
                                        <span className="fin-valor-label">Recebido</span>
                                        <span className="fin-valor-num fin-valor-recebido">{formatarMoeda(pago)}</span>
                                    </span>
                                    {!quitado && (
                                        <span className="fin-valor-item">
                                            <span className="fin-valor-label">Falta</span>
                                            <span className="fin-valor-num fin-valor-falta">{formatarMoeda(restante)}</span>
                                        </span>
                                    )}
                                </div>

                                <div className="fin-acoes">
                                    {!quitado && (
                                        <button className="btn-add" onClick={() => abrirModal(orcamento)}>
                                            + Registrar Pagamento
                                        </button>
                                    )}
                                    {orcamento.pagamentos.length > 0 && (
                                        <button
                                            className="btn-ghost"
                                            onClick={() => setExpandido(aberto ? null : orcamento.id)}
                                        >
                                            {aberto ? 'Ocultar' : `Ver ${orcamento.pagamentos.length} pagamento${orcamento.pagamentos.length > 1 ? 's' : ''}`}
                                        </button>
                                    )}
                                </div>

                                {aberto && (
                                    <div className="fin-pagamentos-lista">
                                        {orcamento.pagamentos.map(p => (
                                            <div key={p.id} className="fin-pagamento-item">
                                                <span className="fin-pag-data">{formatarData(p.dataPagamento)}</span>
                                                <span className="fin-pag-desc">{p.descricao}</span>
                                                <span className="fin-pag-valor">{formatarMoeda(p.valor)}</span>
                                                <button
                                                    className="fin-pag-excluir"
                                                    onClick={() => excluirPagamento(orcamento.id, p.id)}
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

            {modalAberto && orcamentoSelecionado && (
                <div className="modal-overlay" onClick={fecharModal}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Registrar Pagamento</h2>
                        <p className="modal-subtitle">
                            {orcamentoSelecionado.cliente.nome} — {orcamentoSelecionado.titulo}
                        </p>

                        <div className="form-group">
                            <label className="form-label">Descrição</label>
                            <input
                                className="form-input"
                                placeholder="Ex: Sinal, Parcela 1, Saldo final"
                                value={formDescricao}
                                onChange={e => setFormDescricao(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Valor</label>
                            <input
                                className="form-input"
                                placeholder="R$ 0,00"
                                value={formValor}
                                onChange={e => setFormValor(mascaraMoeda(e.target.value))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Data do pagamento</label>
                            <input
                                className="form-input"
                                type="date"
                                value={formData}
                                onChange={e => setFormData(e.target.value)}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={fecharModal}>Cancelar</button>
                            <button className="btn-add" onClick={registrarPagamento} disabled={salvando}>
                                {salvando ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
