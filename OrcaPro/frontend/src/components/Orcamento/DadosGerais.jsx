import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const AMBIENTES_PADRAO = [
    'Cozinha', 'Quarto', 'Sala', 'Banheiro', 'Escritório',
    'Lavanderia', 'Varanda', 'Área de Serviço', 'Garagem'
];

export default function DadosGerais({ orcamento, clientes, onChange }) {
    const [opcoesCustomizadas, setOpcoesCustomizadas] = useState([]);

    useEffect(() => {
        api.get('/opcoes-customizadas?tipo=ambiente')
            .then(r => setOpcoesCustomizadas(r.data.map(o => o.nome)))
            .catch(() => {});
    }, []);

    const todasOpcoes = [...AMBIENTES_PADRAO, ...opcoesCustomizadas.filter(o => !AMBIENTES_PADRAO.includes(o))];

    const isCustom = orcamento.ambiente && !AMBIENTES_PADRAO.includes(orcamento.ambiente);
    const [usandoOutros, setUsandoOutros] = useState(isCustom);
    const [salvarComoFixo, setSalvarComoFixo] = useState(false);

    // Corrige o modo após carregar opções customizadas (ex: ao editar um orçamento)
    useEffect(() => {
        if (opcoesCustomizadas.length > 0 && orcamento.ambiente) {
            const all = [...AMBIENTES_PADRAO, ...opcoesCustomizadas];
            if (all.includes(orcamento.ambiente)) setUsandoOutros(false);
        }
    }, [opcoesCustomizadas, orcamento.ambiente]);

    const handleAmbienteChange = (e) => {
        if (e.target.value === 'Outros') {
            setUsandoOutros(true);
            setSalvarComoFixo(false);
            onChange({ target: { name: 'ambiente', value: '' } });
        } else {
            setUsandoOutros(false);
            setSalvarComoFixo(false);
            onChange(e);
        }
    };

    const handleTextoChange = (e) => {
        setSalvarComoFixo(false);
        onChange(e);
    };

    const handleSalvarComoFixo = async (e) => {
        const checked = e.target.checked;
        setSalvarComoFixo(checked);
        if (checked && orcamento.ambiente?.trim()) {
            try {
                await api.post('/opcoes-customizadas', { tipo: 'ambiente', nome: orcamento.ambiente.trim() });
                setOpcoesCustomizadas(prev => [...new Set([...prev, orcamento.ambiente.trim()])]);
                toast.success(`"${orcamento.ambiente}" salvo como opção fixa!`);
            } catch {
                setSalvarComoFixo(false);
                toast.error('Erro ao salvar opção.');
            }
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
                        {todasOpcoes.map(amb => <option key={amb} value={amb}>{amb}</option>)}
                        <option value="Outros">[ + ] Outro (Digitar manualmente)</option>
                    </select>
                    {usandoOutros && (
                        <>
                            <input
                                type="text"
                                name="ambiente"
                                value={orcamento.ambiente}
                                onChange={handleTextoChange}
                                placeholder="Descreva o ambiente..."
                                style={{ marginTop: '8px' }}
                                autoFocus
                            />
                            {orcamento.ambiente?.trim() && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-soft)' }}>
                                    <input
                                        type="checkbox"
                                        checked={salvarComoFixo}
                                        onChange={handleSalvarComoFixo}
                                    />
                                    Salvar "{orcamento.ambiente}" como opção fixa
                                </label>
                            )}
                        </>
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
