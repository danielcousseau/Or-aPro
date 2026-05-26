import { forwardRef } from 'react';
import { formatarMoeda } from '../utils/format';
import { Orcamento } from '../types';

interface Props {
    orcamento: Orcamento;
    modo: 'interno' | 'cliente';
    numero?: string | number;
    nomeMarcenaria?: string;
    logoMarcenaria?: string | null;
}

const DocumentoOrcamento = forwardRef<HTMLDivElement, Props>(
    ({ orcamento, modo, numero, nomeMarcenaria, logoMarcenaria }, ref) => {
        const dataFormatada = new Date(orcamento.createdAt).toLocaleDateString('pt-BR');
        const nomeExibicao = nomeMarcenaria || 'Marcenaria';
        const logoSrc = logoMarcenaria || '/logo-orcapro.png';

        return (
            <div ref={ref} className="doc-page">
                {/* Cabeçalho */}
                <header className="doc-header">
                    <img src={logoSrc} alt="Logo" className="doc-logo" />
                    <div className="doc-header-right">
                        <p className="doc-marcenaria">{nomeExibicao}</p>
                        {modo === 'interno' && numero != null && (
                            <p className="doc-subtitulo">Orçamento #{numero}</p>
                        )}
                        {modo === 'cliente' && (
                            <p className="doc-subtitulo">Proposta Comercial</p>
                        )}
                        <p className="doc-data">Data: {dataFormatada}</p>
                    </div>
                </header>

                {/* Saudação — apenas na proposta para o cliente */}
                {modo === 'cliente' && (
                    <div className="doc-saudacao">
                        <p>Olá, <strong>{orcamento.cliente?.nome}</strong>! Preparamos o orçamento para o seu projeto <strong>{orcamento.titulo}</strong>.</p>
                    </div>
                )}

                {/* Grid de dados */}
                <div className="doc-grid">
                    <section className="doc-section">
                        <h4>Dados do Cliente</h4>
                        <p><strong>Nome:</strong> {orcamento.cliente?.nome || '-'}</p>
                        <p><strong>Telefone:</strong> {orcamento.cliente?.telefone || '-'}</p>
                        <p><strong>Cidade:</strong> {orcamento.cliente?.cidade || '-'}</p>
                    </section>
                    <section className="doc-section">
                        <h4>Dados do Projeto</h4>
                        <p><strong>Título:</strong> {orcamento.titulo}</p>
                        <p><strong>Ambiente:</strong> {orcamento.ambiente || '-'}</p>
                        <p><strong>Móvel:</strong> {orcamento.tipoMovel || '-'}</p>
                    </section>
                </div>

                {/* Resumo financeiro */}
                <div className="doc-total-box">
                    <div className="doc-total-detalhes">
                        <p><strong>Prazo de entrega:</strong> {orcamento.prazo || 'A combinar'}</p>
                        <p><strong>Forma de pagamento:</strong> {orcamento.pagamento || 'A combinar'}</p>
                    </div>
                    <div className="doc-total-valor-area">
                        <span className="doc-total-label">Investimento Total</span>
                        <span className="doc-total-valor">{formatarMoeda(orcamento.totalFinal)}</span>
                    </div>
                </div>

                {/* Rodapé */}
                <footer className="doc-footer">
                    {orcamento.observacoes && (
                        <p><strong>Observações:</strong> {orcamento.observacoes}</p>
                    )}
                    <p>Esta proposta é válida por <strong>{orcamento.validade || '7 dias'}</strong>.</p>
                </footer>
            </div>
        );
    }
);

DocumentoOrcamento.displayName = 'DocumentoOrcamento';
export default DocumentoOrcamento;
