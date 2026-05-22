import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function EsqueciSenha() {
    const [usuario, setUsuario] = useState('');
    const [enviado, setEnviado] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setCarregando(true);
        try {
            await api.post('/forgot-password', { usuario: usuario.trim() });
            setEnviado(true);
        } catch {
            setEnviado(true);
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <div className="cliente-card" style={{ maxWidth: '400px', width: '100%', padding: '30px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '8px', color: 'var(--primary)' }}>Recuperar Senha</h2>

                {enviado ? (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-soft)', marginBottom: '24px', lineHeight: '1.6' }}>
                            Se este usuário existir e tiver um e-mail cadastrado, você receberá as instruções de redefinição em breve.
                        </p>
                        <button onClick={() => navigate('/login')} style={{ width: '100%' }}>
                            Voltar ao Login
                        </button>
                    </div>
                ) : (
                    <>
                        <p style={{ color: 'var(--text-soft)', marginBottom: '24px', fontSize: '0.9rem', textAlign: 'center' }}>
                            Informe seu usuário e enviaremos um link para o e-mail cadastrado na sua conta.
                        </p>
                        <form onSubmit={handleSubmit}>
                            <section className="form-section">
                                <label>Usuário</label>
                                <input
                                    type="text"
                                    value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    placeholder="Digite seu nome de usuário"
                                    required
                                    autoFocus
                                />
                            </section>
                            <button
                                type="submit"
                                disabled={carregando}
                                style={{ width: '100%', marginTop: '8px', opacity: carregando ? 0.7 : 1, cursor: carregando ? 'not-allowed' : 'pointer' }}
                            >
                                {carregando ? 'Enviando...' : 'Enviar Link de Redefinição'}
                            </button>
                        </form>
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <button type="button" className="btn-link" onClick={() => navigate('/login')} style={{ fontSize: '0.85rem' }}>
                                Voltar ao Login
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
