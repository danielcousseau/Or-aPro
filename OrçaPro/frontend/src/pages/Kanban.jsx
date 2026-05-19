import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

// Estas são as colunas do nosso quadro
const COLUNAS = ['Aguardando', 'Aprovado', 'Produção', 'Instalação', 'Entregue'];

export default function Kanban() {
    const [orcamentos, setOrcamentos] = useState([]);

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
            carregarOrcamentos(); // Recarrega a tela para a nova posição do card
        } catch (error) {
            toast.error("Erro ao atualizar status do projeto.");
        }
    };

    return (
        <div>
            <h1>Quadro de Produção</h1>
            <p style={{ color: 'var(--text-soft)', marginBottom: '30px' }}>
                Acompanhe o andamento dos projetos e atualize os status.
            </p>

            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', minHeight: '65vh' }}>
                {COLUNAS.map(coluna => {
                    // Filtra os orçamentos que pertencem a esta coluna.
                    // Se estiver sem status salvo, cai automaticamente na primeira coluna ("Aguardando").
                    const orcamentosDaColuna = orcamentos.filter(o => 
                        (o.status === coluna) || 
                        (coluna === 'Aguardando' && (!o.status || !COLUNAS.includes(o.status)))
                    );

                    return (
                        <div key={coluna} style={{ minWidth: '320px', background: '#f4f4f4', padding: '15px', borderRadius: '8px', borderTop: '4px solid var(--primary)' }}>
                            <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#333' }}>{coluna} ({orcamentosDaColuna.length})</h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {orcamentosDaColuna.map(orc => (
                                    <div key={orc.id} className="cliente-card" style={{ padding: '15px', background: '#fff' }}>
                                        <h4 style={{ margin: '0 0 10px 0' }}>{orc.titulo}</h4>
                                        <p style={{ fontSize: '0.9rem', margin: '0 0 5px 0' }}><strong>Cliente:</strong> {orc.cliente?.nome || 'N/A'}</p>
                                        <p style={{ fontSize: '0.9rem', margin: '0 0 15px 0', color: 'var(--primary)', fontWeight: 'bold' }}>R$ {Number(orc.totalFinal).toFixed(2)}</p>
                                        
                                        <select value={orc.status || 'Aguardando'} onChange={(e) => mudarStatus(orc.id, e.target.value)} style={{ width: '100%', padding: '8px', cursor: 'pointer' }}>
                                            {COLUNAS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}