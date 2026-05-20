import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function Login() {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false); // [UX/SecOps] Trava o botão contra spam
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErro(''); // Limpa os erros anteriores
        setCarregando(true);
        
        // [SecOps] Higiene de sessão: garante que não há tokens velhos antes de autenticar
        localStorage.removeItem('@OrcaPro:token');
        localStorage.removeItem('@OrcaPro:user');
        
        try {
            // [Clean Code] O trim() salva a vida de usuários mobile que colocam espaço acidental no fim do nome
            const response = await api.post('/login', { 
                usuario: usuario.trim(), 
                senha 
            });
            
            // [SecOps] Armadilha para Falsos Positivos
            if (!response.data || !response.data.token) {
                setErro(response.data?.error || response.data?.message || 'O servidor não gerou o token de acesso.');
                return;
            }

            // [SecOps] Blindagem contra dados indefinidos da API
            const token = response.data.token;
            const userData = response.data.user || {
                nome: response.data.nome || response.data.name || usuario,
                usuario: usuario
            };
            localStorage.setItem('@OrcaPro:token', token);
            localStorage.setItem('@OrcaPro:user', JSON.stringify(userData));
            
            // Redireciona para o Histórico (ou para a página que preferir)
            navigate('/historico'); 
        } catch (error) {
            const mensagemErro = error.response?.data?.error || 'Usuário ou senha inválidos. Tente novamente.';
            setErro(mensagemErro);
            toast.error(mensagemErro);
        } finally {
            setCarregando(false); // [Clean Code] Libera a tela independentemente de dar erro ou sucesso
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <div className="cliente-card" style={{ maxWidth: '400px', width: '100%', padding: '30px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--primary)' }}>Entrar no OrçaPro</h2>
                
                {erro && (
                    <div style={{ 
                        background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', 
                        padding: '12px', borderRadius: '8px', marginBottom: '20px', 
                        textAlign: 'center', fontSize: '0.95rem', fontWeight: '500' 
                    }}>
                        ⚠️ {erro}
                    </div>
                )}
                
                <form onSubmit={handleLogin}>
                    <section className="form-section">
                        <label>Usuário</label>
                        <input type="text" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Digite seu usuário" required />
                    </section>
                    
                    <section className="form-section">
                        <label>Senha</label>
                        <div className="input-wrapper">
                            <input type={mostrarSenha ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="******" required />
                            <button type="button" className="btn-eye" onClick={() => setMostrarSenha(!mostrarSenha)} tabIndex="-1" title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}>
                                {mostrarSenha ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLineJoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLineJoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>
                        </div>
                    </section>
                    
                    <div style={{ textAlign: 'right', marginTop: '-10px', marginBottom: '15px' }}>
                        <button type="button" className="btn-link" onClick={() => toast.info('Para redefinir sua senha, entre em contato com o administrador do sistema.')} style={{ fontSize: '0.85rem' }}>
                            Esqueceu a senha?
                        </button>
                    </div>

                    <button 
                        type="submit" 
                        disabled={carregando} 
                        style={{ width: '100%', marginTop: '15px', padding: '12px', opacity: carregando ? 0.7 : 1, cursor: carregando ? 'not-allowed' : 'pointer' }}
                    >
                        {carregando ? 'Autenticando...' : 'Entrar'}
                    </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <span style={{ color: 'var(--text-soft)' }}>Ainda não tem uma conta? </span>
                    <button type="button" className="btn-link" onClick={() => navigate('/cadastro')}>
                        Criar conta
                    </button>
                </div>
            </div>
        </div>
    );
}