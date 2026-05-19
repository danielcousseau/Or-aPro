import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function Cadastro() {
    const [nome, setNome] = useState('');
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');
    const navigate = useNavigate();

    const handleCadastro = async (e) => {
        e.preventDefault();
        setErro('');
        setCarregando(true);

        try {
            await api.post('/registrar', {
                nome: nome.trim(),
                usuario: usuario.trim(),
                senha
            });

            toast.success('Conta criada com sucesso! Você já pode fazer login.');
            navigate('/login');
        } catch (error) {
            setErro(error.response?.data?.error || 'Erro ao criar conta. Tente novamente.');
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="cliente-card" style={{ maxWidth: '400px', width: '100%', padding: '30px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--primary)' }}>Criar Conta</h2>
                
                {erro && (
                    <div style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontSize: '0.95rem', fontWeight: '500' }}>
                        ⚠️ {erro}
                    </div>
                )}
                
                <form onSubmit={handleCadastro}>
                    <section className="form-section">
                        <label>Nome Completo ou Marcenaria</label>
                        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Marcenaria Silva" required />
                    </section>
                    <section className="form-section">
                        <label>Nome de Usuário (Login)</label>
                        <input type="text" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Ex: silva.moveis" required />
                    </section>
                    <section className="form-section">
                        <label>Senha</label>
                        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo de 6 caracteres" required minLength={6} />
                    </section>
                    <button type="submit" disabled={carregando} style={{ width: '100%', marginTop: '15px', padding: '12px', opacity: carregando ? 0.7 : 1, cursor: carregando ? 'not-allowed' : 'pointer' }}>
                        {carregando ? 'Criando conta...' : 'Registrar'}
                    </button>
                </form>
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <span style={{ color: 'var(--text-soft)' }}>Já tem uma conta? </span>
                    <button type="button" onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                        Fazer login
                    </button>
                </div>
            </div>
        </div>
    );
}