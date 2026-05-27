import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Orcamento, User } from '../types';
import { formatarMoeda } from '../utils/format';

export default function OrdemProducao() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [orc, setOrc] = useState<Orcamento | null>(null);
    const [numeroOP, setNumeroOP] = useState<string>('');
    const [erro, setErro] = useState(false);
    const [gerando, setGerando] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const userStorage = JSON.parse(localStorage.getItem('@OrcaPro:user') || '{}') as User;
    const nomeMarcenaria = userStorage.nomeMarcenaria || 'Marcenaria';
    const logoMarcenaria = userStorage.logoMarcenaria;

    useEffect(() => {
        Promise.all([
            api.get<Orcamento>(`/orcamentos/${id}`),
            api.get<Orcamento[]>('/orcamentos')
        ])
            .then(([resOrc, resTodos]) => {
                setOrc(resOrc.data);
                const lista = resTodos.data.sort(
                    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                const index = lista.findIndex(o => o.id === Number(id));
                setNumeroOP(String(index !== -1 ? index + 1 : id).padStart(3, '0'));
            })
            .catch(() => setErro(true));
    }, [id]);

    const baixarPDF = async () => {
        setGerando(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const nomeCliente = orc?.cliente?.nome.replace(/\s+/g, '_') ?? '';
            await html2pdf().set({
                margin: [10, 10, 10, 10],
                filename: `OP-${numeroOP}_${nomeCliente}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: 'avoid-all' }
            }).from(contentRef.current).save();
        } catch {
            toast.error('Erro ao gerar PDF.');
        } finally {
            setGerando(false);
        }
    };

    if (erro) return <p style={{ padding: '20px', color: '#e74c3c' }}>Erro ao carregar a ordem de produção.</p>;
    if (!orc) return <p style={{ padding: '20px' }}>Carregando...</p>;

    const totalMateriais = (orc.materiais ?? []).reduce((acc, m) => acc + m.valor * m.quantidade, 0);
    const dataFormatada = new Date(orc.createdAt).toLocaleDateString('pt-BR');

    return (
        <div className="doc-wrapper">
            <div className="doc-toolbar no-print">
                <button onClick={() => window.print()} style={{ background: '#27ae60', color: '#fff' }}>Imprimir</button>
                <button onClick={baixarPDF} disabled={gerando} style={{ background: '#2980b9', color: '#fff', opacity: gerando ? 0.7 : 1 }}>
                    {gerando ? 'Gerando...' : 'Baixar PDF'}
                </button>
                <button onClick={() => navigate('/')} style={{ background: '#7f8c8d', color: '#fff' }}>Voltar</button>
            </div>

            <div className="doc-content op-doc" ref={contentRef}>
                {/* Cabeçalho */}
                <div className="op-header">
                    <div className="op-header-logo">
                        {logoMarcenaria
                            ? <img src={logoMarcenaria} alt="Logo" className="op-logo" />
                            : <span className="op-marcenaria-nome">{nomeMarcenaria}</span>
                        }
                    </div>
                    <div className="op-header-titulo">
                        <h1 className="op-titulo">ORDEM DE PRODUÇÃO</h1>
                        <span className="op-numero">OP-{numeroOP}</span>
                    </div>
                    <div className="op-header-data">
                        <span className="op-data-label">Data</span>
                        <span className="op-data-valor">{dataFormatada}</span>
                    </div>
                </div>

                <hr className="op-divisor" />

                {/* Dados do projeto */}
                <div className="op-secao">
                    <h2 className="op-secao-titulo">Dados do Projeto</h2>
                    <div className="op-grid-info">
                        <div className="op-info-item">
                            <span className="op-info-label">Cliente</span>
                            <span className="op-info-valor">{orc.cliente?.nome}</span>
                        </div>
                        {orc.cliente?.telefone && (
                            <div className="op-info-item">
                                <span className="op-info-label">Telefone</span>
                                <span className="op-info-valor">{orc.cliente.telefone}</span>
                            </div>
                        )}
                        <div className="op-info-item">
                            <span className="op-info-label">Projeto</span>
                            <span className="op-info-valor">{orc.titulo}</span>
                        </div>
                        {orc.ambiente && (
                            <div className="op-info-item">
                                <span className="op-info-label">Ambiente</span>
                                <span className="op-info-valor">{orc.ambiente}</span>
                            </div>
                        )}
                        {orc.medidas && (
                            <div className="op-info-item">
                                <span className="op-info-label">Medidas</span>
                                <span className="op-info-valor">{orc.medidas}</span>
                            </div>
                        )}
                        {orc.prazo && (
                            <div className="op-info-item">
                                <span className="op-info-label">Prazo</span>
                                <span className="op-info-valor">{orc.prazo}</span>
                            </div>
                        )}
                        <div className="op-info-item">
                            <span className="op-info-label">Status</span>
                            <span className="op-info-valor">{orc.status}</span>
                        </div>
                        <div className="op-info-item">
                            <span className="op-info-label">Valor Total</span>
                            <span className="op-info-valor op-valor-destaque">{formatarMoeda(orc.totalFinal)}</span>
                        </div>
                    </div>
                </div>

                <hr className="op-divisor" />

                {/* Lista de materiais */}
                <div className="op-secao">
                    <h2 className="op-secao-titulo">Materiais Necessários</h2>
                    {(orc.materiais ?? []).length === 0 ? (
                        <p className="op-vazio">Nenhum material cadastrado.</p>
                    ) : (
                        <table className="op-tabela">
                            <thead>
                                <tr>
                                    <th>Material</th>
                                    <th className="op-col-num">Qtd</th>
                                    <th className="op-col-num">Valor Unit.</th>
                                    <th className="op-col-num">Total</th>
                                    <th className="op-col-check">Separado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(orc.materiais ?? []).map((mat, i) => (
                                    <tr key={i}>
                                        <td>{mat.nome}</td>
                                        <td className="op-col-num">{mat.quantidade}</td>
                                        <td className="op-col-num">{formatarMoeda(mat.valor)}</td>
                                        <td className="op-col-num">{formatarMoeda(mat.valor * mat.quantidade)}</td>
                                        <td className="op-col-check"><span className="op-checkbox" /></td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3} className="op-total-label">Total de Materiais</td>
                                    <td className="op-col-num op-total-valor">{formatarMoeda(totalMateriais)}</td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>

                {/* Observações */}
                {orc.observacoes && (
                    <>
                        <hr className="op-divisor" />
                        <div className="op-secao">
                            <h2 className="op-secao-titulo">Observações</h2>
                            <p className="op-observacoes">{orc.observacoes}</p>
                        </div>
                    </>
                )}

                {/* Assinaturas */}
                <div className="op-assinaturas">
                    <div className="op-assinatura-item">
                        <div className="op-assinatura-linha" />
                        <span>Responsável pela Produção</span>
                    </div>
                    <div className="op-assinatura-item">
                        <div className="op-assinatura-linha" />
                        <span>Conferência / Qualidade</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
