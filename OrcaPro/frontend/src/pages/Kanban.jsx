import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const COLUNAS = ['Aguardando', 'Aprovado', 'Produção', 'Instalação', 'Entregue'];

const COR_COLUNA = {
    'Aguardando': '#f59e0b',
    'Aprovado':   '#3b82f6',
    'Produção':   '#8b5cf6',
    'Instalação': '#f97316',
    'Entregue':   '#10b981',
};

export default function Kanban() {
    const [orcamentos, setOrcamentos] = useState([]);
    const [termoBusca, setTermoBusca] = useState('');

    useEffect(() => {
        carregarOrcamentos();
    }, []);

    const carregarOrcamentos = async () => {
        try {
            const response = await api.get('/orcamentos');
            setOrcamentos(response.data);
        } catch (error) {
            console.error("Erro ao carregar orçamentos", error);
        }
    };

    const mudarStatus = async (id, novoStatus) => {
        try {
            await api.patch(`/orcamentos/${id}/status`, { status: novoStatus });
            carregarOrcamentos();
        } catch (error) {
            toast.error("Erro ao atualizar status do projeto.");
        }
    };

    const orcamentosFiltrados = termoBusca
        ? orcamentos.filter(o =>
            o.titulo?.toLowerCase().includes(termoBusca.toLowerCase()) ||
            o.cliente?.nome?.toLowerCase().includes(termoBusca.toLowerCase())
          )
        : orcamentos;

    return (
        <div>
            <h1>Quadro de Produção</h1>
            <div className="search-bar" style={{ marginBottom: '24px' }}>
                <p style={{ margin: 0 }}>Acompanhe o andamento dos projetos e atualize os status.</p>
                <input
                    type="text"
                    placeholder="Buscar por título ou cliente..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                />
            </div>

            <div className="kanban-board">
                {COLUNAS.map(coluna => {
                    const orcamentosDaColuna = orcamentosFiltrados.filter(o =>
                        (o.status === coluna) ||
                        (coluna === 'Aguardando' && (!o.status || !COLUNAS.includes(o.status)))
                    );

                    return (
                        <div key={coluna} className="kanban-col" style={{ borderTopColor: COR_COLUNA[coluna] }}>
                            <h3 className="kanban-col-title">
                                {coluna}{' '}
                                <span style={{ background: COR_COLUNA[coluna], color: '#fff', borderRadius: '999px', padding: '1px 8px', fontSize: '0.75rem' }}>
                                    {orcamentosDaColuna.length}
                                </span>
                            </h3>

                            {orcamentosDaColuna.length === 0 && (
                                <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', padding: '20px 0' }}>
                                    Nenhum projeto
                                </p>
                            )}

                            {orcamentosDaColuna.map(orc => (
                                <div key={orc.id} className="kanban-card">
                                    <h4>{orc.titulo}</h4>
                                    <p style={{ fontSize: '0.85rem', margin: '0 0 4px', color: 'var(--text-soft)' }}>{orc.cliente?.nome || 'Sem cliente'}</p>
                                    <p className="kanban-valor">R$ {Number(orc.totalFinal).toFixed(2)}</p>
                                    <select value={orc.status || 'Aguardando'} onChange={(e) => mudarStatus(orc.id, e.target.value)}>
                                        {COLUNAS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
