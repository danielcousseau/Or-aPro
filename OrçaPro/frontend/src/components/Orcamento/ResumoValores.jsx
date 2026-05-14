export default function ResumoValores({ orcamento, totais, formasPagamento, onChange }) {
    return (
        <>
            <div className="cliente-card">
                <h3>3. Precificação</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label>Mão de Obra</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <select name="tipoMaoDeObra" value={orcamento.tipoMaoDeObra} onChange={onChange}>
                                <option value="porcentagem">% sobre material</option>
                                <option value="fixo">Valor Fixo (R$)</option>
                            </select>
                            <input type="number" name="maoDeObraValor" value={orcamento.maoDeObraValor} onChange={onChange} onFocus={(e) => e.target.select()} />
                        </div>
                    </div>
                    <div>
                        <label>Lucro</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <select name="tipoLucro" value={orcamento.tipoLucro} onChange={onChange}>
                                <option value="porcentagem">% sobre total</option>
                                <option value="fixo">Valor Fixo (R$)</option>
                            </select>
                            <input type="number" name="lucroValor" value={orcamento.lucroValor} onChange={onChange} onFocus={(e) => e.target.select()} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-card">
                    <span className="dashboard-label">Custo Materiais</span>
                    <h2>R$ {totais.materiais.toFixed(2)}</h2>
                </div>
                <div className="dashboard-card">
                    <span className="dashboard-label">Mão de Obra</span>
                    <h2>R$ {totais.maoDeObra.toFixed(2)}</h2>
                </div>
                <div className="dashboard-card">
                    <span className="dashboard-label">Lucro</span>
                    <h2>R$ {totais.lucro.toFixed(2)}</h2>
                </div>
                <div className="dashboard-card highlight-primary">
                    <span className="dashboard-label">Total do Orçamento</span>
                    <h2 className="text-primary">R$ {totais.final.toFixed(2)}</h2>
                </div>
            </div>

            <div className="cliente-card highlight-success">
                <h3>4. Condições Comerciais e Detalhes Finais</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <section className="form-section">
                        <label>Forma de Pagamento</label>
                        <input type="text" name="pagamento" list="lista-pagamentos" value={orcamento.pagamento} onChange={onChange} placeholder="Selecione ou digite..." />
                        <datalist id="lista-pagamentos">
                            {formasPagamento.map(fp => <option key={fp.id} value={fp.nome} />)}
                        </datalist>
                    </section>
                    <section className="form-section">
                        <label>Prazo de Entrega</label>
                        <input type="text" name="prazo" value={orcamento.prazo} onChange={onChange} placeholder="Ex: 15 dias úteis" />
                    </section>
                    <section className="form-section">
                        <label>Validade do Orçamento</label>
                        <input type="text" name="validade" value={orcamento.validade} onChange={onChange} placeholder="Ex: 7 dias" />
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