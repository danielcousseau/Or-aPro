import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Orcamento } from '../types';
import { formatarMoeda } from '../utils/format';

interface DadosContrato extends Orcamento {
    nomeMarcenaria?: string | null;
    logoMarcenaria?: string | null;
    contratoToken?: string;
    contratoGeradoEm?: string;
    contratoAceito?: boolean;
    contratoAceitoEm?: string | null;
}

export default function Contrato() {
    const { token } = useParams<{ token: string }>();
    const [dados, setDados] = useState<DadosContrato | null>(null);
    const [erro, setErro] = useState('');
    const [aceitando, setAceitando] = useState(false);
    const [aceito, setAceito] = useState(false);
    const [aceitoEm, setAceitoEm] = useState<string | null>(null);
    const [gerando, setGerando] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        api.get(`/orcamentos/contrato/${token}`)
            .then(res => {
                setDados(res.data);
                if (res.data.contratoAceito) {
                    setAceito(true);
                    setAceitoEm(res.data.contratoAceitoEm);
                }
            })
            .catch(() => setErro('Este link de contrato é inválido ou o projeto não foi encontrado.'));
    }, [token]);

    const handleAceitar = async () => {
        setAceitando(true);
        try {
            const res = await api.patch(`/orcamentos/contrato/${token}/aceitar`);
            setAceito(true);
            setAceitoEm(res.data.contratoAceitoEm);
        } catch {
            alert('Erro ao registrar aceite. Tente novamente.');
        } finally {
            setAceitando(false);
        }
    };

    const baixarPDF = async () => {
        setGerando(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const titulo = dados?.titulo?.replace(/\s+/g, '_') || 'Contrato';
            await html2pdf().set({
                margin: [10, 10, 10, 10],
                filename: `Contrato_${titulo}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: 'avoid-all' }
            }).from(contentRef.current).save();
        } finally {
            setGerando(false);
        }
    };

    if (erro) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f5f5' }}>
                <div style={{ background: '#fff', padding: '40px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ color: '#e74c3c' }}>Oops!</h2>
                    <p>{erro}</p>
                </div>
            </div>
        );
    }

    if (!dados) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Carregando contrato...</p>;

    const logoSrc = dados.logoMarcenaria || '/logo-orcapro.png';
    const nomeMarcenaria = dados.nomeMarcenaria || 'Marcenaria';
    const dataGeracao = dados.contratoGeradoEm
        ? new Date(dados.contratoGeradoEm).toLocaleDateString('pt-BR')
        : new Date().toLocaleDateString('pt-BR');
    const totalFormatado = formatarMoeda(dados.totalFinal);

    return (
        <div className="doc-wrapper">
            <div className="doc-toolbar no-print" style={{ justifyContent: 'center' }}>
                <button onClick={() => window.print()} style={{ background: '#27ae60', color: '#fff' }}>Imprimir</button>
                <button onClick={baixarPDF} disabled={gerando} style={{ background: '#2980b9', color: '#fff', opacity: gerando ? 0.7 : 1 }}>
                    {gerando ? 'Gerando...' : 'Baixar PDF'}
                </button>
            </div>

            <div ref={contentRef} className="doc-page">
                {/* Cabeçalho */}
                <header className="doc-header">
                    <img src={logoSrc} alt="Logo" className="doc-logo" />
                    <div className="doc-header-right">
                        <p className="doc-marcenaria">{nomeMarcenaria}</p>
                        <p className="doc-subtitulo">Contrato de Serviço</p>
                        <p className="doc-data">Gerado em: {dataGeracao}</p>
                    </div>
                </header>

                {/* Dados das partes */}
                <div className="doc-grid">
                    <section className="doc-section">
                        <h4>Contratante (Cliente)</h4>
                        <p><strong>Nome:</strong> {dados.cliente?.nome || '-'}</p>
                        <p><strong>Telefone:</strong> {dados.cliente?.telefone || '-'}</p>
                        {dados.cliente?.email && <p><strong>E-mail:</strong> {dados.cliente.email}</p>}
                        {dados.cliente?.cidade && <p><strong>Cidade:</strong> {dados.cliente.cidade}</p>}
                    </section>
                    <section className="doc-section">
                        <h4>Contratada (Marcenaria)</h4>
                        <p><strong>Empresa:</strong> {nomeMarcenaria}</p>
                        <p><strong>Projeto:</strong> {dados.titulo}</p>
                        {dados.ambiente && <p><strong>Ambiente:</strong> {dados.ambiente}</p>}
                        {dados.tipoMovel && <p><strong>Móvel:</strong> {dados.tipoMovel}</p>}
                    </section>
                </div>

                {/* Resumo do projeto */}
                {dados.materiais && dados.materiais.length > 0 && (
                    <section className="doc-section" style={{ marginTop: '16px' }}>
                        <h4>Itens do Projeto</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: '#f1f5f9' }}>
                                    <th style={{ textAlign: 'left', padding: '6px 8px', border: '1px solid #e2e8f0' }}>Item</th>
                                    <th style={{ textAlign: 'center', padding: '6px 8px', border: '1px solid #e2e8f0' }}>Qtd</th>
                                    <th style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #e2e8f0' }}>Valor unit.</th>
                                    <th style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #e2e8f0' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dados.materiais.map((mat, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>{mat.nome}</td>
                                        <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{mat.quantidade}</td>
                                        <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{formatarMoeda(mat.valor)}</td>
                                        <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{formatarMoeda(mat.valor * mat.quantidade)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}

                {/* Valor e condições */}
                <div className="doc-total-box">
                    <div className="doc-total-detalhes">
                        <p><strong>Prazo de entrega:</strong> {dados.prazo || 'A combinar'}</p>
                        <p><strong>Forma de pagamento:</strong> {dados.pagamento || 'A combinar'}</p>
                        {dados.medidas && <p><strong>Medidas:</strong> {dados.medidas}</p>}
                    </div>
                    <div className="doc-total-valor-area">
                        <span className="doc-total-label">Valor Total</span>
                        <span className="doc-total-valor">{totalFormatado}</span>
                    </div>
                </div>

                {/* Texto das condições */}
                <section className="doc-section contrato-condicoes" style={{ marginTop: '16px', background: '#f8fafc', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0' }}>
                    <h4>Condições Gerais</h4>
                    <p>Este contrato confirma o acordo entre <strong>{nomeMarcenaria}</strong> e <strong>{dados.cliente?.nome}</strong> para execução do projeto descrito acima, pelo valor total de <strong>{totalFormatado}</strong>.</p>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
                        <li>Prazo de execução a combinar entre as partes</li>
                        <li>Pagamento conforme acordado no orçamento</li>
                        <li>Alterações no projeto após aprovação podem gerar custos adicionais</li>
                        <li>Este documento tem validade como confirmação formal do pedido</li>
                    </ul>
                    {dados.observacoes && (
                        <p style={{ marginTop: '12px' }}><strong>Observações:</strong> {dados.observacoes}</p>
                    )}
                </section>

                {/* Aceite */}
                <div className="no-print" style={{ marginTop: '32px', textAlign: 'center' }}>
                    {aceito ? (
                        <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '20px', display: 'inline-block' }}>
                            <p style={{ color: '#065f46', fontWeight: 600, fontSize: '1.1rem', margin: 0 }}>
                                ✓ Contrato aceito
                            </p>
                            {aceitoEm && (
                                <p style={{ color: '#065f46', fontSize: '0.9rem', margin: '4px 0 0' }}>
                                    em {new Date(aceitoEm).toLocaleString('pt-BR')}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p style={{ color: 'var(--text-soft)', marginBottom: '12px', fontSize: '0.9rem' }}>
                                Ao clicar em aceitar, você confirma que leu e concorda com as condições acima.
                            </p>
                            <button
                                onClick={handleAceitar}
                                disabled={aceitando}
                                style={{
                                    background: '#10b981',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '14px 40px',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: aceitando ? 'not-allowed' : 'pointer',
                                    opacity: aceitando ? 0.7 : 1
                                }}
                            >
                                {aceitando ? 'Registrando...' : 'Li e aceito o contrato'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Rodapé impresso */}
                <footer className="doc-footer" style={{ marginTop: '24px' }}>
                    {aceito && aceitoEm && (
                        <p><strong>Aceito digitalmente em:</strong> {new Date(aceitoEm).toLocaleString('pt-BR')}</p>
                    )}
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Documento gerado pelo OrcaPro — sistema de gestão para marcenarias.
                    </p>
                </footer>
            </div>
        </div>
    );
}
