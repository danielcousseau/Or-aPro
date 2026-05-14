import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { formatarMoeda } from '../utils/format';

export default function Materiais() {
    const [materiais, setMateriais] = useState([]);
    const [materialEmEdicao, setMaterialEmEdicao] = useState(null);
    const [materialParaExcluir, setMaterialParaExcluir] = useState(null);
    const [abaAtiva, setAbaAtiva] = useState('consulta'); // 'consulta' ou 'cadastro'
    const [termoBusca, setTermoBusca] = useState(''); // Guarda o texto da pesquisa

    const [formData, setFormData] = useState({
        nome: '',
        categoria: '',
        valor: '',
        unidade: ''
    });

    useEffect(() => {
        carregarMateriais();
    }, []);

    const carregarMateriais = async () => {
        try {
            const response = await api.get('/materiais');
            setMateriais(response.data);
        } catch (error) {
            console.error("Erro ao carregar materiais", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const limparFormulario = () => {
        setFormData({ nome: '', categoria: '', valor: '', unidade: '' });
        setMaterialEmEdicao(null);
    };

    const handleEditar = (material) => {
        setMaterialEmEdicao(material);
        setFormData({
            nome: material.nome || '',
            categoria: material.categoria || '',
            valor: material.valor || '',
            unidade: material.unidade || ''
        });
        setAbaAtiva('cadastro'); // Muda para aba de cadastro automaticamente
        window.scrollTo(0, 0); // Rola para o topo do formulário
    };

    const confirmarExclusao = async () => {
        if (!materialParaExcluir) return;
        try {
            await api.delete(`/materiais/${materialParaExcluir}`);
            toast.success('Material excluído com sucesso!');
            setMaterialParaExcluir(null);
            carregarMateriais();
        } catch (error) {
            toast.error('Erro ao excluir material.');
            setMaterialParaExcluir(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dadosParaEnviar = {
                ...formData,
                valor: Number(formData.valor) // Garante que o valor vai como número pro banco
            };

            if (materialEmEdicao) {
                await api.put(`/materiais/${materialEmEdicao.id}`, dadosParaEnviar);
            } else {
                await api.post('/materiais', dadosParaEnviar);
            }

            toast.success(`Material ${materialEmEdicao ? 'atualizado' : 'salvo'} com sucesso!`);
            limparFormulario();
            carregarMateriais();
            setAbaAtiva('consulta'); // Volta pra lista após salvar
        } catch (error) {
            console.error("Erro detalhado do backend:", error.response?.data || error.message);
            toast.error('Erro ao salvar material. Verifique o console.');
        }
    };

    // Filtra os materiais com base na barra de pesquisa
    const materiaisFiltrados = materiais.filter(material => {
        const termo = termoBusca.toLowerCase();
        return (
            (material.nome && material.nome.toLowerCase().includes(termo)) ||
            (material.categoria && material.categoria.toLowerCase().includes(termo))
        );
    });

    return (
        <div>
            
            <style>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                input[type=number] { -moz-appearance: textfield; }
            `}</style>

            {/* Navegação entre abas */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                <h1 style={{ margin: 0 }}>Gestão de Materiais</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        type="button"
                        onClick={() => { setAbaAtiva('consulta'); limparFormulario(); }} 
                        style={{ background: abaAtiva === 'consulta' ? 'var(--primary)' : '#e0e0e0', color: abaAtiva === 'consulta' ? '#fff' : '#333', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                    >
                          Consultar
                    </button>
                    <button 
                        type="button"
                        onClick={() => { setAbaAtiva('cadastro'); limparFormulario(); }} 
                        style={{ background: abaAtiva === 'cadastro' ? 'var(--primary)' : '#e0e0e0', color: abaAtiva === 'cadastro' ? '#fff' : '#333', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                    >
                          Novo Material
                    </button>
                </div>
            </div>

            {/* CONTEÚDO DA ABA DE CADASTRO */}
            {abaAtiva === 'cadastro' && (
                <div>
                    <h2 style={{ marginBottom: '20px', color: 'var(--text-main)', borderBottom: '2px solid var(--border)', paddingBottom: '10px' }}>
                        {materialEmEdicao ? 'Editar Material' : 'Cadastro de Materiais'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div className="cliente-card">
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                                <section className="form-section">
                                    <label>Nome do Material *</label>
                                    <input type="text" name="nome" value={formData.nome} onChange={handleChange} required placeholder="Ex: MDF Branco TX 15mm" />
                                </section>
                                <section className="form-section">
                                    <label>Categoria</label>
                                    <input type="text" name="categoria" value={formData.categoria} onChange={handleChange} placeholder="Ex: Chapas, Ferragens..." />
                                </section>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <section className="form-section">
                                    <label>Valor (R$) *</label>
                                    <input type="number" step="0.01" name="valor" value={formData.valor} onChange={handleChange} required placeholder="0.00" onFocus={(e) => e.target.select()} />
                                </section>
                                <section className="form-section">
                                    <label>Unidade de Medida</label>
                                    <input type="text" name="unidade" list="lista-unidades" value={formData.unidade} onChange={handleChange} placeholder="Chapa, Unidade, Metro..." />
                                    <datalist id="lista-unidades">
                                        <option value="Chapa" />
                                        <option value="Unidade" />
                                        <option value="Metro" />
                                        <option value="Caixa" />
                                        <option value="Par" />
                                    </datalist>
                                </section>
                            </div>

                            <div className="form-buttons">
                                <button type="submit">{materialEmEdicao ? 'Atualizar Material' : 'Salvar Material'}</button>
                                <button type="button" className="btn-cancel" onClick={() => { limparFormulario(); setAbaAtiva('consulta'); }}>
                                    {materialEmEdicao ? 'Cancelar Edição' : 'Cancelar'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* CONTEÚDO DA ABA DE CONSULTA */}
            {abaAtiva === 'consulta' && (
                <section className="lista-clientes">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', background: 'var(--panel)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <h2 style={{ margin: 0 }}>Cadastrados ({materiaisFiltrados.length})</h2>
                        <input 
                            type="text" 
                            placeholder="Pesquisar por nome ou categoria..." 
                            value={termoBusca}
                            onChange={(e) => setTermoBusca(e.target.value)}
                            style={{ maxWidth: '400px', width: '100%', padding: '10px 15px', borderRadius: '4px', border: '1px solid var(--border)', outline: 'none' }}
                        />
                    </div>

                    <div id="listaMateriais">
                        {materiaisFiltrados.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-soft)' }}>
                                Nenhum material encontrado.
                            </p>
                        ) : (
                            <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                                {materiaisFiltrados.map((material) => (
                                <div key={material.id} className="cliente-card">
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>{material.nome}</h3>
                                        <p style={{ margin: '4px 0' }}><strong>Valor:</strong> {formatarMoeda(material.valor)}</p>
                                    <p style={{ margin: '4px 0' }}><strong>Categoria:</strong> {material.categoria || 'Não informada'}</p>
                                    <p style={{ margin: '4px 0' }}><strong>Unidade:</strong> {material.unidade || 'Não informada'}</p>
                                    
                                    <div className="card-actions" style={{ marginTop: '15px' }}>
                                        <button type="button" className="btn-action btn-edit" onClick={() => handleEditar(material)}>Editar</button>
                                        <button type="button" className="btn-action btn-delete" onClick={() => setMaterialParaExcluir(material.id)}>Excluir</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    </div>
                </section>
            )}

            {/* Modal de Confirmação de Exclusão */}
            {materialParaExcluir && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Confirmar Exclusão</h3>
                        <p>Tem certeza que deseja excluir este material?</p>
                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={() => setMaterialParaExcluir(null)}>Cancelar</button>
                            <button type="button" className="btn-delete" onClick={confirmarExclusao}>Sim, Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}