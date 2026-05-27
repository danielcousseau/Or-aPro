import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import Contrato from './pages/Contrato';
import EsqueciSenha from './pages/EsqueciSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import Admin from './pages/Admin';
import FormasPagamento from './pages/FormasPagamento';
import Financeiro from './pages/Financeiro';
import OrdemProducao from './pages/OrdemProducao';
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
    const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
        try {
            const stored = localStorage.getItem('@OrcaPro:user');
            return stored ? ((JSON.parse(stored) as User)?.avatar ?? null) : null;
        } catch {
            return null;
        }
    });

    const isLoginPage = location.pathname === '/login';
    const isCadastroPage = location.pathname === '/cadastro';
    const isPrintPage = location.pathname.startsWith('/imprimir/') || location.pathname.startsWith('/ordem-producao/');
    const isPropostaPage = location.pathname.startsWith('/proposta/') || location.pathname.startsWith('/contrato/');
    const isAuthAuxPage = location.pathname === '/esqueci-senha' || location.pathname === '/redefinir-senha';
    const isPublicPage = isLoginPage || isCadastroPage || isPrintPage || isPropostaPage || isAuthAuxPage;

    const userStorage = localStorage.getItem('@OrcaPro:user');
    let user: User | null = null;
    try {
        user = userStorage ? (JSON.parse(userStorage) as User) : null;
    } catch {
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

    if (isPublicPage) {
        return <main>{children}</main>;
    }

    return (
        <div className="app-shell">
            <Menu user={user} avatarUrl={avatarUrl} onLogout={handleLogout} />
            <div className="app-main">
                <main className="container">
                    {children}
                </main>
            </div>
        </div>
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
                        <Route path="/contrato/:token" element={<Contrato />} />
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
                        <Route path="/financeiro" element={<RotaProtegida><Financeiro /></RotaProtegida>} />
                        <Route path="/ordem-producao/:id" element={<RotaProtegida><OrdemProducao /></RotaProtegida>} />
                    </Routes>
                </LayoutSistema>
            </BrowserRouter>
            <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
        </>
    );
}
