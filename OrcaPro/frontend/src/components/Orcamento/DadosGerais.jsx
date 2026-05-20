import { useState } from 'react';

const AMBIENTES_PADRAO = [
    'Cozinha', 'Quarto', 'Sala', 'Banheiro', 'Escritório',
    'Lavanderia', 'Varanda', 'Área de Serviço', 'Garagem'
];

export default function DadosGerais({ orcamento, clientes, onChange }) {
    const isCustom = orcamento.ambiente && !AMBIENTES_PADRAO.includes(orcamento.ambiente);
    const [usandoOutros, setUsandoOutros] = useState(isCustom);

    const handleAmbienteChange = (e) => {
        if (e.target.value === 'Outros') {
            setUsandoOutros(true);
            onChange({ target: { name: 'ambiente', value: '' } });
        } else {
            setUsandoOutros(false);
            onChange(e);
        }
    };

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
                    <select name="ambiente" value={usandoOutros ? 'Outros' : (orcamento.ambiente || '')} onChange={handleAmbienteChange}>
                        <option value="">Selecione um ambiente...</option>
                        {AMBIENTES_PADRAO.map(amb => <option key={amb} value={amb}>{amb}</option>)}
                        <option value="Outros">Outros...</option>
                    </select>
                    {usandoOutros && (
                        <input
                            type="text"
                            name="ambiente"
                            value={orcamento.ambiente}
                            onChange={onChange}
                            placeholder="Descreva o ambiente..."
                            style={{ marginTop: '8px' }}
                            autoFocus
                        />
                    )}
                </section>
                <section className="form-section">
                    <label>Tipo de Móvel</label>
                    <input type="text" name="tipoMovel" value={orcamento.tipoMovel} onChange={onChange} />
                </section>
            </div>
        </div>
    );
}