export default function DadosGerais({ orcamento, clientes, onChange }) {
    return (
        <div className="cliente-card highlight-primary">
            <h3>1. Dados Gerais</h3>
            <section className="form-section">
                <label>Título do Orçamento *</label>
                <input type="text" name="titulo" value={orcamento.titulo} onChange={onChange} placeholder="Ex: Cozinha Planejada Dona Maria" required />
            </section>
            <section className="form-section">
                <label>Cliente *</label>
                <select name="clienteId" value={orcamento.clienteId} onChange={onChange} required>
                    <option value="">Selecione um cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
            </section>
            <div className="form-grid-1-1">
                <section className="form-section">
                    <label>Ambiente</label>
                    <input type="text" name="ambiente" value={orcamento.ambiente} onChange={onChange} />
                </section>
                <section className="form-section">
                    <label>Tipo de Móvel</label>
                    <input type="text" name="tipoMovel" value={orcamento.tipoMovel} onChange={onChange} />
                </section>
            </div>
        </div>
    );
}