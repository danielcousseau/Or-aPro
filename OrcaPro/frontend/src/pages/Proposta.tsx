import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Orcamento } from '../types';
import DocumentoOrcamento from '../components/DocumentoOrcamento';

export default function Proposta() {
    const { token } = useParams<{ token: string }>();
    const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
    const [erro, setErro] = useState('');
    const [gerando, setGerando] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        api.get(`/orcamentos/proposta/${token}`)
            .then(res => setOrcamento(res.data))
            .catch(() => setErro('Este link é inválido, expirou ou o orçamento foi removido.'));
    }, [token]);

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

    const baixarPDF = async () => {
        setGerando(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const titulo = orcamento?.titulo?.replace(/\s+/g, '_') || 'Proposta';
            await html2pdf().set({
                margin: [10, 10, 10, 10],
                filename: `Proposta_${titulo}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: 'avoid-all' }
            }).from(contentRef.current).save();
        } finally {
            setGerando(false);
        }
    };

    if (!orcamento) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Carregando proposta...</p>;

    return (
        <div className="doc-wrapper">
            <div className="doc-toolbar no-print" style={{ justifyContent: 'center' }}>
                <button onClick={() => window.print()} style={{ background: '#27ae60', color: '#fff' }}>Imprimir</button>
                <button onClick={baixarPDF} disabled={gerando} style={{ background: '#2980b9', color: '#fff', opacity: gerando ? 0.7 : 1 }}>
                    {gerando ? 'Gerando...' : 'Baixar PDF'}
                </button>
            </div>

            <DocumentoOrcamento
                ref={contentRef}
                orcamento={orcamento}
                modo="cliente"
            />
        </div>
    );
}
