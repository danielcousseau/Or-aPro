import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { formatarMoeda } from '../utils/format';
import { mascaraMoeda, desmascararMoeda } from '../utils/masks';
import { Material } from '../types';

const CATEGORIAS_PADRAO = ['Chapas', 'Fixação', 'Ferragens', 'Acabamento'];
const UNIDADES_PADRAO = ['Chapa', 'Unidade', 'Metro', 'Metro Linear', 'Metro Quadrado', 'Caixa', 'Par', 'Rolo', 'Litro', 'Kg'];

interface MaterialFormData {
    nome: string;
    categoria: string;
    valor: string;
    unidade: string;
    quantidadeEstoque: string;
    estoqueMinimo: string;
}

const FORM_VAZIO: MaterialFormData = { nome: '', categoria: '', valor: '', unidade: '', quantidadeEstoque: '', estoqueMinimo: '' };

export default function Materiais() {
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [materialEmEdicao, setMaterialEmEdicao] = useState<Material | null>(null);
    const [materialParaExcluir, setMaterialParaExcluir] = useState<number | null>(null);
    const [materialParaAjustar, setMaterialParaAjustar] = useState<Material | null>(null);
    const [valorAjuste, setValorAjuste] = useState('');
    const [ajustando, setAjustando] = useState(false);
    const [abaAtiva, setAbaAtiva] = useState<'consulta' | 'cadastro'>('consulta');
    const [termoBusca, setTermoBusca] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [usandoOutrosCategoria, setUsandoOutrosCategoria] = useState(false);
    const [usandoOutrosUnidade, setUsandoOutrosUnidade] = useState(false);
    const [salvarCategoriaComoFixo, setSalvarCategoriaComoFixo] = useState(false);
    const [salvarUnidadeComoFixo, setSalvarUnidadeComoFixo] = useState(false);
    const [categoriasCustomizadas, setCategoriasCustomizadas] = useState<string[]>([]);
    const [unidadesCustomizadas, setUnidadesCustomizadas] = useState<string[]>([]);

    const [formData, setFormData] = useState<MaterialFormData>(FORM_VAZIO);

    useEffect(() => {
        carregarMateriais();
        api.get('/opcoes-customizadas?tipo=material_categoria')
            .then(r => setCategoriasCustomizadas(r.data.map((o: { nome: string }) => o.nome)))
            .catch(() => {});
        api.get('/opcoes-customizadas?tipo=material_unidade')
            .then(r => setUnidadesCustomizadas(r.data.map((o: { nome: string }) => o.nome)))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (materialEmEdicao && formData.categoria) {
            const all = [...CATEGORIAS_PADRAO, ...categoriasCustomizadas];
            if (all.includes(formData.categoria)) setUsandoOutrosCategoria(false);
        }
    }, [categoriasCustomizadas]);

    useEffect(() => {
        if (materialEmEdicao && formData.unidade) {
            const all = [...UNIDADES_PADRAO, ...unidadesCustomizadas];
            if (all.includes(formData.unidade)) setUsandoOutrosUnidade(false);
        }
    }, [unidadesCustomizadas]);

    const todasCategorias = [...CATEGORIAS_PADRAO, ...categoriasCustomizadas.filter(o => !CATEGORIAS_PADRAO.includes(o))];
    const todasUnidades = [...UNIDADES_PADRAO, ...unidadesCustomizadas.filter(o => !UNIDADES_PADRAO.includes(o))];

    const carregarMateriais = async () => {
        try {
            const response = await api.get('/materiais');
            setMateriais(response.data);
        } catch (error) {
            console.error("Erro ao carregar materiais", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name } = e.target;
        const value = name === 'valor' ? mascaraMoeda(e.target.value) : e.target.value;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const limparFormulario = () => {
        setFormData(FORM_VAZIO);
        setMaterialEmEdicao(null);
        setUsandoOutrosCategoria(false);
        setUsandoOutrosUnidade(false);
        setSalvarCategoriaComoFixo(false);
        setSalvarUnidadeComoFixo(false);
    };

    const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === 'Outros') {
            setUsandoOutrosCategoria(true);
            setSalvarCategoriaComoFixo(false);
            setFormData(prev => ({ ...prev, categoria: '' }));
        } else {
            setUsandoOutrosCategoria(false);
            setSalvarCategoriaComoFixo(false);
            setFormData(prev => ({ ...prev, categoria: e.target.value }));
        }
    };

    const handleUnidadeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === 'Outros') {
            setUsandoOutrosUnidade(true);
            setSalvarUnidadeComoFixo(false);
            setFormData(prev => ({ ...prev, unidade: '' }));
        } else {
            setUsandoOutrosUnidade(false);
            setSalvarUnidadeComoFixo(false);
            setFormData(prev => ({ ...prev, unidade: e.target.value }));
        }
    };

    const handleCategoriaTextoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSalvarCategoriaComoFixo(false);
        handleChange(e);
    };

    const handleUnidadeTextoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSalvarUnidadeComoFixo(false);
        handleChange(e);
    };

    const handleSalvarCategoriaComoFixo = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setSalvarCategoriaComoFixo(checked);
        if (checked && formData.categoria?.trim()) {
            try {
                await api.post('/opcoes-customizadas', { tipo: 'material_categoria', nome: formData.categoria.trim() });
                setCategoriasCustomizadas(prev => [...new Set([...prev, formData.categoria.trim()])]);
                toast.success(`"${formData.categoria}" salvo como categoria fixa!`);
            } catch {
                setSalvarCategoriaComoFixo(false);
                toast.error('Erro ao salvar categoria.');
            }
        }
    };

    const handleSalvarUnidadeComoFixo = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setSalvarUnidadeComoFixo(checked);
        if (checked && formData.unidade?.trim()) {
            try {
                await api.post('/opcoes-customizadas', { tipo: 'material_unidade', nome: formData.unidade.trim() });
                setUnidadesCustomizadas(prev => [...new Set([...prev, formData.unidade.trim()])]);
                toast.success(`"${formData.unidade}" salvo como unidade fixa!`);
            } catch {
                setSalvarUnidadeComoFixo(false);
                toast.error('Erro ao salvar unidade.');
            }
        }
    };

    const handleEditar = (material: Material) => {
        const isCustomCategoria = Boolean(material.categoria && !CATEGORIAS_PADRAO.includes(material.categoria) && !categoriasCustomizadas.includes(material.categoria));
        const isCustomUnidade = Boolean(material.unidade && !UNIDADES_PADRAO.includes(material.unidade) && !unidadesCustomizadas.includes(material.unidade));
        setMaterialEmEdicao(material);
        setUsandoOutrosCategoria(isCustomCategoria);
        setUsandoOutrosUnidade(isCustomUnidade);
        setSalvarCategoriaComoFixo(false);
        setSalvarUnidadeComoFixo(false);
        setFormData({
            nome: material.nome || '',
            categoria: material.categoria || '',
            valor: mascaraMoeda(material.valor) || '',
            unidade: material.unidade || '',
            quantidadeEstoque: material.quantidadeEstoque != null ? String(material.quantidadeEstoque) : '',
            estoqueMinimo: material.estoqueMinimo != null ? String(material.estoqueMinimo) : '',
        });
        setAbaAtiva('cadastro');
        window.scrollTo(0, 0);
    };

    const confirmarExclusao = async () => {
        if (!materialParaExcluir) return;
        try {
            await api.delete(`/materiais/${materialParaExcluir}`);
            toast.success('Material excluído com sucesso!');
            setMaterialParaExcluir(null);
            carregarMateriais();
        } catch {
            toast.error('Erro ao excluir material.');
            setMaterialParaExcluir(null);
        }
    };

    const confirmarAjusteEstoque = async () => {
        if (!materialParaAjustar) return;
        const quantidade = parseFloat(valorAjuste.replace(',', '.'));
        if (isNaN(quantidade) || quantidade < 0) {
            toast.error('Informe uma quantidade válida (zero ou maior).');
            return;
        }
        setAjustando(true);
        try {
            const { data: materialAtualizado } = await api.patch(`/materiais/${materialParaAjustar.id}/estoque`, { quantidadeEstoque: quantidade });
            setMateriais(prev => prev.map(m => m.id === materialAtualizado.id ? materialAtualizado : m));
            toast.success(`Estoque de "${materialParaAjustar.nome}" atualizado para ${quantidade}!`);
            setMaterialParaAjustar(null);
            setValorAjuste('');
        } catch {
            toast.error('Erro ao ajustar estoque.');
        } finally {
            setAjustando(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (salvando) return;
        setSalvando(true);
        try {
            const dadosParaEnviar = {
                ...formData,
                valor: desmascararMoeda(formData.valor),
                quantidadeEstoque: formData.quantidadeEstoque !== '' ? Number(formData.quantidadeEstoque) : null,
                estoqueMinimo: formData.estoqueMinimo !== '' ? Number(formData.estoqueMinimo) : null,
            };
            if (materialEmEdicao) {
                const { data: materialAtualizado } = await api.put(`/materiais/${materialEmEdicao.id}`, dadosParaEnviar);
                setMateriais(prev => prev.map(m => m.id === materialAtualizado.id ? materialAtualizado : m));
            } else {
                const { data: novoMaterial } = await api.post('/materiais', dadosParaEnviar);
                setMateriais(prev => [novoMaterial, ...prev]);
            }
            toast.success(`Material ${materialEmEdicao ? 'atualizado' : 'salvo'} com sucesso!`);
            limparFormulario();
            setAbaAtiva('consulta');
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
            toast.error(msg || 'Erro ao salvar material.');
            console.error("Erro ao salvar material:", error);
        } finally {
            setSalvando(false);
        }
    };

    const materiaisFiltrados = materiais.filter(material => {
        const termo = termoBusca.toLowerCase();
        return (
            (material.nome && material.nome.toLowerCase().includes(termo)) ||
            (material.categoria && material.categoria.toLowerCase().includes(termo))
        );
    });

    const estoqueEmAlerta = (m: Material) =>
        m.quantidadeEstoque != null && m.estoqueMinimo != null && m.quantidadeEstoque < m.estoqueMinimo;

    return (
        <div>
            <div className="page-header">
                <h1>Gestão de Materiais</h1>
                <div className="tabs">
                    <button type="button" className={`tab-btn ${abaAtiva === 'consulta' ? 'ativo' : ''}`} onClick={() => { setAbaAtiva('consulta'); limparFormulario(); }}>Lista</button>
                    <button type="button" className={`tab-btn ${abaAtiva === 'cadastro' ? 'ativo' : ''}`} onClick={() => { setAbaAtiva('cadastro'); limparFormulario(); }}>Novo Material</button>
                </div>
            </div>

            {abaAtiva === 'cadastro' && (
                <div>
                    <h2 style={{ marginBottom: '20px', color: 'var(--text-main)', borderBottom: '2px solid var(--border)', paddingBottom: '10px' }}>
                        {materialEmEdicao ? 'Editar Material' : 'Cadastro de Materiais'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div className="cliente-card">
                            <div className="form-grid-2-1">
                                <section className="form-section">
                                    <label>Nome do Material *</label>
                                    <input type="text" name="nome" value={formData.nome} onChange={handleChange} required placeholder="Ex: MDF Branco TX 15mm" />
                                </section>
                                <section className="form-section">
                                    <label>Categoria</label>
                                    <select name="categoria" value={usandoOutrosCategoria ? 'Outros' : (formData.categoria || '')} onChange={handleCategoriaChange}>
                                        <option value="">Selecione uma categoria...</option>
                                        {todasCategorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        <option value="Outros">[ + ] Outro (Digitar manualmente)</option>
                                    </select>
                                    {usandoOutrosCategoria && (
                                        <>
                                            <input type="text" name="categoria" value={formData.categoria} onChange={handleCategoriaTextoChange} placeholder="Descreva a categoria..." style={{ marginTop: '8px' }} autoFocus />
                                            {formData.categoria?.trim() && (
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-soft)' }}>
                                                    <input type="checkbox" checked={salvarCategoriaComoFixo} onChange={handleSalvarCategoriaComoFixo} />
                                                    Salvar "{formData.categoria}" como categoria fixa
                                                </label>
                                            )}
                                        </>
                                    )}
                                </section>
                            </div>

                            <div className="form-grid-1-1">
                                <section className="form-section">
                                    <label>Valor (R$) *</label>
                                    <input type="text" name="valor" value={formData.valor} onChange={handleChange} required placeholder="R$ 0,00" onFocus={(e) => e.target.select()} />
                                </section>
                                <section className="form-section">
                                    <label>Unidade de Medida</label>
                                    <select name="unidade" value={usandoOutrosUnidade ? 'Outros' : (formData.unidade || '')} onChange={handleUnidadeChange}>
                                        <option value="">Selecione uma unidade...</option>
                                        {todasUnidades.map(un => <option key={un} value={un}>{un}</option>)}
                                        <option value="Outros">[ + ] Outro (Digitar manualmente)</option>
                                    </select>
                                    {usandoOutrosUnidade && (
                                        <>
                                            <input type="text" name="unidade" value={formData.unidade} onChange={handleUnidadeTextoChange} placeholder="Descreva a unidade..." style={{ marginTop: '8px' }} autoFocus />
                                            {formData.unidade?.trim() && (
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-soft)' }}>
                                                    <input type="checkbox" checked={salvarUnidadeComoFixo} onChange={handleSalvarUnidadeComoFixo} />
                                                    Salvar "{formData.unidade}" como unidade fixa
                                                </label>
                                            )}
                                        </>
                                    )}
                                </section>
                            </div>

                            <div className="form-grid-1-1">
                                <section className="form-section">
                                    <label>Estoque Atual</label>
                                    <input type="number" name="quantidadeEstoque" value={formData.quantidadeEstoque} onChange={handleChange} placeholder="Deixe em branco = sem controle" min="0" step="0.01" />
                                </section>
                                <section className="form-section">
                                    <label>Estoque Mínimo</label>
                                    <input type="number" name="estoqueMinimo" value={formData.estoqueMinimo} onChange={handleChange} placeholder="Alerta abaixo deste valor" min="0" step="0.01" />
                                </section>
                            </div>

                            <div className="form-buttons">
                                <button type="submit" disabled={salvando} style={{ opacity: salvando ? 0.7 : 1, cursor: salvando ? 'not-allowed' : 'pointer' }}>
                                    {salvando ? 'Salvando...' : (materialEmEdicao ? 'Atualizar Material' : 'Salvar Material')}
                                </button>
                                <button type="button" className="btn-cancel" disabled={salvando} onClick={() => { limparFormulario(); setAbaAtiva('consulta'); }}>
                                    {materialEmEdicao ? 'Cancelar Edição' : 'Cancelar'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {abaAtiva === 'consulta' && (
                <section className="lista-clientes">
                    <div className="search-bar">
                        <h2>{materiaisFiltrados.length} {materiaisFiltrados.length !== 1 ? 'materiais' : 'material'}</h2>
                        <input type="text" placeholder="Pesquisar por nome ou categoria..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} />
                    </div>
                    <div id="listaMateriais">
                        {materiaisFiltrados.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-soft)' }}>Nenhum material encontrado.</p>
                        ) : (
                            <div className="grid-cards">
                                {materiaisFiltrados.map((material) => (
                                    <div key={material.id} className={`cliente-card highlight-primary${estoqueEmAlerta(material) ? ' card-alerta-estoque' : ''}`}>
                                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>
                                            {estoqueEmAlerta(material) && <span title="Estoque abaixo do mínimo" style={{ marginRight: '6px' }}>⚠️</span>}
                                            {material.nome}
                                        </h3>
                                        <p style={{ margin: '4px 0' }}><strong>Valor:</strong> {formatarMoeda(material.valor)}</p>
                                        <p style={{ margin: '4px 0' }}><strong>Categoria:</strong> {material.categoria || 'Não informada'}</p>
                                        <p style={{ margin: '4px 0' }}><strong>Unidade:</strong> {material.unidade || 'Não informada'}</p>
                                        <p style={{ margin: '4px 0' }}>
                                            <strong>Estoque:</strong>{' '}
                                            {material.quantidadeEstoque != null ? (
                                                <span style={{ color: estoqueEmAlerta(material) ? 'var(--danger)' : 'inherit', fontWeight: estoqueEmAlerta(material) ? 600 : 400 }}>
                                                    {material.quantidadeEstoque} {material.unidade || 'unid.'}
                                                    {material.estoqueMinimo != null && <span style={{ color: 'var(--text-soft)', fontWeight: 400 }}> (mín: {material.estoqueMinimo})</span>}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-soft)' }}>Não controlado</span>
                                            )}
                                        </p>
                                        <div className="card-actions" style={{ marginTop: '15px' }}>
                                            <button type="button" className="btn-action btn-edit" onClick={() => handleEditar(material)}>Editar</button>
                                            <button type="button" className="btn-action" style={{ background: 'var(--primary)', color: '#fff' }} onClick={() => { setMaterialParaAjustar(material); setValorAjuste(material.quantidadeEstoque != null ? String(material.quantidadeEstoque) : ''); }}>Estoque</button>
                                            <button type="button" className="btn-action btn-delete" onClick={() => setMaterialParaExcluir(material.id)}>Excluir</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

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

            {materialParaAjustar && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Ajustar Estoque</h3>
                        <p style={{ marginBottom: '4px' }}><strong>{materialParaAjustar.nome}</strong></p>
                        <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem', marginBottom: '16px' }}>
                            Informe a quantidade atual em estoque (sobrescreve o valor anterior).
                        </p>
                        <section className="form-section">
                            <label>Quantidade em estoque</label>
                            <input
                                type="number"
                                value={valorAjuste}
                                onChange={e => setValorAjuste(e.target.value)}
                                min="0"
                                step="0.01"
                                placeholder="Ex: 15"
                                autoFocus
                            />
                        </section>
                        <div className="modal-actions" style={{ marginTop: '16px' }}>
                            <button type="button" className="btn-cancel" onClick={() => { setMaterialParaAjustar(null); setValorAjuste(''); }}>Cancelar</button>
                            <button type="button" onClick={confirmarAjusteEstoque} disabled={ajustando} style={{ opacity: ajustando ? 0.7 : 1 }}>
                                {ajustando ? 'Salvando...' : 'Salvar Estoque'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
