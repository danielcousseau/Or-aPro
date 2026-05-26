import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Orcamento, User } from '../types';
import DocumentoOrcamento from '../components/DocumentoOrcamento';

export default function ImprimirOrcamento() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [orc, setOrc] = useState<Orcamento | null>(null);
    const [erro, setErro] = useState(false);
    const [numeroLocal, setNumeroLocal] = useState<string | number>('');
    const [gerando, setGerando] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const userStorage = JSON.parse(localStorage.getItem('@OrcaPro:user') || '{}') as User;
    const nomeMarcenaria = userStorage.nomeMarcenaria;
    const logoMarcenaria = userStorage.logoMarcenaria;

    useEffect(() => {
        Promise.all([
            api.get(`/orcamentos/${id}`),
            api.get('/orcamentos')
        ])
            .then(([resOrc, resTodos]) => {
                setOrc(resOrc.data);
                const listaCrescente: Orcamento[] = resTodos.data.sort(
                    (a: Orcamento, b: Orcamento) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                const index = listaCrescente.findIndex(o => o.id === Number(id));
                setNumeroLocal(index !== -1 ? index + 1 : id ?? '');
            })
            .catch(err => {
                console.error("Erro ao carregar orçamento para impressão:", err);
                setErro(true);
            });
    }, [id]);

    useEffect(() => {
        if (orc) {
            const tituloOriginal = document.title;
            const nomeClienteFormatado = orc.cliente?.nome.replace(/\s+/g, '_') ?? '';
            document.title = `Orcamento_${numeroLocal || orc.id}_${nomeClienteFormatado}`;
            return () => { document.title = tituloOriginal; };
        }
    }, [orc, numeroLocal]);

    if (erro) return <p style={{ padding: '20px', color: '#e74c3c' }}>Erro ao carregar o orçamento.</p>;
    if (!orc) return <p style={{ padding: '20px' }}>Carregando orçamento...</p>;

    const baixarPDF = async () => {
        setGerando(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const nomeCliente = orc.cliente?.nome.replace(/\s+/g, '_') ?? '';
            await html2pdf().set({
                margin: [10, 10, 10, 10],
                filename: `Orcamento_${numeroLocal || id}_${nomeCliente}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: 'avoid-all' }
            }).from(contentRef.current).save();
        } catch {
            toast.error('Erro ao gerar o PDF. Tente novamente.');
        } finally {
            setGerando(false);
        }
    };

    const enviarWhatsApp = async () => {
        if (!orc.cliente?.telefone) {
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

            const identificacao = nomeMarcenaria ? `da ${nomeMarcenaria}` : 'da Marcenaria';
            const mensagem = `Olá, *${orc.cliente.nome.trim()}*!\n\nAqui é ${identificacao}. Finalizamos o seu orçamento para o projeto *${orc.titulo.trim()}*.\n\nVocê pode visualizar os detalhes de forma segura através deste link exclusivo:\n${linkProposta}\n\nQualquer dúvida, estou à disposição!`;
            window.open(`https://wa.me/${telefoneFormatado}?text=${encodeURIComponent(mensagem)}`, '_blank');
        } catch {
            toast.error("Erro ao gerar link seguro para envio.");
        }
    };

    return (
        <div className="doc-wrapper">
            <div className="doc-toolbar no-print">
                <button onClick={() => window.print()} style={{ background: '#27ae60', color: '#fff' }}>Imprimir</button>
                <button onClick={baixarPDF} disabled={gerando} style={{ background: '#2980b9', color: '#fff', opacity: gerando ? 0.7 : 1 }}>
                    {gerando ? 'Gerando...' : 'Baixar PDF'}
                </button>
                <button onClick={enviarWhatsApp} style={{ background: '#25D366', color: '#fff' }}>WhatsApp</button>
                <button onClick={() => navigate('/historico')} style={{ background: '#7f8c8d', color: '#fff' }}>Voltar</button>
            </div>

            <DocumentoOrcamento
                ref={contentRef}
                orcamento={orc}
                modo="interno"
                numero={numeroLocal}
                nomeMarcenaria={nomeMarcenaria}
                logoMarcenaria={logoMarcenaria}
            />
        </div>
    );
}
