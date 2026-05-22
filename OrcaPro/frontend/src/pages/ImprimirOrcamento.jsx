import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatarMoeda } from '../utils/format';
import { toast } from 'react-toastify';

export default function ImprimirOrcamento() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [orc, setOrc] = useState(null);
    const [erro, setErro] = useState(false);
    const [numeroLocal, setNumeroLocal] = useState('');
    const [gerando, setGerando] = useState(false);

    useEffect(() => {
        Promise.all([
            api.get(`/orcamentos/${id}`),
            api.get('/orcamentos')
        ])
            .then(([resOrc, resTodos]) => {
                setOrc(resOrc.data);
                const listaCrescente = resTodos.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                const index = listaCrescente.findIndex(o => o.id === Number(id));
                setNumeroLocal(index !== -1 ? index + 1 : id);
            })
            .catch(err => {
                console.error("Erro ao carregar orçamento para impressão:", err);
                setErro(true);
            });
    }, [id]);

    useEffect(() => {
        if (orc) {
            const tituloOriginal = document.title;
            const nomeClienteFormatado = orc.cliente.nome.replace(/\s+/g, '_');
            document.title = `Orcamento_${numeroLocal || orc.id}_${nomeClienteFormatado}`;
            return () => { document.title = tituloOriginal; };
        }
    }, [orc, numeroLocal]);

    if (erro) return <p style={{ padding: '20px', color: '#e74c3c' }}>Erro ao carregar o orçamento. Verifique se ele existe ou se tem permissões de acesso.</p>;
    if (!orc) return <p style={{ padding: '20px' }}>Carregando orçamento...</p>;

    const baixarPDF = async () => {
        setGerando(true);
        try {
            const response = await api.get(`/orcamentos/${id}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            const nomeCliente = orc.cliente.nome.replace(/\s+/g, '_');
            link.setAttribute('download', `Orcamento_${numeroLocal || id}_${nomeCliente}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error('Erro ao gerar o PDF. Tente novamente.');
        } finally {
            setGerando(false);
        }
    };

    const enviarWhatsApp = async () => {
        if (!orc.cliente.telefone) {
            toast.warn("Este cliente não possui um telefone cadastrado.");
            return;
        }
        try {
            const response = await api.post(`/orcamentos/${orc.id}/link-publico`);
            const token = response.data.token;

            const baseUrl = window.location.hostname === 'localhost'
                ? 'https://orca-pro-seven.vercel.app/'
                : window.location.origin;
            const linkProposta = `${baseUrl}/proposta/${token}`;

            let telefoneFormatado = orc.cliente.telefone.replace(/\D/g, '');
            if (telefoneFormatado.length === 10 || telefoneFormatado.length === 11) {
                telefoneFormatado = '55' + telefoneFormatado;
            }

            const mensagem = `Olá, *${orc.cliente.nome}*!\n\nAqui é da Marcenaria. Finalizamos o seu orçamento para o projeto *${orc.titulo}*.\n\nVocê pode visualizar os detalhes de forma segura através deste link exclusivo:\n${linkProposta}\n\nQualquer dúvida, estou à disposição!`;
            window.open(`https://wa.me/${telefoneFormatado}?text=${encodeURIComponent(mensagem)}`, '_blank');
        } catch {
            toast.error("Erro ao gerar link seguro para envio.");
        }
    };

    return (
        <div className="print-container">
            <div className="print-action-bar no-print">
                <button onClick={() => window.print()} style={{ background: '#27ae60' }}>🖨️ Imprimir</button>
                <button onClick={baixarPDF} disabled={gerando} style={{ background: '#2980b9' }}>
                    {gerando ? 'Gerando...' : '⬇️ Baixar PDF'}
                </button>
                <button onClick={enviarWhatsApp} style={{ background: '#25D366', color: '#fff' }}>💬 WhatsApp</button>
                <button onClick={() => navigate('/historico')} style={{ background: '#7f8c8d' }}>← Voltar</button>
            </div>

            <div className="print-page">
                <header className="print-header">
                    <div>
                        <img src="/logo-orcapro.png" alt="Logo da Empresa" style={{ maxWidth: '200px', height: 'auto' }} />
                    </div>
                    <div className="print-header-info">
                        <h2 style={{ margin: 0 }}>Orçamento #{numeroLocal || orc.id}</h2>
                        <p style={{ margin: '4px 0 0' }}>Data: {new Date(orc.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                </header>

                <section className="print-data-grid">
                    <div>
                        <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '6px' }}>Dados do Cliente</h3>
                        <p><strong>Nome:</strong> {orc.cliente.nome}</p>
                        <p><strong>Telefone:</strong> {orc.cliente.telefone}</p>
                        <p><strong>Cidade:</strong> {orc.cliente.cidade || '-'}</p>
                    </div>
                    <div>
                        <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '6px' }}>Projeto</h3>
                        <p><strong>Título:</strong> {orc.titulo}</p>
                        <p><strong>Ambiente:</strong> {orc.ambiente || '-'}</p>
                        <p><strong>Móvel:</strong> {orc.tipoMovel || '-'}</p>
                    </div>
                </section>

                <section className="print-total-section">
                    <div className="print-total-box">
                        <p style={{ margin: '5px 0' }}>Prazo: <strong>{orc.prazo || 'A combinar'}</strong></p>
                        <p style={{ margin: '5px 0' }}>Pagamento: <strong>{orc.pagamento || 'A combinar'}</strong></p>
                        <h2 style={{ margin: '10px 0 0', color: '#27ae60' }}>Total: {formatarMoeda(orc.totalFinal)}</h2>
                    </div>
                </section>

                <footer className="print-footer">
                    <p>Este orçamento é válido por {orc.validade || '7 dias'}.</p>
                    <p>Observações: {orc.observacoes || 'Nenhuma.'}</p>
                </footer>
            </div>

            <style>{`
                /* === Layout base === */
                .print-container {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 0 0 40px;
                }

                .print-action-bar {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    padding: 16px 20px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #e0e0e0;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }

                .print-action-bar button {
                    flex: 1 1 auto;
                    min-width: 120px;
                    white-space: nowrap;
                }

                .print-page {
                    background: white;
                    color: #333;
                    padding: 32px 36px 28px;
                    border: 1px solid #ddd;
                    box-shadow: 0 0 12px rgba(0,0,0,0.08);
                    margin: 20px;
                }

                /* === Cabeçalho === */
                .print-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #333;
                    padding-bottom: 14px;
                    gap: 12px;
                }

                .print-header-info {
                    text-align: right;
                }

                /* === Grid de dados (2 colunas) === */
                .print-data-grid {
                    margin-top: 22px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                }

                .print-data-grid p {
                    margin: 6px 0;
                }

                /* === Box de total === */
                .print-total-section {
                    margin-top: 28px;
                    display: flex;
                    justify-content: flex-end;
                }

                .print-total-box {
                    min-width: 260px;
                    max-width: 100%;
                    border: 2px solid #333;
                    padding: 16px 20px;
                    border-radius: 8px;
                }

                /* === Rodapé === */
                .print-footer {
                    margin-top: 32px;
                    padding-top: 16px;
                    border-top: 1px solid #eee;
                    font-size: 0.82rem;
                    color: #777;
                }

                .print-footer p {
                    margin: 4px 0;
                }

                /* === Responsivo mobile === */
                @media (max-width: 600px) {
                    .print-action-bar {
                        padding: 10px 12px;
                        gap: 8px;
                    }

                    .print-action-bar button {
                        flex: 1 1 calc(50% - 4px);
                        min-width: 0;
                        font-size: 0.8rem;
                        padding: 10px 6px;
                    }

                    .print-page {
                        margin: 10px;
                        padding: 20px 16px 20px;
                    }

                    .print-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .print-header-info {
                        text-align: left;
                    }

                    .print-data-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }

                    .print-total-section {
                        justify-content: stretch;
                    }

                    .print-total-box {
                        min-width: unset;
                        width: 100%;
                    }
                }

                /* === Impressão (Ctrl+P / window.print) === */
                @media print {
                    @page {
                        size: A4;
                        margin: 0; /* Remove cabeçalho/rodapé nativos do navegador (nome do arquivo, URL) */
                    }

                    .no-print,
                    .menu {
                        display: none !important;
                    }

                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    .print-container {
                        margin: 0 !important;
                        padding: 0 !important;
                        max-width: 100% !important;
                    }

                    .print-page {
                        border: none !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 15mm !important; /* Margem interna substitui a @page margin */
                        page-break-after: avoid;
                    }

                    .print-footer {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
}
