import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErro(''); // Limpa os erros anteriores
        
        try {
            // Faz a requisição para a rota de login no backend
            const response = await api.post('/login', { usuario, senha });
            
            // Se deu certo, salva o token e os dados do usuário no LocalStorage
            localStorage.setItem('@OrcaPro:token', response.data.token);
            localStorage.setItem('@OrcaPro:user', JSON.stringify(response.data.user));
            
            // Redireciona para o Histórico (ou para a página que preferir)
            navigate('/historico'); 
        } catch (error) {
            setErro('Usuário ou senha inválidos.');
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
                    
                    <button type="submit" style={{ width: '100%', marginTop: '15px', padding: '12px' }}>Entrar</button>
                </form>
            </div>
        </div>
    );
}