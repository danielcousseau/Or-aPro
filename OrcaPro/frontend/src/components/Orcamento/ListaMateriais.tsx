import { Material, MaterialSelecionado } from '../../types';

interface Props {
    materiaisSelecionados: MaterialSelecionado[];
    materiaisDb: Material[];
    onAdd: () => void;
    onRemove: (idFalso: string | number) => void;
    onUpdate: (idFalso: string | number, campo: string, valor: string) => void;
}

export default function ListaMateriais({ materiaisSelecionados, materiaisDb, onAdd, onRemove, onUpdate }: Props) {
    return (
        <div className="cliente-card">
            <h3>2. Materiais</h3>
            {materiaisSelecionados.map((mat, index) => (
                <div key={mat.idFalso} className="form-grid-materiais">
                    <section className="form-section">
                        <label>Puxar do Cadastro</label>
                        <select onChange={(e) => onUpdate(mat.idFalso, 'selectDb', e.target.value)}>
                            <option value="">Material avulso...</option>
                            {materiaisDb.map(mdb => <option key={mdb.id} value={mdb.id}>{mdb.nome} - R${mdb.valor}</option>)}
                        </select>
                    </section>
                    <section className="form-section">
                        <label>Nome/Descrição</label>
                        <input type="text" value={mat.nome} onChange={(e) => onUpdate(mat.idFalso, 'nome', e.target.value)} required />
                    </section>
                    <section className="form-section">
                        <label>Valor (R$)</label>
                        <input type="text" value={mat.valor} onChange={(e) => onUpdate(mat.idFalso, 'valor', e.target.value)} onFocus={(e) => e.target.select()} required placeholder="R$ 0,00" />
                    </section>
                    <section className="form-section">
                        <label>Qtd</label>
                        <input type="number" step="0.01" value={mat.quantidade} onChange={(e) => onUpdate(mat.idFalso, 'quantidade', e.target.value)} onFocus={(e) => e.target.select()} required />
                    </section>
                    {index > 0 && <button type="button" onClick={() => onRemove(mat.idFalso)} className="btn-delete btn-remover-material">🗑️ Remover</button>}
                </div>
            ))}
            <button type="button" className="btn-add" style={{ background: '#0056A3', color: '#fff' }} onClick={onAdd}>+ Adicionar Material</button>
        </div>
    );
}
