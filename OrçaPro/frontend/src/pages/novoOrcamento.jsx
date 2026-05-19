import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import DadosGerais from '../components/Orcamento/DadosGerais';
import ListaMateriais from '../components/Orcamento/ListaMateriais';
import ResumoValores from '../components/Orcamento/ResumoValores';
import { toast } from 'react-toastify';
import { mascaraMoeda, desmascararMoeda } from '../utils/masks'; // [Clean Code] Importação dos conversores

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
            tipoMaoDeObra: 'porcentagem', maoDeObraValor: '', maoDeObraQtde: 1,
            tipoLucro: 'porcentagem', lucroValor: '', lucroQtde: 1,
            prazo: '', pagamento: '', validade: '', observacoes: ''
        };
        
        const rascunho = localStorage.getItem('rascunhoOrcamento');
        return rascunho ? JSON.parse(rascunho) : {
            titulo: '', clienteId: '', tipoMovel: '', ambiente: '', medidas: '',
            tipoMaoDeObra: 'porcentagem', maoDeObraValor: '',
            tipoLucro: 'porcentagem', lucroValor: '', lucroQtde: 1,
            prazo: '', pagamento: '', validade: '', observacoes: ''
        };
    });

    // Lista dinâmica de materiais adicionados
    const [materiaisSelecionados, setMateriaisSelecionados] = useState(() => {
        if (id) return []; // Inicia vazio na edição, pois o banco vai preencher
        
        const rascunho = localStorage.getItem('rascunhoMateriais');
        return rascunho ? JSON.parse(rascunho) : [
            { idFalso: self.crypto?.randomUUID() || Date.now(), nome: '', valor: '', quantidade: 1 }
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
                    // [UX] Se vier do banco como 'fixo' (R$), já carrega mascarado na tela
                    maoDeObraValor: data.tipoMaoDeObra === 'fixo' ? mascaraMoeda(data.maoDeObraValor) : (data.maoDeObraValor || 0),
                    maoDeObraQtde: data.maoDeObraQtde || 1,
                    tipoLucro: data.tipoLucro || 'porcentagem',
                    lucroValor: data.tipoLucro === 'fixo' ? mascaraMoeda(data.lucroValor) : (data.lucroValor || 0),
                    lucroQtde: data.lucroQtde || 1,
                    prazo: data.prazo || '',
                    pagamento: data.pagamento || '',
                    validade: data.validade || '',
                    observacoes: data.observacoes || ''
                });
                
                if (data.materiais && data.materiais.length > 0) {
                    setMateriaisSelecionados(data.materiais.map(m => ({
                        idFalso: m.id || Date.now() + Math.random(),
                        nome: m.nome,
                        valor: mascaraMoeda(m.valor), // O valor do material sempre será monetário
                        quantidade: m.quantidade
                    })));
                }
                setCarregando(false);
            }).catch(() => {
                toast.error('Erro ao carregar orçamento para edição.');
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
        // [SecOps] Proteção Matemática. Desmascara a string ("R$ 1.500,00" -> 1500.00) antes de multiplicar
        const custoMateriais = materiaisSelecionados.reduce((acc, mat) => acc + (desmascararMoeda(mat.valor) * mat.quantidade), 0);

        // Mão de Obra
        let valorMaoDeObra = 0;
        const valorBase = desmascararMoeda(orcamento.maoDeObraValor);
        const qtde = Number(orcamento.maoDeObraQtde) || 1;

        if (orcamento.tipoMaoDeObra === 'fixo') {
            valorMaoDeObra = valorBase;
        } else if (orcamento.tipoMaoDeObra === 'porcentagem') {
            valorMaoDeObra = custoMateriais * (valorBase / 100);
        } else if (orcamento.tipoMaoDeObra === 'multiplicador') {
            // Markup Custo Materiais -> Mão de Obra = Diferença para atingir a multiplicação
            valorMaoDeObra = Math.max(0, (custoMateriais * valorBase) - custoMateriais);
        } else {
            // Se for diaria, hora, metro_linear, ou metro_quadrado
            valorMaoDeObra = valorBase * qtde;
        }

        // Lucro
        let valorLucro = 0;
        const subtotal = custoMateriais + valorMaoDeObra;
        const lucroBase = desmascararMoeda(orcamento.lucroValor);
        const lucroQtdeNum = Number(orcamento.lucroQtde) || 1;

        if (orcamento.tipoLucro === 'fixo') {
            valorLucro = lucroBase;
        } else if (orcamento.tipoLucro === 'porcentagem') {
            valorLucro = subtotal * (lucroBase / 100);
        } else if (orcamento.tipoLucro === 'multiplicador') {
            // Markup Subtotal -> Lucro = Diferença para atingir a multiplicação
            valorLucro = Math.max(0, (subtotal * lucroBase) - subtotal);
        } else {
            // Se for diaria ou hora
            valorLucro = lucroBase * lucroQtdeNum;
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
        let { name, value } = e.target;
        
        // Aplica a máscara apenas se a escolha de Mão de Obra/Lucro for Dinheiro/Fixo
        if (name === 'maoDeObraValor' && orcamento.tipoMaoDeObra === 'fixo') value = mascaraMoeda(value);
        if (name === 'lucroValor' && orcamento.tipoLucro === 'fixo') value = mascaraMoeda(value);

        setOrcamento({ ...orcamento, [name]: value });
    };

    const adicionarLinhaMaterial = () => {
        // [SecOps] Garante identificadores únicos reais para prevenir erros do virtual DOM
        setMateriaisSelecionados([...materiaisSelecionados, { idFalso: self.crypto?.randomUUID() || Date.now(), nome: '', valor: '', quantidade: 1 }]);
    };

    const removerLinhaMaterial = (idFalso) => {
        setMateriaisSelecionados(materiaisSelecionados.filter(m => m.idFalso !== idFalso));
    };

    const atualizarMaterialSelecionado = (idFalso, campo, valor) => {
        const novaLista = materiaisSelecionados.map(mat => {
            if (mat.idFalso === idFalso) {
                let novoMat = { ...mat, [campo]: valor };
                
                // Se o usuário digitou no campo de valor, formata imediatamente
                if (campo === 'valor') novoMat.valor = mascaraMoeda(valor);

                // Se o usuário selecionou um material do select, já puxa o nome e o valor do banco
                if (campo === 'selectDb' && valor !== '') {
                    const materialDoBanco = materiaisDb.find(m => m.id === Number(valor));
                    if(materialDoBanco) {
                        novoMat.nome = materialDoBanco.nome;
                        novoMat.valor = mascaraMoeda(materialDoBanco.valor); // Puxa do banco já formatado
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
        if (!orcamento.clienteId) {
            toast.warn("Selecione um cliente antes de gerar o orçamento!");
            return;
        }

        const dadosParaEnviar = {
            ...orcamento,
            // [SecOps] Assegura que o backend não receba uma string inválida com 'R$'
            maoDeObraValor: desmascararMoeda(orcamento.maoDeObraValor),
            lucroValor: desmascararMoeda(orcamento.lucroValor),
            totalFinal: totais.final,
            // Limpa os dados antes de mandar pro back, tirando o idFalso e o selectDb
            materiais: materiaisSelecionados.map(m => ({
                nome: m.nome,
                valor: desmascararMoeda(m.valor),
                // [Clean Code] Garante que a quantidade vá para o banco como número, mesmo se o campo ficar limpo na tela
                quantidade: Number(m.quantidade) || 1
            })).filter(m => m.nome !== '') // Só envia se tiver nome
        };

        try {
            if (id) {
                await api.put(`/orcamentos/${id}`, dadosParaEnviar);
                toast.success('Orçamento atualizado com sucesso!');
            } else {
                await api.post('/orcamentos', dadosParaEnviar);
                toast.success('Orçamento gerado e salvo de forma segura!');
            }
            
            localStorage.removeItem('rascunhoOrcamento');
            localStorage.removeItem('rascunhoMateriais');
            navigate('/historico'); // Direciona pro histórico após salvar
        } catch (error) {
            toast.error('Falha de comunicação com o servidor. Tente novamente.');
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