import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { mascaraCpfCnpj, mascaraTelefone, mascaraCep } from '../utils/masks';
import { validarCpfCnpj } from '../utils/validators'; // [SecOps] Validação matemática de dados

export default function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [clienteEmEdicao, setClienteEmEdicao] = useState(null); // Guarda o cliente que está sendo editado
    const [clienteParaExcluir, setClienteParaExcluir] = useState(null); // Guarda o ID do cliente para o modal de exclusão
    const [abaAtiva, setAbaAtiva] = useState('consulta'); // 'consulta' ou 'cadastro'
    const [termoBusca, setTermoBusca] = useState(''); // Guarda o texto da pesquisa
    const [salvando, setSalvando] = useState(false);
    
    // State único para o formulário
    const [formData, setFormData] = useState({
        nome: '',
        cpfCnpj: '',
        email: '',
        telefone: '',
        rua: '',
        cidade: '',
        bairro: '',
        numero: '',
        cep: '',
        observacoes: ''
    });

    useEffect(() => {
        carregarClientes();
    }, []);

    const carregarClientes = async () => {
        try {
            const response = await api.get('/clientes');
            setClientes(response.data);
        } catch (error) {
            console.error("Erro ao carregar clientes", error);
        }
    };

    // Função que atualiza o state automaticamente conforme você digita
    const handleChange = (e) => {
        let { name, value } = e.target;

        // Intercepta e aplica as máscaras dependendo de qual campo está sendo digitado
        if (name === 'cpfCnpj') value = mascaraCpfCnpj(value);
        else if (name === 'telefone') value = mascaraTelefone(value);
        else if (name === 'cep') value = mascaraCep(value);

        // Salva no estado já formatado
        setFormData({ ...formData, [name]: value });
    };

    const limparFormulario = () => {
        setFormData({
            nome: '', cpfCnpj: '', email: '', telefone: '',
            rua: '', cidade: '', bairro: '', numero: '', 
            cep: '', observacoes: ''
        });
        setClienteEmEdicao(null);
    };

    const handleEditar = (cliente) => {
        setClienteEmEdicao(cliente);
        setFormData({
            nome: cliente.nome || '',
            cpfCnpj: cliente.cpfCnpj || '',
            email: cliente.email || '',
            telefone: cliente.telefone || '',
            rua: cliente.rua || '',
            cidade: cliente.cidade || '',
            bairro: cliente.bairro || '',
            numero: cliente.numero || '',
            cep: cliente.cep || '',
            observacoes: cliente.observacoes || ''
        });
        setAbaAtiva('cadastro'); // Muda para a aba de cadastro automaticamente ao editar
        window.scrollTo(0, 0); // Rola para o topo para o usuário ver o formulário preenchido
    };

    const confirmarExclusao = async () => {
        if (!clienteParaExcluir) return;
        try {
            await api.delete(`/clientes/${clienteParaExcluir}`);
            toast.success('Cliente excluído com sucesso!');
            setClienteParaExcluir(null);
            carregarClientes();
        } catch (error) {
            toast.error('Erro ao excluir cliente.');
            setClienteParaExcluir(null);
        }
    };

    // Busca o CEP automaticamente na API pública do ViaCEP
    const buscarCep = async (e) => {
        const cepLimpo = e.target.value.replace(/\D/g, ''); // Limpa traços e pontos, deixando só números
        
        if (cepLimpo.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
                const data = await response.json();

                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        rua: data.logradouro || prev.rua, // O ViaCEP chama rua de "logradouro"
                        cidade: data.localidade || prev.cidade, // O ViaCEP chama cidade de "localidade"
                        bairro: data.bairro || prev.bairro
                    }));
                }
            } catch (error) {
                console.error("Erro ao buscar informações do CEP:", error);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // [SecOps] Previne salvar no banco CPFs formatados bonitos, mas matematicamente inexistentes.
        if (formData.cpfCnpj && !validarCpfCnpj(formData.cpfCnpj)) {
            toast.error('O CPF ou CNPJ informado é inválido. Verifique os números.');
            return; // Encerra a função aqui, impedindo o envio pro backend
        }

        try {
            clienteEmEdicao
                ? await api.put(`/clientes/${clienteEmEdicao.id}`, formData)
                : await api.post('/clientes', formData);

            toast.success(`Cliente ${clienteEmEdicao ? 'atualizado' : 'salvo'} com sucesso!`);
            limparFormulario();
            carregarClientes();
            setAbaAtiva('consulta'); // Volta pra lista de clientes após salvar
        } catch (error) {
            console.error("Erro detalhado do backend:", error.response?.data || error.message);
            toast.error('Erro ao salvar cliente. Verifique o console.');
        } finally {
            setSalvando(false);
        }
    };

    // Filtra os clientes com base na barra de pesquisa (busca por nome, fone, email ou doc)
    const clientesFiltrados = clientes.filter(cliente => {
        const termo = termoBusca.toLowerCase();
        return (
            (cliente.nome && cliente.nome.toLowerCase().includes(termo)) ||
            (cliente.telefone && cliente.telefone.includes(termo)) ||
            (cliente.email && cliente.email.toLowerCase().includes(termo)) ||
            (cliente.cpfCnpj && cliente.cpfCnpj.includes(termo))
        );
    });

    return (
        <div>
            {/* Navegação entre abas */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                <h1 style={{ margin: 0 }}>Gestão de Clientes</h1>
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
                          Novo Cliente
                    </button>
                </div>
            </div>

            {/* CONTEÚDO DA ABA DE CADASTRO */}
            {abaAtiva === 'cadastro' && (
                <div>
                    <h2 style={{ marginBottom: '20px', color: 'var(--text-main)', borderBottom: '2px solid var(--border)', paddingBottom: '10px' }}>
                        {clienteEmEdicao ? 'Editar Cliente' : 'Cadastro de Cliente'}
                    </h2>
                    
                    <form onSubmit={handleSubmit}>
                        <section className="form-section">
                            <label>Nome Completo *</label>
                            <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />
                        </section>

                        <section className="form-section">
                            <label>CPF / CNPJ</label>
                            <input type="text" name="cpfCnpj" value={formData.cpfCnpj} onChange={handleChange} />
                        </section>

                        <section className="form-section">
                            <label>E-mail</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} />
                        </section>

                        <section className="form-section">
                            <label>Telefone *</label>
                            <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} required />
                        </section>

                        <section className="form-section">
                            <label>CEP</label>
                            <input 
                                type="text" 
                                name="cep" 
                                value={formData.cep} 
                                onChange={handleChange} 
                                onBlur={buscarCep} /* Aciona a busca ao sair do campo */
                                placeholder="00000-000" 
                            />
                        </section>

                        <section className="form-section">
                            <label>Rua / Logradouro</label>
                            <input type="text" name="rua" value={formData.rua} onChange={handleChange} />
                        </section>

                        <section className="form-section">
                            <label>Cidade</label>
                            <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} />
                        </section>

                        <section className="form-section">
                            <label>Bairro</label>
                            <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} />
                        </section>

                        <section className="form-section">
                            <label>Número</label>
                            <input type="text" name="numero" value={formData.numero} onChange={handleChange} />
                        </section>

                        <section className="form-section">
                            <label>Observações</label>
                            <textarea name="observacoes" value={formData.observacoes} onChange={handleChange}></textarea>
                        </section>

                        <div className="form-buttons">
                            <button type="submit" disabled={salvando} style={{ opacity: salvando ? 0.7 : 1, cursor: salvando ? 'not-allowed' : 'pointer' }}>
                                {salvando ? 'Salvando...' : (clienteEmEdicao ? 'Atualizar Cliente' : 'Salvar Cliente')}
                            </button>
                            {/* O botão de cancelar retorna para a aba de consulta */}
                            {clienteEmEdicao && (
                                <button type="button" className="btn-cancel" disabled={salvando} onClick={() => { limparFormulario(); setAbaAtiva('consulta'); }}>
                                    Cancelar Edição
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* CONTEÚDO DA ABA DE CONSULTA */}
            {abaAtiva === 'consulta' && (
                <section className="lista-clientes">
                    {/* Barra de Pesquisa */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', background: 'var(--panel)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <h2 style={{ margin: 0 }}>Cadastrados ({clientesFiltrados.length})</h2>
                        <input 
                            type="text" 
                            placeholder="Pesquisar por nome, telefone, email ou documento..." 
                            value={termoBusca}
                            onChange={(e) => setTermoBusca(e.target.value)}
                            style={{ maxWidth: '400px', width: '100%', padding: '10px 15px', borderRadius: '4px', border: '1px solid var(--border)', outline: 'none' }}
                        />
                    </div>

                    <div id="listaClientes">
                        {clientesFiltrados.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-soft)' }}>
                                Nenhum cliente encontrado com os filtros atuais.
                            </p>
                        ) : (
                            clientesFiltrados.map((cliente) => (
                                <div key={cliente.id} className="cliente-card">
                                    <h3>{cliente.nome}</h3>
                                    <p><strong>Telefone:</strong> {cliente.telefone}</p>
                                    <p><strong>E-mail:</strong> {cliente.email || "Não informado"}</p>
                                    
                                    {/* Exibição explícita e organizada do endereço */}
                                    <div style={{ background: 'var(--panel)', padding: '10px', borderLeft: '3px solid var(--primary)', borderRadius: '4px', marginTop: '10px', marginBottom: '10px', fontSize: '0.9rem' }}>
                                        <p style={{ margin: '0 0 5px 0' }}>
                                            <strong>Rua/Logradouro:</strong> {cliente.rua || "Não informada"}{cliente.numero ? `, nº ${cliente.numero}` : ''}
                                        </p>
                                        <p style={{ margin: '0 0 5px 0' }}>
                                            <strong>Bairro/Cidade:</strong> {cliente.bairro || "-"} / {cliente.cidade || "-"}
                                        </p>
                                        <p style={{ margin: 0 }}><strong>CEP:</strong> {cliente.cep || "Não informado"}</p>
                                    </div>

                                    {cliente.observacoes && <p><strong>Obs:</strong> {cliente.observacoes}</p>}
                                    
                                    {/* Botões de Ação */}
                                    <div className="card-actions">
                                        <button type="button" className="btn-action btn-edit" onClick={() => handleEditar(cliente)}>
                                            Editar
                                        </button>
                                        <button type="button" className="btn-action btn-delete" onClick={() => setClienteParaExcluir(cliente.id)}>
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            )}

            {/* Modal de Confirmação de Exclusão */}
            {clienteParaExcluir && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Confirmar Exclusão</h3>
                        <p>Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.</p>
                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={() => setClienteParaExcluir(null)}>
                                Cancelar
                            </button>
                            <button type="button" className="btn-delete" onClick={confirmarExclusao}>
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}