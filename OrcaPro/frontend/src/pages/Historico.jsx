// Repare que adicionei o useNavigate na linha de baixo junto com os imports do React
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { formatarMoeda } from '../utils/format';

export default function Historico() {
    const [orcamentos, setOrcamentos] = useState([]);
    const [orcamentoParaExcluir, setOrcamentoParaExcluir] = useState(null);
    const [termoBusca, setTermoBusca] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [excluindo, setExcluindo] = useState(false);
    const [materiaisAbertos, setMateriaisAbertos] = useState(new Set());
    
    // [Clean Code] Importando a mesma paleta de cores usada no Dashboard para criar identidade visual
    const CORES_STATUS = {
        'Aguardando': '#f39c12',
        'Aprovado': '#3498db',
        'Produção': '#9b59b6',
        'Instalação': '#e67e22',
        'Entregue': '#27ae60'
    };

    // Essa é a variável que faz a mágica de mudar de página
    const navigate = useNavigate();

    useEffect(() => {
        carregarOrcamentos();
    }, []);

    const carregarOrcamentos = async () => {
        setCarregando(true);
        try {
            const response = await api.get('/orcamentos');
            setOrcamentos(response.data);
        } catch (error) {
            console.error("Erro ao carregar orçamentos", error);
            toast.error("Erro ao carregar a lista de orçamentos.");
        } finally {
            setCarregando(false);
        }
    };

    const confirmarExclusao = async () => {
        if (!orcamentoParaExcluir || excluindo) return;
        
        setExcluindo(true);
        
        try {
            await api.delete(`/orcamentos/${orcamentoParaExcluir}`);
            toast.success('Orçamento excluído com sucesso!');
            setOrcamentoParaExcluir(null); // Fecha o modal
            carregarOrcamentos(); // Atualiza a lista na tela
        } catch (error) {
            console.error("Erro ao excluir orçamento", error);
            toast.error('Erro ao excluir orçamento.');
            setOrcamentoParaExcluir(null);
        } finally {
            setExcluindo(false);
        }
    };

    const toggleMateriais = (id) => {
        setMateriaisAbertos(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // [Clean Code] Lógica para filtrar a lista antes de renderizar
    const orcamentosFiltrados = orcamentos.filter(orc => {
        const termo = termoBusca.toLowerCase();
        return (
            (orc.titulo && orc.titulo.toLowerCase().includes(termo)) ||
            (orc.cliente?.nome && orc.cliente.nome.toLowerCase().includes(termo)) ||
            (orc.status && orc.status.toLowerCase().includes(termo))
        );
    });

    return (
        <div>
            <h1>Histórico de Orçamentos</h1>
            <div className="search-bar">
                <h2>{orcamentosFiltrados.length} orçamento{orcamentosFiltrados.length !== 1 ? 's' : ''}</h2>
                <input
                    type="text"
                    placeholder="Buscar por cliente, título ou status..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                />
            </div>
            
            <section className="lista-clientes">
                {carregando ? (
                    <p className="text-center text-soft" style={{ padding: '20px' }}>Carregando orçamentos...</p>
                ) : orcamentosFiltrados.length === 0 ? (
                    <p>Nenhum orçamento gerado ainda. Crie um novo lá na aba Orçamento!</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {orcamentosFiltrados.map(orc => (
                            <div key={orc.id} className="cliente-card highlight-primary">
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                        <h3 style={{ marginBottom: '5px' }}>{orc.titulo}</h3>
                                        <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem' }}>
                                            Criado em: {new Date(orc.createdAt).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.4rem' }}>
                                        {formatarMoeda(orc.totalFinal)}
                                    </h2>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '15px 0' }} />

                                <div className="form-grid-1-1">
                                    <p><strong>Cliente:</strong> {orc.cliente?.nome || 'Não informado'}</p>
                                    <p><strong>Telefone:</strong> {orc.cliente?.telefone || 'Não informado'}</p>
                                    <p><strong>Móvel:</strong> {orc.tipoMovel || '-'}</p>
                                    <p><strong>Ambiente:</strong> {orc.ambiente || '-'}</p>
                                    <div>
                                        {orc.materiais?.length > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => toggleMateriais(orc.id)}
                                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: materiaisAbertos.has(orc.id) ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                                    <polyline points="2,5 7,9 12,5" />
                                                </svg>
                                                {orc.materiais.length} {orc.materiais.length === 1 ? 'material' : 'materiais'}
                                            </button>
                                        ) : (
                                            <p><strong>Materiais:</strong> nenhum</p>
                                        )}
                                        {materiaisAbertos.has(orc.id) && (
                                            <ul style={{ margin: '6px 0 0 0', paddingLeft: '16px', fontSize: '0.85rem', color: 'var(--text-soft)', lineHeight: '1.7' }}>
                                                {orc.materiais.map(m => (
                                                    <li key={m.id}>{m.quantidade}× {m.nome} — {formatarMoeda(m.valor)}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <p><strong>Status:</strong> <span style={{ background: CORES_STATUS[orc.status] || '#95a5a6', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{orc.status || 'Aguardando'}</span></p>
                                </div>

                                <div className="card-actions">
                                    <button type="button" className="btn-action btn-edit" onClick={() => navigate(`/orcamento/${orc.id}`)}>
                                        Editar
                                    </button>
                                    <button type="button" className="btn-action" style={{ background: 'var(--success)', color: '#fff', border: '1px solid var(--success)' }} onClick={() => navigate(`/imprimir/${orc.id}`)}>
                                        Ver / Imprimir
                                    </button>
                                    <button type="button" className="btn-action btn-delete" onClick={() => setOrcamentoParaExcluir(orc.id)}>
                                        Excluir
                                    </button>
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
            {orcamentoParaExcluir && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Confirmar Exclusão</h3>
                        <p>Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita e removerá todos os seus dados permanentemente.</p>
                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" disabled={excluindo} onClick={() => setOrcamentoParaExcluir(null)}>Cancelar</button>
                            <button type="button" className="btn-delete" disabled={excluindo} onClick={confirmarExclusao} style={{ opacity: excluindo ? 0.7 : 1, cursor: excluindo ? 'not-allowed' : 'pointer' }}>
                                {excluindo ? 'Excluindo...' : 'Sim, Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}