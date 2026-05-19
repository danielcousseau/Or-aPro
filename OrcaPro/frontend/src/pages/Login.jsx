import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false); // [UX/SecOps] Trava o botão contra spam
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
            
            // [SecOps] Armadilha para Falsos Positivos: Verifica se a API realmente mandou o token
            if (!response.data || !response.data.token) {
                setErro(response.data?.error || response.data?.message || 'O servidor não gerou o token de acesso. Verifique as credenciais.');
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
            setErro('Usuário ou senha inválidos.');
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
                        <input type="text" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="admin" required />
                    </section>
                    
                    <section className="form-section">
                        <label>Senha</label>
                        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="******" required />
                    </section>
                    
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
                    <button type="button" onClick={() => navigate('/cadastro')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                        Criar conta
                    </button>
                </div>
            </div>
        </div>
    );
}