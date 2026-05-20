import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { formatarMoeda } from '../utils/format';

export default function Proposta() {
    const { token } = useParams();
    const [orcamento, setOrcamento] = useState(null);
    const [erro, setErro] = useState('');
    const [gerando, setGerando] = useState(false);
    const contentRef = useRef(null);

    useEffect(() => {
        api.get(`/orcamentos/proposta/${token}`)
            .then(res => setOrcamento(res.data))
            .catch(err => setErro('Este link é inválido, expirou ou o orçamento foi removido.'));
    }, [token]);

    // [SecOps] Tratamento de erros seguro. Se o token vencer, o cliente vê uma tela amigável
    if (erro) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f4f4' }}>
                <div style={{ background: '#fff', padding: '40px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ color: '#e74c3c' }}>Oops!</h2>
                    <p>{erro}</p>
                </div>
            </div>
        );
    }

    const baixarPDF = async () => {
        setGerando(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const titulo = orcamento.titulo?.replace(/\s+/g, '_') || 'Proposta';
            await html2pdf().set({
                margin: 10,
                filename: `Proposta_${titulo}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(contentRef.current).save();
        } finally {
            setGerando(false);
        }
    };

    if (!orcamento) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Carregando proposta segura...</p>;

    return (
        <div style={{ background: '#f9f9f9', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
            <div ref={contentRef} style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                
                <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #f0f0f0', paddingBottom: '20px' }}>
                    <img src="/logo-orcapro.png" alt="Logo" style={{ maxHeight: '60px', marginBottom: '15px' }} />
                    <h1 style={{ color: '#333', margin: 0 }}>Proposta Comercial</h1>
                    <p style={{ color: '#777', margin: '5px 0 0 0' }}>Data: {new Date(orcamento.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ color: 'var(--primary)', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Olá, {orcamento.cliente?.nome}!</h3>
                    <p>Abaixo estão os detalhes do seu projeto de <strong>{orcamento.titulo}</strong>.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ background: '#f4f7f6', padding: '15px', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 5px', fontSize: '0.9rem', color: '#666' }}>Ambiente / Tipo</p>
                        <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{orcamento.ambiente || '-'} / {orcamento.tipoMovel || '-'}</p>
                    </div>
                    <div style={{ background: '#f4f7f6', padding: '15px', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 5px', fontSize: '0.9rem', color: '#666' }}>Prazo de Entrega</p>
                        <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{orcamento.prazo || 'A combinar'}</p>
                    </div>
                </div>

                <div style={{ background: '#eaf4eb', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #27ae60', marginBottom: '30px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#27ae60' }}>Investimento Total</h3>
                    <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', color: '#333' }}>{formatarMoeda(orcamento.totalFinal)}</h1>
                    <p style={{ margin: 0, color: '#555' }}><strong>Condições de Pagamento:</strong> {orcamento.pagamento || 'A combinar'}</p>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ color: '#555', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Observações e Validade</h4>
                    <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{orcamento.observacoes || 'Sem observações adicionais.'}</p>
                    <p style={{ color: '#999', fontSize: '0.8rem', marginTop: '10px' }}>Esta proposta é válida por {orcamento.validade || '7 dias'}.</p>
                </div>

                <div style={{ textAlign: 'center', marginTop: '40px', display: 'flex', gap: '12px', justifyContent: 'center' }} className="no-print">
                    <button onClick={() => window.print()} style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(39, 174, 96, 0.3)' }}>
                        🖨️ Imprimir
                    </button>
                    <button onClick={baixarPDF} disabled={gerando} style={{ background: '#2980b9', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold', opacity: gerando ? 0.7 : 1 }}>
                        {gerando ? 'Gerando...' : 'Baixar PDF'}
                    </button>
                </div>
            </div>
            <style>{`
                @media print { 
                    @page { margin: 0; } /* Remove data, localhost e título automático do navegador */
                    body { 
                        background: white !important; 
                        padding: 15mm; /* Dá um respiro para o texto não colar na borda física do papel */
                        -webkit-print-color-adjust: exact; /* Força o navegador a imprimir os fundos coloridos (ex: box verde) */
                    } 
                    .no-print { display: none !important; } 
                }
            `}</style>
        </div>
    );
}