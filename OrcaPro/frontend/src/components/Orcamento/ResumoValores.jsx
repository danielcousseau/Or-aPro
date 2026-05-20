export default function ResumoValores({ orcamento, totais, formasPagamento, onChange }) {
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
                            <input type="text" name="maoDeObraValor" value={orcamento.maoDeObraValor} onChange={onChange} onFocus={(e) => e.target.select()} placeholder="R$ 0,00" />
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
                            <input type="text" name="lucroValor" value={orcamento.lucroValor} onChange={onChange} onFocus={(e) => e.target.select()} placeholder="R$ 0,00" />
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
                    <h2 style={{ fontWeight: 'bold' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totais.materiais)}</h2>
                </div>
                <div className="dashboard-card">
                    <span className="dashboard-label">Mão de Obra</span>
                    <h2 style={{ fontWeight: 'bold' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totais.maoDeObra)}</h2>
                </div>
                <div className="dashboard-card">
                    <span className="dashboard-label">Lucro</span>
                    <h2 style={{ fontWeight: 'bold' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totais.lucro)}</h2>
                </div>
                <div className="dashboard-card highlight-primary">
                    <span className="dashboard-label">Total do Orçamento</span>
                    <h2 className="text-primary" style={{ fontWeight: 'bold', fontSize: '1.8rem' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totais.final)}</h2>
                </div>
            </div>

            <div className="cliente-card highlight-success">
                <h3>4. Condições Comerciais e Detalhes Finais</h3>
                <div className="form-grid-3">
                    <section className="form-section">
                        <label>Forma de Pagamento</label>
                        <input type="text" name="pagamento" list="lista-pagamentos" value={orcamento.pagamento} onChange={onChange} placeholder="Selecione ou digite..." />
                        <datalist id="lista-pagamentos">
                            {formasPagamento.map(fp => <option key={fp.id} value={fp.nome} />)}
                            {/* Sugestões padrão do mercado caso o banco de dados esteja vazio */}
                            <option value="À vista (Pix ou Dinheiro)" />
                            <option value="50% na Assinatura + 50% na Entrega" />
                            <option value="30% Entrada + 30% Início Produção + 40% Instalação" />
                            <option value="Cartão de Crédito em até 12x (Com juros da maquininha)" />
                            <option value="Boleto Bancário (Sujeito a aprovação de crédito)" />
                        </datalist>
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
                    <textarea name="observacoes" value={orcamento.observacoes} onChange={onChange} rows="3" placeholder="Garantia, condições de instalação, etc..."></textarea>
                </section>
            </div>
        </>
    );
}