import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ImprimirOrcamento() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [orc, setOrc] = useState(null);
    const [erro, setErro] = useState(false);

    useEffect(() => {
        // [SecOps] Prevenção de falhas silenciosas. O frontend deve reagir se a API recusar o acesso ou falhar.
        api.get(`/orcamentos/${id}`)
            .then(res => setOrc(res.data))
            .catch(err => {
                console.error("Erro ao carregar orçamento para impressão:", err);
                setErro(true);
            });
    }, [id]);

    // [Melhoria de UX] Altera o título da aba para definir o nome sugerido do PDF ao salvar.
    useEffect(() => {
        if (orc) {
            const tituloOriginal = document.title; // Guarda o título antigo
            // Formata o nome do arquivo, trocando espaços por underline (ex: Orcamento_12_Joao_da_Silva)
            const nomeClienteFormatado = orc.cliente.nome.replace(/\s+/g, '_');
            document.title = `Orcamento_${orc.id}_${nomeClienteFormatado}`;
            
            return () => { document.title = tituloOriginal; }; // Restaura ao sair da página
        }
    }, [orc]);

    // [Arquitetura] Função segura para formatação financeira (evita bugs de ponto flutuante do JS)
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(valor || 0);
    };

    if (erro) return <p style={{ padding: '20px', color: '#e74c3c' }}>Erro ao carregar o orçamento. Verifique se ele existe ou se tem permissões de acesso.</p>;
    if (!orc) return <p style={{ padding: '20px' }}>Carregando orçamento...</p>;

    return (
        <div className="print-container">
            {/* Botões que somem na hora de imprimir */}
            <div className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '10px', padding: '20px' }}>
                <button onClick={() => window.print()} style={{ background: '#27ae60' }}>🖨️ Imprimir / Salvar PDF</button>
                <button onClick={() => navigate('/historico')} style={{ background: '#7f8c8d' }}>Voltar</button>
            </div>

            <div className="print-page">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
                    <div>
                        <img src="/logo-orcapro.png" alt="Logo da Empresa" style={{ maxWidth: '250px', height: 'auto' }} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ margin: 0 }}>Orçamento #{orc.id}</h2>
                        <p>Data: {new Date(orc.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                </header>

                <section style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <h3 style={{ borderBottom: '1px solid #ddd' }}>Dados do Cliente</h3>
                        <p><strong>Nome:</strong> {orc.cliente.nome}</p>
                        <p><strong>Telefone:</strong> {orc.cliente.telefone}</p>
                        <p><strong>Cidade:</strong> {orc.cliente.cidade || '-'}</p>
                    </div>
                    <div>
                        <h3 style={{ borderBottom: '1px solid #ddd' }}>Projeto</h3>
                        <p><strong>Título:</strong> {orc.titulo}</p>
                        <p><strong>Ambiente:</strong> {orc.ambiente || '-'}</p>
                        <p><strong>Móvel:</strong> {orc.tipoMovel || '-'}</p>
                    </div>
                </section>

                <section style={{ marginTop: '30px' }}>
                    <h3 style={{ borderBottom: '1px solid #ddd' }}>Descrição dos Materiais</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ background: '#f4f4f4', textAlign: 'left' }}>
                                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Item</th>
                                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Qtd</th>
                                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Valor Unit.</th>
                                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orc.materiais.map((m, i) => (
                                <tr key={i}>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{m.nome}</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{m.quantidade}</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatarMoeda(m.valor)}</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatarMoeda(m.valor * m.quantidade)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section style={{ marginTop: '30px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-block', minWidth: '250px', border: '2px solid #333', padding: '15px', borderRadius: '8px' }}>
                        <p style={{ margin: '5px 0' }}>Prazo: <strong>{orc.prazo || 'A combinar'}</strong></p>
                        <p style={{ margin: '5px 0' }}>Pagamento: <strong>{orc.pagamento || 'A combinar'}</strong></p>
                        <h2 style={{ margin: '10px 0 0 0', color: '#27ae60' }}>Total: {formatarMoeda(orc.totalFinal)}</h2>
                    </div>
                </section>

                <footer style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #eee', fontSize: '0.8rem', color: '#777' }}>
                    <p>Este orçamento é válido por {orc.validade || '7'} dias.</p>
                    <p>Observações: {orc.observacoes || 'Nenhuma.'}</p>
                </footer>
            </div>

            {/* CSS específico para impressão */}
            <style>{`
                @media print {
                    @page { 
                        size: A4; 
                        margin: 0; /* Remove rodapés de impressão nativos do navegador */
                    }
                    .no-print, .menu { display: none !important; }
                    body { background: white !important; }
                    .container { margin: 0 !important; padding: 0 !important; width: 100% !important; }
                    .print-page { border: none !important; box-shadow: none !important; }
                }
                .print-page {
                    background: white;
                    color: #333;
                    padding: 40px;
                    border: 1px solid #ddd;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    min-height: 29.7cm;
                }
            `}</style>
        </div>
    );
}