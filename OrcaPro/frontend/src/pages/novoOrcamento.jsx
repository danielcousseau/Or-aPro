import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import DadosGerais from '../components/Orcamento/DadosGerais';
import ListaMateriais from '../components/Orcamento/ListaMateriais';
import ResumoValores from '../components/Orcamento/ResumoValores';

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
                
                <DadosGerais 
                    orcamento={orcamento} 
                    clientes={clientes} 
                    onChange={handleChange} 
                />

                <ListaMateriais 
                    materiaisSelecionados={materiaisSelecionados} 
                    materiaisDb={materiaisDb} 
                    onAdd={adicionarLinhaMaterial} 
                    onRemove={removerLinhaMaterial} 
                    onUpdate={atualizarMaterialSelecionado} 
                />

                <ResumoValores 
                    orcamento={orcamento} 
                    totais={totais} 
                    formasPagamento={formasPagamento} 
                    onChange={handleChange} 
                />

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