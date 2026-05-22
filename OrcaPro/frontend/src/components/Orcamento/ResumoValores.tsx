import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { OrcamentoFormData, Totais, FormaPagamento } from '../../types';

type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
type FakeEvent = { target: { name: string; value: string } };

interface Props {
    orcamento: OrcamentoFormData;
    totais: Totais;
    formasPagamento: FormaPagamento[];
    onChange: (e: ChangeEvent | FakeEvent) => void;
}

const PAGAMENTOS_PADRAO = [
    'À vista (Pix ou Dinheiro)',
    '50% na Assinatura + 50% na Entrega',
    '30% Entrada + 30% Produção + 40% Instalação',
    'Cartão de Crédito (com juros da maquininha)',
    'Boleto Bancário',
];

const PLACEHOLDER_VALOR: Record<string, string> = {
    porcentagem:    'Ex: 15 (%)',
    fixo:           'R$ 0,00',
    multiplicador:  'Ex: 1.5 (×)',
    diaria:         'R$ 0,00 / dia',
    hora:           'R$ 0,00 / hora',
    metro_linear:   'R$ 0,00 / m',
    metro_quadrado: 'R$ 0,00 / m²',
};

export default function ResumoValores({ orcamento, totais, formasPagamento, onChange }: Props) {
    const [opcoesCustomizadas, setOpcoesCustomizadas] = useState<string[]>([]);

    useEffect(() => {
        api.get('/opcoes-customizadas?tipo=pagamento')
            .then(r => setOpcoesCustomizadas(r.data.map((o: { nome: string }) => o.nome)))
            .catch(() => {});
    }, []);

    const opcoesExtras = formasPagamento
        .map(fp => fp.nome)
        .filter(nome => !PAGAMENTOS_PADRAO.includes(nome));
    const todasOpcoes = [
        ...PAGAMENTOS_PADRAO,
        ...opcoesExtras,
        ...opcoesCustomizadas.filter(o => !PAGAMENTOS_PADRAO.includes(o) && !opcoesExtras.includes(o))
    ];

    const isCustom = Boolean(orcamento.pagamento && !todasOpcoes.includes(orcamento.pagamento));
    const [usandoOutros, setUsandoOutros] = useState(isCustom);
    const [salvarComoFixo, setSalvarComoFixo] = useState(false);

    useEffect(() => {
        if (opcoesCustomizadas.length > 0 && orcamento.pagamento) {
            const all = [...PAGAMENTOS_PADRAO, ...opcoesCustomizadas];
            if (all.includes(orcamento.pagamento)) setUsandoOutros(false);
        }
    }, [opcoesCustomizadas, orcamento.pagamento]);

    const handlePagamentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === 'Outros') {
            setUsandoOutros(true);
            setSalvarComoFixo(false);
            onChange({ target: { name: 'pagamento', value: '' } });
        } else {
            setUsandoOutros(false);
            setSalvarComoFixo(false);
            onChange(e);
        }
    };

    const handleTextoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSalvarComoFixo(false);
        onChange(e);
    };

    const handleSalvarComoFixo = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setSalvarComoFixo(checked);
        const pagamentoAtual = String(orcamento.pagamento ?? '');
        if (checked && pagamentoAtual.trim()) {
            try {
                await api.post('/opcoes-customizadas', { tipo: 'pagamento', nome: pagamentoAtual.trim() });
                setOpcoesCustomizadas(prev => [...new Set([...prev, pagamentoAtual.trim()])]);
                toast.success(`"${pagamentoAtual}" salvo como opção fixa!`);
            } catch {
                setSalvarComoFixo(false);
                toast.error('Erro ao salvar opção.');
            }
        }
    };

    const fmt = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

    return (
        <>
            <div className="cliente-card">
                <h3>3. Precificação</h3>
                <div className="form-grid-1-1">
                    <div>
                        <label>Mão de Obra</label>
                        <div className="input-group-flex">
                            <select name="tipoMaoDeObra" value={orcamento.tipoMaoDeObra} onChange={onChange}>
                                <option value="porcentagem">Porcentagem (%)</option>
                                <option value="fixo">Valor Fixo (R$)</option>
                                <option value="multiplicador">Multiplicado por (x)</option>
                                <option value="diaria">Por Dia</option>
                                <option value="hora">Por Hora</option>
                                <option value="metro_linear">Por Metro Linear</option>
                                <option value="metro_quadrado">Por Metro Quadrado</option>
                            </select>
                            <input type="text" name="maoDeObraValor" value={orcamento.maoDeObraValor} onChange={onChange} onFocus={(e) => e.target.select()} placeholder={PLACEHOLDER_VALOR[orcamento.tipoMaoDeObra] || 'R$ 0,00'} />
                        </div>
                        {['diaria', 'hora', 'metro_linear', 'metro_quadrado'].includes(orcamento.tipoMaoDeObra) && (
                            <div style={{ marginTop: '10px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-soft)' }}>Quantidade (Dias / Horas / Metros)</label>
                                <input
                                    type="number"
                                    name="maoDeObraQtde"
                                    value={orcamento.maoDeObraQtde || ''}
                                    onChange={onChange}
                                    placeholder="Ex: 5"
                                    min="1"
                                    onFocus={(e) => e.target.select()}
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <label>Lucro</label>
                        <div className="input-group-flex">
                            <select name="tipoLucro" value={orcamento.tipoLucro} onChange={onChange}>
                                <option value="porcentagem">% sobre total</option>
                                <option value="fixo">Valor Fixo (R$)</option>
                                <option value="multiplicador">Multiplicado por (x)</option>
                                <option value="diaria">Por Dia</option>
                                <option value="hora">Por Hora</option>
                            </select>
                            <input type="text" name="lucroValor" value={orcamento.lucroValor} onChange={onChange} onFocus={(e) => e.target.select()} placeholder={PLACEHOLDER_VALOR[orcamento.tipoLucro] || 'R$ 0,00'} />
                        </div>
                        {['diaria', 'hora'].includes(orcamento.tipoLucro) && (
                            <div style={{ marginTop: '10px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-soft)' }}>Quantidade (Dias / Horas)</label>
                                <input
                                    type="number"
                                    name="lucroQtde"
                                    value={orcamento.lucroQtde || ''}
                                    onChange={onChange}
                                    placeholder="Ex: 5"
                                    min="1"
                                    onFocus={(e) => e.target.select()}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-card">
                    <span className="dashboard-label">Custo Materiais</span>
                    <h2 style={{ fontWeight: 'bold' }}>{fmt(totais.materiais)}</h2>
                </div>
                <div className="dashboard-card">
                    <span className="dashboard-label">Mão de Obra</span>
                    <h2 style={{ fontWeight: 'bold' }}>{fmt(totais.maoDeObra)}</h2>
                </div>
                <div className="dashboard-card">
                    <span className="dashboard-label">Lucro</span>
                    <h2 style={{ fontWeight: 'bold' }}>{fmt(totais.lucro)}</h2>
                </div>
                <div className="dashboard-card highlight-primary">
                    <span className="dashboard-label">Total do Orçamento</span>
                    <h2 className="text-primary" style={{ fontWeight: 'bold', fontSize: '1.8rem' }}>{fmt(totais.final)}</h2>
                </div>
            </div>

            <div className="cliente-card highlight-success">
                <h3>4. Condições Comerciais e Detalhes Finais</h3>
                <div className="form-grid-3">
                    <section className="form-section">
                        <label>Forma de Pagamento</label>
                        <select name="pagamento" value={usandoOutros ? 'Outros' : (orcamento.pagamento || '')} onChange={handlePagamentoChange}>
                            <option value="">Selecione a forma de pagamento...</option>
                            {todasOpcoes.map(op => <option key={op} value={op}>{op}</option>)}
                            <option value="Outros">[ + ] Outro (Digitar manualmente)</option>
                        </select>
                        {usandoOutros && (
                            <>
                                <input
                                    type="text"
                                    name="pagamento"
                                    value={orcamento.pagamento}
                                    onChange={handleTextoChange}
                                    placeholder="Descreva a forma de pagamento..."
                                    style={{ marginTop: '8px' }}
                                    autoFocus
                                />
                                {String(orcamento.pagamento ?? '').trim() && (
                                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '8px', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-soft)' }}>
                                        <input
                                            type="checkbox"
                                            checked={salvarComoFixo}
                                            onChange={handleSalvarComoFixo}
                                            style={{ width: '16px', height: '16px', marginTop: '2px', flexShrink: 0, cursor: 'pointer' }}
                                        />
                                        Salvar "{orcamento.pagamento}" como opção fixa
                                    </label>
                                )}
                            </>
                        )}
                    </section>
                    <section className="form-section">
                        <label>Prazo de Entrega</label>
                        <select name="prazo" value={orcamento.prazo} onChange={onChange}>
                            <option value="">Selecione o prazo...</option>
                            <option value="Pronta Entrega">Pronta Entrega</option>
                            <option value="7 dias úteis">7 dias úteis</option>
                            <option value="15 dias úteis">15 dias úteis</option>
                            <option value="30 dias úteis">30 dias úteis</option>
                            <option value="45 dias úteis">45 dias úteis</option>
                            <option value="60 dias úteis">60 dias úteis</option>
                        </select>
                    </section>
                    <section className="form-section">
                        <label>Validade do Orçamento</label>
                        <select name="validade" value={orcamento.validade} onChange={onChange}>
                            <option value="">Selecione a validade...</option>
                            <option value="5 dias">5 dias</option>
                            <option value="7 dias">7 dias</option>
                            <option value="10 dias">10 dias</option>
                            <option value="15 dias">15 dias</option>
                            <option value="30 dias">30 dias</option>
                        </select>
                    </section>
                </div>
                <section className="form-section" style={{ marginTop: '15px' }}>
                    <label>Observações Adicionais</label>
                    <textarea name="observacoes" value={orcamento.observacoes} onChange={onChange} rows={3} placeholder="Garantia, condições de instalação, etc..."></textarea>
                </section>
            </div>
        </>
    );
}
