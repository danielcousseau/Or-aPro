// Repare que adicionei o useNavigate na linha de baixo junto com os imports do React
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Historico() {
    const [orcamentos, setOrcamentos] = useState([]);
    const [orcamentoParaExcluir, setOrcamentoParaExcluir] = useState(null);
    
    // Essa é a variável que faz a mágica de mudar de página
    const navigate = useNavigate();

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

    const confirmarExclusao = async () => {
        if (!orcamentoParaExcluir) return;
        try {
            await api.delete(`/orcamentos/${orcamentoParaExcluir}`);
            alert('Orçamento excluído com sucesso!');
            setOrcamentoParaExcluir(null); // Fecha o modal
            carregarOrcamentos(); // Atualiza a lista na tela
        } catch (error) {
            console.error("Erro ao excluir orçamento", error);
            alert('Erro ao excluir orçamento.');
            setOrcamentoParaExcluir(null);
        }
    };

    return (
        <div>
            <h1>Histórico de Orçamentos</h1>
            
            <section className="lista-clientes">
                {orcamentos.length === 0 ? (
                    <p>Nenhum orçamento gerado ainda. Crie um novo lá na aba Orçamento!</p>
                ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {orcamentos.map(orc => (
                            <div key={orc.id} className="cliente-card" style={{ borderLeft: '4px solid var(--primary)', position: 'relative' }}>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ marginBottom: '5px' }}>{orc.titulo}</h3>
                                        <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem' }}>
                                            Criado em: {new Date(orc.createdAt).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <h2 style={{ color: 'var(--primary)', margin: 0 }}>
                                        R$ {Number(orc.totalFinal).toFixed(2)}
                                    </h2>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '15px 0' }} />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <p><strong>Cliente:</strong> {orc.cliente?.nome || 'Não informado'}</p>
                                    <p><strong>Telefone:</strong> {orc.cliente?.telefone || 'Não informado'}</p>
                                    <p><strong>Móvel:</strong> {orc.tipoMovel || '-'}</p>
                                    <p><strong>Ambiente:</strong> {orc.ambiente || '-'}</p>
                                    <p><strong>Materiais:</strong> {orc.materiais?.length || 0} itens</p>
                                    <p><strong>Status:</strong> <span style={{ background: 'var(--secondary)', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{orc.status}</span></p>
                                </div>

                                <div className="card-actions">
                                    <button type="button" className="btn-action btn-edit" onClick={() => navigate(`/orcamento/${orc.id}`)}>
                                        ✏️ Editar
                                    </button>
                                    <button type="button" onClick={() => navigate(`/imprimir/${orc.id}`)}>
                                        📄 Ver / Imprimir
                                    </button>
                                    <button type="button" className="btn-action btn-delete" onClick={() => setOrcamentoParaExcluir(orc.id)}>
                                        🗑️ Excluir
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
                            <button type="button" className="btn-cancel" onClick={() => setOrcamentoParaExcluir(null)}>Cancelar</button>
                            <button type="button" className="btn-delete" onClick={confirmarExclusao}>Sim, Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}