import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function NovoOrcamento() {
    const { id } = useParams(); // Pega o ID da URL se estiver editando
    const navigate = useNavigate();

    // Estado para bloquear a tela enquanto puxa as informações do banco
    const [carregando, setCarregando] = useState(!!id);

    // Listas do Banco de Dados
    const [clientes, setClientes] = useState([]);
    const [materiaisDb, setMateriaisDb] = useState([]);
    const [formasPagamento, setFormasPagamento] = useState([]);

    // Dados do Orçamento
    const [orcamento, setOrcamento] = useState(() => {
        // Se for edição, ignora rascunhos para não dar conflito
        if (id) return {
            titulo: '', clienteId: '', tipoMovel: '', ambiente: '', medidas: '',
            tipoMaoDeObra: 'porcentagem', maoDeObraValor: 0,
            tipoLucro: 'porcentagem', lucroValor: 0,
            prazo: '', pagamento: '', validade: '', observacoes: ''
        };
        
        const rascunho = localStorage.getItem('rascunhoOrcamento');
        return rascunho ? JSON.parse(rascunho) : {
            titulo: '', clienteId: '', tipoMovel: '', ambiente: '', medidas: '',
            tipoMaoDeObra: 'porcentagem', maoDeObraValor: 0,
            tipoLucro: 'porcentagem', lucroValor: 0,
            prazo: '', pagamento: '', validade: '', observacoes: ''
        };
    });

    // Lista dinâmica de materiais adicionados
    const [materiaisSelecionados, setMateriaisSelecionados] = useState(() => {
        if (id) return []; // Inicia vazio na edição, pois o banco vai preencher
        
        const rascunho = localStorage.getItem('rascunhoMateriais');
        return rascunho ? JSON.parse(rascunho) : [
            { idFalso: Date.now(), nome: '', valor: 0, quantidade: 1 }
        ];
    });

    // Totais calculados automaticamente
    const [totais, setTotais] = useState({ materiais: 0, maoDeObra: 0, lucro: 0, final: 0 });

    // 1. Busca os clientes e materiais quando a tela abre
    useEffect(() => {
        if (id) {
            setCarregando(true);
            Promise.all([
                api.get('/clientes'),
                api.get('/materiais'),
                api.get(`/orcamentos/${id}`),
                api.get('/formas-pagamento').catch(() => ({ data: [] }))
            ]).then(([resClientes, resMateriais, resOrcamento, resFormas]) => {
                setClientes(resClientes.data);
                setMateriaisDb(resMateriais.data);
                setFormasPagamento(resFormas.data || []);
                
                const data = resOrcamento.data;
                setOrcamento({
                    titulo: data.titulo || '',
                    clienteId: data.clienteId || '',
                    tipoMovel: data.tipoMovel || '',
                    ambiente: data.ambiente || '',
                    medidas: data.medidas || '',
                    tipoMaoDeObra: data.tipoMaoDeObra || 'porcentagem',
                    maoDeObraValor: data.maoDeObraValor || 0,
                    tipoLucro: data.tipoLucro || 'porcentagem',
                    lucroValor: data.lucroValor || 0,
                    prazo: data.prazo || '',
                    pagamento: data.pagamento || '',
                    validade: data.validade || '',
                    observacoes: data.observacoes || ''
                });
                
                if (data.materiais && data.materiais.length > 0) {
                    setMateriaisSelecionados(data.materiais.map(m => ({
                        idFalso: m.id || Date.now() + Math.random(),
                        nome: m.nome,
                        valor: m.valor,
                        quantidade: m.quantidade
                    })));
                }
                setCarregando(false);
            }).catch(() => {
                alert('Erro ao carregar orçamento para edição.');
                navigate('/historico');
            });
        } else {
            api.get('/clientes').then(res => setClientes(res.data));
            api.get('/materiais').then(res => setMateriaisDb(res.data));
            api.get('/formas-pagamento').then(res => setFormasPagamento(res.data)).catch(() => {});
            setCarregando(false);
        }
    }, [id, navigate]);

    // 2. A Mágica: Recalcula tudo SEMPRE que o orçamento ou os materiais mudarem
    useEffect(() => {
        // Custo dos Materiais
        const custoMateriais = materiaisSelecionados.reduce((acc, mat) => acc + (mat.valor * mat.quantidade), 0);

        // Mão de Obra
        let valorMaoDeObra = 0;
        if (orcamento.tipoMaoDeObra === 'fixo') {
            valorMaoDeObra = Number(orcamento.maoDeObraValor);
        } else {
            valorMaoDeObra = custoMateriais * (Number(orcamento.maoDeObraValor) / 100);
        }

        // Lucro
        let valorLucro = 0;
        const subtotal = custoMateriais + valorMaoDeObra;
        if (orcamento.tipoLucro === 'fixo') {
            valorLucro = Number(orcamento.lucroValor);
        } else {
            valorLucro = subtotal * (Number(orcamento.lucroValor) / 100);
        }

        setTotais({
            materiais: custoMateriais,
            maoDeObra: valorMaoDeObra,
            lucro: valorLucro,
            final: custoMateriais + valorMaoDeObra + valorLucro
        });
    }, [orcamento, materiaisSelecionados]);

    // Salvar rascunhos no Local Storage sempre que houver mudanças
    useEffect(() => {
        if (!id) localStorage.setItem('rascunhoOrcamento', JSON.stringify(orcamento));
    }, [orcamento, id]);

    useEffect(() => {
        if (!id) localStorage.setItem('rascunhoMateriais', JSON.stringify(materiaisSelecionados));
    }, [materiaisSelecionados, id]);

    // 3. Funções de controle do formulário
    const handleChange = (e) => {
        setOrcamento({ ...orcamento, [e.target.name]: e.target.value });
    };

    const adicionarLinhaMaterial = () => {
        setMateriaisSelecionados([...materiaisSelecionados, { idFalso: Date.now(), nome: '', valor: 0, quantidade: 1 }]);
    };

    const removerLinhaMaterial = (idFalso) => {
        setMateriaisSelecionados(materiaisSelecionados.filter(m => m.idFalso !== idFalso));
    };

    const atualizarMaterialSelecionado = (idFalso, campo, valor) => {
        const novaLista = materiaisSelecionados.map(mat => {
            if (mat.idFalso === idFalso) {
                let novoMat = { ...mat, [campo]: valor };
                // Se o usuário selecionou um material do select, já puxa o nome e o valor do banco
                if (campo === 'selectDb' && valor !== '') {
                    const materialDoBanco = materiaisDb.find(m => m.id === Number(valor));
                    if(materialDoBanco) {
                        novoMat.nome = materialDoBanco.nome;
                        novoMat.valor = materialDoBanco.valor;
                    }
                }
                return novoMat;
            }
            return mat;
        });
        setMateriaisSelecionados(novaLista);
    };

    // 4. Salvar no Banco
    const salvarOrcamento = async (e) => {
        e.preventDefault();
        if (!orcamento.clienteId) return alert("Selecione um cliente!");

        const dadosParaEnviar = {
            ...orcamento,
            totalFinal: totais.final,
            // Limpa os dados antes de mandar pro back, tirando o idFalso e o selectDb
            materiais: materiaisSelecionados.map(m => ({
                nome: m.nome,
                valor: m.valor,
                quantidade: m.quantidade
            })).filter(m => m.nome !== '') // Só envia se tiver nome
        };

        try {
            if (id) {
                await api.put(`/orcamentos/${id}`, dadosParaEnviar);
                alert('Orçamento atualizado com sucesso!');
            } else {
                await api.post('/orcamentos', dadosParaEnviar);
                alert('Orçamento gerado e salvo com sucesso!');
            }
            
            localStorage.removeItem('rascunhoOrcamento');
            localStorage.removeItem('rascunhoMateriais');
            navigate('/historico'); // Direciona pro histórico após salvar
        } catch (error) {
            alert('Erro ao salvar orçamento.');
        }
    };
    
    // Impede de renderizar os campos vazios antes dos dados chegarem
    if (carregando) {
        return (
            <div className="container text-center" style={{ marginTop: '40px', padding: '40px' }}>
                <h2 className="text-primary">Carregando Orçamento...</h2>
                <p className="text-soft">Buscando informações no banco de dados.</p>
            </div>
        );
    }

    return (
        <div>
            <h1>{id ? 'Editar Orçamento' : 'Novo Orçamento'}</h1>
            
            <style>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                input[type=number] { -moz-appearance: textfield; }
            `}</style>

            <form onSubmit={salvarOrcamento}>
                
                {/* DADOS GERAIS */}
                <div className="cliente-card highlight-primary">
                    <h3>1. Dados Gerais</h3>
                    <section className="form-section">
                        <label>Título do Orçamento *</label>
                        <input type="text" name="titulo" value={orcamento.titulo} onChange={handleChange} placeholder="Ex: Cozinha Planejada Dona Maria" required />
                    </section>
                    <section className="form-section">
                        <label>Cliente *</label>
                        <select name="clienteId" value={orcamento.clienteId} onChange={handleChange} required>
                            <option value="">Selecione um cliente...</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </section>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <section className="form-section">
                            <label>Ambiente</label>
                            <input type="text" name="ambiente" value={orcamento.ambiente} onChange={handleChange} />
                        </section>
                        <section className="form-section">
                            <label>Tipo de Móvel</label>
                            <input type="text" name="tipoMovel" value={orcamento.tipoMovel} onChange={handleChange} />
                        </section>
                    </div>
                </div>

                {/* MATERIAIS */}
                <div className="cliente-card">
                    <h3>2. Materiais</h3>
                    {materiaisSelecionados.map((mat, index) => (
                        <div key={mat.idFalso} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr auto', gap: '10px', alignItems: 'end', marginBottom: '12px' }}>
                            <section className="form-section">
                                <label>Puxar do Cadastro</label>
                                <select onChange={(e) => atualizarMaterialSelecionado(mat.idFalso, 'selectDb', e.target.value)}>
                                    <option value="">Material avulso...</option>
                                    {materiaisDb.map(mdb => <option key={mdb.id} value={mdb.id}>{mdb.nome} - R${mdb.valor}</option>)}
                                </select>
                            </section>
                            <section className="form-section">
                                <label>Nome/Descrição</label>
                                <input type="text" value={mat.nome} onChange={(e) => atualizarMaterialSelecionado(mat.idFalso, 'nome', e.target.value)} required />
                            </section>
                            <section className="form-section">
                                <label>Valor (R$)</label>
                                <input type="number" step="0.01" value={mat.valor} onChange={(e) => atualizarMaterialSelecionado(mat.idFalso, 'valor', Number(e.target.value))} onFocus={(e) => e.target.select()} required />
                            </section>
                            <section className="form-section">
                                <label>Qtd</label>
                                <input type="number" step="0.01" value={mat.quantidade} onChange={(e) => atualizarMaterialSelecionado(mat.idFalso, 'quantidade', Number(e.target.value))} onFocus={(e) => e.target.select()} required />
                            </section>
                            {index > 0 && (
                                <button type="button" onClick={() => removerLinhaMaterial(mat.idFalso)} className="btn-delete" style={{ height: '46px', marginBottom: '18px' }}>X</button>
                            )}
                        </div>
                    ))}
                    <button type="button" className="btn-cancel" onClick={adicionarLinhaMaterial}>+ Adicionar Material</button>
                </div>

                {/* PRECIFICAÇÃO */}
                <div className="cliente-card">
                    <h3>3. Precificação</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label>Mão de Obra</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <select name="tipoMaoDeObra" value={orcamento.tipoMaoDeObra} onChange={handleChange}>
                                    <option value="porcentagem">% sobre material</option>
                                    <option value="fixo">Valor Fixo (R$)</option>
                                </select>
                                <input type="number" name="maoDeObraValor" value={orcamento.maoDeObraValor} onChange={handleChange} onFocus={(e) => e.target.select()} />
                            </div>
                        </div>
                        <div>
                            <label>Lucro</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <select name="tipoLucro" value={orcamento.tipoLucro} onChange={handleChange}>
                                    <option value="porcentagem">% sobre total</option>
                                    <option value="fixo">Valor Fixo (R$)</option>
                                </select>
                                <input type="number" name="lucroValor" value={orcamento.lucroValor} onChange={handleChange} onFocus={(e) => e.target.select()} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RESUMO TOTAL */}
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

                {/* CONDIÇÕES COMERCIAIS E OBSERVAÇÕES */}
                <div className="cliente-card highlight-success">
                    <h3>4. Condições Comerciais e Detalhes Finais</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                        <section className="form-section">
                            <label>Forma de Pagamento</label>
                            <input 
                                type="text" 
                                name="pagamento" 
                                list="lista-pagamentos"
                                value={orcamento.pagamento} 
                                onChange={handleChange} 
                                placeholder="Selecione ou digite..." 
                            />
                            <datalist id="lista-pagamentos">
                                {formasPagamento.map(fp => <option key={fp.id} value={fp.nome} />)}
                            </datalist>
                        </section>
                        <section className="form-section">
                            <label>Prazo de Entrega</label>
                            <input type="text" name="prazo" value={orcamento.prazo} onChange={handleChange} placeholder="Ex: 15 dias úteis" />
                        </section>
                        <section className="form-section">
                            <label>Validade do Orçamento</label>
                            <input type="text" name="validade" value={orcamento.validade} onChange={handleChange} placeholder="Ex: 7 dias" />
                        </section>
                    </div>
                    <section className="form-section" style={{ marginTop: '15px' }}>
                        <label>Observações Adicionais</label>
                        <textarea name="observacoes" value={orcamento.observacoes} onChange={handleChange} rows="3" placeholder="Garantia, condições de instalação, etc..."></textarea>
                    </section>
                </div>

                <div className="form-buttons">
                    <button type="submit" style={{ fontSize: '1.1rem', padding: '16px 24px' }}>
                        {id ? 'Atualizar Orçamento Salvo' : 'Gerar e Salvar Orçamento'}
                    </button>
                    {id && (
                        <button type="button" className="btn-cancel" onClick={() => navigate('/historico')}>Cancelar Edição</button>
                    )}
                </div>

            </form>
        </div>
    );
}