import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function Cadastro() {
    const [nome, setNome] = useState('');
    const [usuario, setUsuario] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
    const [erro, setErro] = useState('');
    const [turnstileToken, setTurnstileToken] = useState('');
    const turnstileRef = useRef(null);
    const navigate = useNavigate();

    const handleCadastro = async (e) => {
        e.preventDefault();
        setErro('');
        setCarregando(true);

        if (senha !== confirmarSenha) {
            setErro('As senhas não coincidem. Verifique e tente novamente.');
            setCarregando(false);
            return;
        }

        if (!turnstileToken) {
            setErro('Complete o desafio de segurança antes de continuar.');
            setCarregando(false);
            return;
        }

        try {
            await api.post('/registrar', {
                nome: nome.trim(),
                usuario: usuario.trim(),
                email: email.trim() || undefined,
                senha,
                turnstileToken
            });

            toast.success('Conta criada com sucesso! Você já pode fazer login.');
            navigate('/login');
        } catch (error) {
            setErro(error.response?.data?.error || 'Erro ao criar conta. Tente novamente.');
            turnstileRef.current?.reset();
            setTurnstileToken('');
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
                        <label>E-mail</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '6px' }}>
                            Usado para recuperação de senha caso esqueça o acesso.
                        </p>
                    </section>
                    <section className="form-section">
                        <label>Senha</label>
                        <div className="input-wrapper">
                            <input type={mostrarSenha ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo de 6 caracteres" required minLength={6} />
                            <button type="button" className="btn-eye" onClick={() => setMostrarSenha(!mostrarSenha)} tabIndex="-1">
                                {mostrarSenha ? (
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLineJoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ) : (
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLineJoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>
                        </div>
                    </section>
                    <section className="form-section">
                        <label>Confirmar Senha</label>
                        <div className="input-wrapper">
                            <input type={mostrarConfirmar ? "text" : "password"} value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Digite a senha novamente" required minLength={6} />
                            <button type="button" className="btn-eye" onClick={() => setMostrarConfirmar(!mostrarConfirmar)} tabIndex="-1">
                                {mostrarConfirmar ? (
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLineJoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ) : (
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLineJoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>
                        </div>
                    </section>
                    <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center' }}>
                        <Turnstile
                            ref={turnstileRef}
                            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                            onSuccess={setTurnstileToken}
                            onError={() => setTurnstileToken('')}
                            onExpire={() => setTurnstileToken('')}
                            options={{ theme: 'light', language: 'pt-BR' }}
                        />
                    </div>
                    <button type="submit" disabled={carregando} style={{ width: '100%', marginTop: '15px', padding: '12px', opacity: carregando ? 0.7 : 1, cursor: carregando ? 'not-allowed' : 'pointer' }}>
                        {carregando ? 'Criando conta...' : 'Registrar'}
                    </button>
                </form>
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <span style={{ color: 'var(--text-soft)' }}>Já tem uma conta? </span>
                    <button type="button" className="btn-link" onClick={() => navigate('/login')}>
                        Fazer login
                    </button>
                </div>
            </div>
        </div>
    );
}