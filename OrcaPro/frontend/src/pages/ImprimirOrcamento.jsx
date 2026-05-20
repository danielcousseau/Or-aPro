import { useState, useEffect, useRef } from 'react';
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
    const printRef = useRef(null);

    useEffect(() => {
        // Busca o orçamento atual e a lista de todos os orçamentos do usuário simultaneamente
        Promise.all([
            api.get(`/orcamentos/${id}`),
            api.get('/orcamentos')
        ])
            .then(([resOrc, resTodos]) => {
                setOrc(resOrc.data);
                
                // MÁGICA: Calcula qual é o número real deste orçamento para o usuário (1, 2, 3...)
                // Ordena do mais antigo para o mais novo e acha a posição dele na lista
                const listaCrescente = resTodos.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                const index = listaCrescente.findIndex(o => o.id === Number(id));
                setNumeroLocal(index !== -1 ? index + 1 : id);
            })
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
            document.title = `Orcamento_${numeroLocal || orc.id}_${nomeClienteFormatado}`;
            
            return () => { document.title = tituloOriginal; }; // Restaura ao sair da página
        }
    }, [orc, numeroLocal]);

    if (erro) return <p style={{ padding: '20px', color: '#e74c3c' }}>Erro ao carregar o orçamento. Verifique se ele existe ou se tem permissões de acesso.</p>;
    if (!orc) return <p style={{ padding: '20px' }}>Carregando orçamento...</p>;

    const baixarPDF = async () => {
        setGerando(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const nomeCliente = orc.cliente.nome.replace(/\s+/g, '_');
            await html2pdf().set({
                margin: 10,
                filename: `Orcamento_${numeroLocal || orc.id}_${nomeCliente}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(printRef.current).save();
        } finally {
            setGerando(false);
        }
    };

    // [UX] Função para formatar a mensagem e abrir o WhatsApp com o Link Seguro
    const enviarWhatsApp = async () => {
        if (!orc.cliente.telefone) {
            toast.warn("Este cliente não possui um telefone cadastrado.");
            return;
        }
        
        try {
            // 1. Solicita ao backend um Token Criptografado
            const response = await api.post(`/orcamentos/${orc.id}/link-publico`);
            const token = response.data.token;
            
            // 2. Monta o link mágico que o cliente vai clicar.
            // [Inteligência] Se você clicar pelo PC local (localhost), ele força o envio do link da web!
            const baseUrl = window.location.hostname === 'localhost' 
                ? 'https://orca-pro-seven.vercel.app/' // 
                : window.location.origin;
            const linkProposta = `${baseUrl}/proposta/${token}`;

            let telefoneFormatado = orc.cliente.telefone.replace(/\D/g, ''); // Limpa traços e parênteses
            if (telefoneFormatado.length === 10 || telefoneFormatado.length === 11) {
                telefoneFormatado = '55' + telefoneFormatado; // Adiciona o DDI do Brasil caso não tenha
            }

            const mensagem = `Olá, *${orc.cliente.nome}*!\n\nAqui é da Marcenaria. Finalizamos o seu orçamento para o projeto *${orc.titulo}*.\n\nVocê pode visualizar os detalhes de forma segura através deste link exclusivo:\n🔗 ${linkProposta}\n\nQualquer dúvida, estou à disposição!`;
            window.open(`https://wa.me/${telefoneFormatado}?text=${encodeURIComponent(mensagem)}`, '_blank');
        } catch (error) {
            toast.error("Erro ao gerar link seguro para envio.");
        }
    };

    return (
        <div className="print-container">
            {/* Botões que somem na hora de imprimir */}
            <div className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '10px', padding: '20px' }}>
                <button onClick={() => window.print()} style={{ background: '#27ae60' }}>🖨️ Imprimir</button>
                <button onClick={baixarPDF} disabled={gerando} style={{ background: '#2980b9' }}>{gerando ? 'Gerando...' : 'Baixar PDF'}</button>
                <button onClick={enviarWhatsApp} style={{ background: '#25D366', color: '#fff' }}>💬 Enviar WhatsApp</button>
                <button onClick={() => navigate('/historico')} style={{ background: '#7f8c8d' }}>Voltar</button>
            </div>

            <div className="print-page" ref={printRef}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
                    <div>
                        <img src="/logo-orcapro.png" alt="Logo da Empresa" style={{ maxWidth: '250px', height: 'auto' }} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ margin: 0 }}>Orçamento #{numeroLocal || orc.id}</h2>
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

                <section style={{ marginTop: '30px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-block', minWidth: '250px', border: '2px solid #333', padding: '15px', borderRadius: '8px' }}>
                        <p style={{ margin: '5px 0' }}>Prazo: <strong>{orc.prazo || 'A combinar'}</strong></p>
                        <p style={{ margin: '5px 0' }}>Pagamento: <strong>{orc.pagamento || 'A combinar'}</strong></p>
                        <h2 style={{ margin: '10px 0 0 0', color: '#27ae60' }}>Total: {formatarMoeda(orc.totalFinal)}</h2>
                    </div>
                </section>

                <footer style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #eee', fontSize: '0.8rem', color: '#777' }}>
                    <p>Este orçamento é válido por {orc.validade || '7 dias'}.</p>
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