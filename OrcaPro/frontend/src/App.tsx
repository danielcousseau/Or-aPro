import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import api from './services/api';
import Menu from './components/Menu';
import Clientes from './pages/Clientes';
import Dashboard from './pages/Dashboard';
import NovoOrcamento from './pages/NovoOrcamento';
import Historico from './pages/Historico';
import ImprimirOrcamento from './pages/ImprimirOrcamento';
import Materiais from './pages/Materiais';
import Kanban from './pages/Kanban';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Perfil from './pages/Perfil';
import Proposta from './pages/Proposta';
import EsqueciSenha from './pages/EsqueciSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import Admin from './pages/Admin';
import FormasPagamento from './pages/FormasPagamento';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { User } from './types';

function RotaProtegida({ children }: { children: React.ReactNode }) {
    const user = localStorage.getItem('@OrcaPro:user');
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
}

function LayoutSistema({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [perfilAberto, setPerfilAberto] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
        try {
            const stored = localStorage.getItem('@OrcaPro:user');
            return stored ? ((JSON.parse(stored) as User)?.avatar ?? null) : null;
        } catch {
            return null;
        }
    });
    const perfilRef = useRef<HTMLDivElement>(null);
    const isLoginPage = location.pathname === '/login';
    const isCadastroPage = location.pathname === '/cadastro';
    const isPrintPage = location.pathname.startsWith('/imprimir/');
    const isPropostaPage = location.pathname.startsWith('/proposta/');
    const isAuthAuxPage = location.pathname === '/esqueci-senha' || location.pathname === '/redefinir-senha';
    const userStorage = localStorage.getItem('@OrcaPro:user');

    let user: User | null = null;
    try {
        user = userStorage ? (JSON.parse(userStorage) as User) : null;
    } catch (error) {
        console.error("Falha ao ler dados do usuário. Limpando sessão.");
        localStorage.removeItem('@OrcaPro:user');
        localStorage.removeItem('@OrcaPro:token');
    }

    useEffect(() => {
        if (user) {
            api.get('/me').then(({ data }: { data: User }) => {
                if (data.avatar) {
                    setAvatarUrl(data.avatar);
                    const stored = localStorage.getItem('@OrcaPro:user');
                    if (stored) localStorage.setItem('@OrcaPro:user', JSON.stringify({ ...JSON.parse(stored) as User, avatar: data.avatar }));
                }
            }).catch(() => {});
        }
    }, []);

    useEffect(() => {
        const handleAvatarUpdate = (e: Event) => setAvatarUrl((e as CustomEvent<string | null>).detail);
        window.addEventListener('avatarAtualizado', handleAvatarUpdate);
        return () => window.removeEventListener('avatarAtualizado', handleAvatarUpdate);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (perfilRef.current && !perfilRef.current.contains(event.target as Node)) {
                setPerfilAberto(false);
            }
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setPerfilAberto(false);
            }
        }
        if (perfilAberto) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [perfilAberto]);

    const handleLogout = async () => {
        try {
            await api.post('/logout');
        } catch {
            // segue mesmo se a chamada falhar
        }
        localStorage.removeItem('@OrcaPro:user');
        localStorage.removeItem('@OrcaPro:refreshToken');
        window.location.href = '/login';
    };

    return (
        <>
            {!isLoginPage && !isCadastroPage && !isPrintPage && !isPropostaPage && !isAuthAuxPage && (
                <>
                    <div style={{
                        maxWidth: '1200px',
                        margin: '15px auto 0',
                        padding: '0 18px',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        {user && (
                            <div style={{ position: 'relative' }} ref={perfilRef}>
                                <button
                                    onClick={() => setPerfilAberto(!perfilAberto)}
                                    style={{
                                        width: '42px', height: '42px', borderRadius: '50%',
                                        background: 'var(--primary)', color: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold', fontSize: '1.1rem', padding: 0, minHeight: 'auto',
                                        border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-soft)'
                                    }}
                                    title="Meu Perfil"
                                >
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        user.nome ? user.nome.charAt(0).toUpperCase() : 'U'
                                    )}
                                </button>

                                {perfilAberto && (
                                    <div style={{
                                        position: 'absolute', top: '50px', right: '0',
                                        background: 'var(--panel)', border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-md)', padding: '16px',
                                        boxShadow: 'var(--shadow-main)', zIndex: 100,
                                        minWidth: '200px', textAlign: 'center'
                                    }}>
                                        <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                            {user.nome || user.usuario}
                                        </p>
                                        <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: 'var(--text-soft)' }}>
                                            @{user.usuario}
                                        </p>
                                        <hr style={{ margin: '12px 0', borderTop: '1px solid var(--border)' }} />
                                        <button onClick={() => { setPerfilAberto(false); navigate('/perfil'); }} className="btn-edit" style={{ width: '100%', minHeight: 'auto', padding: '10px', fontSize: '0.85rem', marginBottom: '8px' }}>
                                            Editar Perfil
                                        </button>
                                        <button onClick={handleLogout} className="btn-delete" style={{ width: '100%', minHeight: 'auto', padding: '10px', fontSize: '0.85rem' }}>
                                            Sair do Sistema
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <Menu />
                </>
            )}
            <main className={!isLoginPage && !isCadastroPage && !isPrintPage && !isPropostaPage && !isAuthAuxPage ? "container" : ""}>
                {children}
            </main>
        </>
    );
}

export default function App() {
    return (
        <>
            <BrowserRouter>
                <LayoutSistema>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/cadastro" element={<Cadastro />} />
                        <Route path="/proposta/:token" element={<Proposta />} />
                        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
                        <Route path="/redefinir-senha" element={<RedefinirSenha />} />

                        <Route path="/" element={<RotaProtegida><Dashboard /></RotaProtegida>} />
                        <Route path="/clientes" element={<RotaProtegida><Clientes /></RotaProtegida>} />
                        <Route path="/materiais" element={<RotaProtegida><Materiais /></RotaProtegida>} />
                        <Route path="/orcamento" element={<RotaProtegida><NovoOrcamento /></RotaProtegida>} />
                        <Route path="/orcamento/:id" element={<RotaProtegida><NovoOrcamento /></RotaProtegida>} />
                        <Route path="/historico" element={<RotaProtegida><Historico /></RotaProtegida>} />
                        <Route path="/perfil" element={<RotaProtegida><Perfil /></RotaProtegida>} />
                        <Route path="/imprimir/:id" element={<RotaProtegida><ImprimirOrcamento /></RotaProtegida>} />
                        <Route path="/kanban" element={<RotaProtegida><Kanban /></RotaProtegida>} />
                        <Route path="/admin" element={<RotaProtegida><Admin /></RotaProtegida>} />
                        <Route path="/formas-pagamento" element={<RotaProtegida><FormasPagamento /></RotaProtegida>} />
                    </Routes>
                </LayoutSistema>
            </BrowserRouter>
            <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
        </>
    );
}
