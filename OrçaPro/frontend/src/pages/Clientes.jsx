import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [clienteEmEdicao, setClienteEmEdicao] = useState(null); // Guarda o cliente que está sendo editado
    const [clienteParaExcluir, setClienteParaExcluir] = useState(null); // Guarda o ID do cliente para o modal de exclusão
    
    // State único para o formulário
    const [formData, setFormData] = useState({
        nome: '',
        cpfCnpj: '',
        email: '',
        telefone: '',
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
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const limparFormulario = () => {
        setFormData({
            nome: '', cpfCnpj: '', email: '', telefone: '',
            cidade: '', bairro: '', numero: '', cep: '', observacoes: ''
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
            cidade: cliente.cidade || '',
            bairro: cliente.bairro || '',
            numero: cliente.numero || '',
            cep: cliente.cep || '',
            observacoes: cliente.observacoes || ''
        });
        window.scrollTo(0, 0); // Rola para o topo para o usuário ver o formulário preenchido
    };

    const confirmarExclusao = async () => {
        if (!clienteParaExcluir) return;
        try {
            await api.delete(`/clientes/${clienteParaExcluir}`);
            alert('Cliente excluído com sucesso!');
            setClienteParaExcluir(null);
            carregarClientes();
        } catch (error) {
            alert('Erro ao excluir cliente.');
            setClienteParaExcluir(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            clienteEmEdicao
                ? await api.put(`/clientes/${clienteEmEdicao.id}`, formData)
                : await api.post('/clientes', formData);

            alert(`Cliente ${clienteEmEdicao ? 'atualizado' : 'salvo'} com sucesso!`);
            limparFormulario();
            carregarClientes();
        } catch (error) {
            console.error("Erro detalhado do backend:", error.response?.data || error.message);
            alert('Erro ao salvar cliente. Verifique o console (F12).');
        }
    };

    return (
        <div>
            <h1>{clienteEmEdicao ? 'Editar Cliente' : 'Cadastro de Cliente'}</h1>
            
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
                    <label>CEP</label>
                    <input type="text" name="cep" value={formData.cep} onChange={handleChange} />
                </section>

                <section className="form-section">
                    <label>Observações</label>
                    <textarea name="observacoes" value={formData.observacoes} onChange={handleChange}></textarea>
                </section>

                <div className="form-buttons">
                    <button type="submit">
                        {clienteEmEdicao ? 'Atualizar Cliente' : 'Salvar Cliente'}
                    </button>
                    {/* O botão de cancelar só aparece durante a edição */}
                    {clienteEmEdicao && (
                        <button type="button" className="btn-cancel" onClick={limparFormulario}>Cancelar Edição</button>
                    )}
                </div>
            </form>

            <section className="lista-clientes">
                <h2>Clientes Cadastrados</h2>
                <div id="listaClientes">
                    {clientes.length === 0 ? (
                        <p>Nenhum cliente cadastrado.</p>
                    ) : (
                        clientes.map((cliente) => (
                            <div key={cliente.id} className="cliente-card">
                                <h3>{cliente.nome}</h3>
                                <p><strong>Telefone:</strong> {cliente.telefone}</p>
                                <p><strong>E-mail:</strong> {cliente.email || "Não informado"}</p>
                                {(() => {
                                    let enderecoParts = [];
                                    if (cliente.cidade) enderecoParts.push(cliente.cidade);
                                    if (cliente.bairro) enderecoParts.push(cliente.bairro);
                                    
                                    let enderecoStr = enderecoParts.join(", ");
                                    if (cliente.numero) enderecoStr += (enderecoStr ? " - " : "") + cliente.numero;
                                    if (cliente.cep) enderecoStr += (enderecoStr ? ". " : "") + "CEP: " + cliente.cep;
                                    
                                    return enderecoStr ? <p><strong>Endereço:</strong> {enderecoStr}</p> : null;
                                })()}
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