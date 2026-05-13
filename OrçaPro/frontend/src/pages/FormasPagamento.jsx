import { useState, useEffect } from 'react';
import api from '../services/api';

export default function FormasPagamento() {
    const [formas, setFormas] = useState([]);
    const [formaEmEdicao, setFormaEmEdicao] = useState(null);
    const [formaParaExcluir, setFormaParaExcluir] = useState(null);
    
    const [nome, setNome] = useState('');

    useEffect(() => {
        carregarFormas();
    }, []);

    const carregarFormas = async () => {
        try {
            const response = await api.get('/formas-pagamento');
            setFormas(response.data);
        } catch (error) {
            console.error("Erro ao carregar formas de pagamento", error);
        }
    };

    const limparFormulario = () => {
        setNome('');
        setFormaEmEdicao(null);
    };

    const handleEditar = (forma) => {
        setFormaEmEdicao(forma);
        setNome(forma.nome);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            formaEmEdicao
                ? await api.put(`/formas-pagamento/${formaEmEdicao.id}`, { nome })
                : await api.post('/formas-pagamento', { nome });

            alert(`Forma de pagamento ${formaEmEdicao ? 'atualizada' : 'salva'} com sucesso!`);
            
            limparFormulario();
            carregarFormas();
        } catch (error) {
            console.error("Erro:", error);
            alert('Erro ao salvar forma de pagamento.');
        }
    };

    const confirmarExclusao = async () => {
        if (!formaParaExcluir) return;
        try {
            await api.delete(`/formas-pagamento/${formaParaExcluir}`);
            alert("Forma de pagamento excluída com sucesso!");
            setFormaParaExcluir(null);
            carregarFormas();
        } catch (error) {
            alert("Erro ao excluir forma de pagamento.");
            setFormaParaExcluir(null);
        }
    };

    return (
        <div>
            <h1>{formaEmEdicao ? 'Editar Forma de Pagamento' : 'Formas de Pagamento'}</h1>
            
            <form onSubmit={handleSubmit}>
                <div className="cliente-card">
                    <section className="form-section">
                        <label>Descrição da Forma de Pagamento *</label>
                        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: 50% Entrada e 50% na Instalação (Pix)" />
                    </section>

                    <div className="form-buttons">
                        <button type="submit">
                            {formaEmEdicao ? 'Atualizar' : 'Salvar Forma de Pagamento'}
                        </button>
                        <button type="button" className="btn-cancel" onClick={limparFormulario}>
                            {formaEmEdicao ? 'Cancelar Edição' : 'Limpar'}
                        </button>
                    </div>
                </div>
            </form>

            <section className="lista-clientes">
                <h2>Formas Cadastradas</h2>
                <div id="listaFormas">
                    {formas.length === 0 ? (
                        <p>Nenhuma forma de pagamento cadastrada ainda.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {formas.map((forma) => (
                                <div key={forma.id} className="cliente-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0 }}>{forma.nome}</h3>
                                    
                                    <div className="card-actions" style={{ marginTop: 0 }}>
                                        <button type="button" className="btn-action btn-edit" onClick={() => handleEditar(forma)}>Editar</button>
                                        <button type="button" className="btn-action btn-delete" onClick={() => setFormaParaExcluir(forma.id)}>Excluir</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}