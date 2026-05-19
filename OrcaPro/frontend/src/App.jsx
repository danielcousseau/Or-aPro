import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Menu from './components/Menu';
import Clientes from './pages/Clientes';
import Dashboard from './pages/Dashboard';
import NovoOrcamento from './pages/NovoOrcamento';
import Historico from './pages/Historico';
import ImprimirOrcamento from './pages/ImprimirOrcamento';
import Materiais from './pages/Materiais';
import Kanban from './pages/Kanban';
import Login from './pages/Login';
import Proposta from './pages/Proposta'; // [Feature] Importa a tela pública do cliente
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 1. Guarda de Segurança: Protege as rotas verificando se o Token existe
function RotaProtegida({ children }) {
    const token = localStorage.getItem('@OrcaPro:token');
    if (!token) {
        // Se não tem login/token, joga o invasor para a tela de Login
        return <Navigate to="/login" replace />;
    }
    return children;
}

// 2. Layout do Sistema: Esconde o Menu no Login e adiciona o botão de Sair
function LayoutSistema({ children }) {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';
    // [Correção] Adicionamos uma verificação para a rota de impressão.
    // Qualquer URL que comece com /imprimir/ será considerada uma página de impressão.
    const isPrintPage = location.pathname.startsWith('/imprimir/');
    // Verifica se é a tela pública da proposta (sem menu do sistema)
    const isPropostaPage = location.pathname.startsWith('/proposta/');
    // Puxa os dados do usuário do localStorage (se existirem)
    const userStorage = localStorage.getItem('@OrcaPro:user');
    
    let user = null;
    try {
        // [SecOps] Previne que um localStorage corrompido crashe a aplicação inteira
        user = userStorage ? JSON.parse(userStorage) : null;
    } catch (error) {
        console.error("Falha ao ler dados do usuário. Limpando sessão.");
        localStorage.removeItem('@OrcaPro:user');
        localStorage.removeItem('@OrcaPro:token');
    }

    const handleLogout = () => {
        localStorage.removeItem('@OrcaPro:token'); // Apaga o crachá
        localStorage.removeItem('@OrcaPro:user'); // Apaga os dados do usuário
        window.location.href = '/login'; // Volta pro login e recarrega a página
    };

    return (
        <>
            {/* O Layout (Menu superior) não deve aparecer no Login, na Impressão, nem na Proposta Pública */}
            {!isLoginPage && !isPrintPage && !isPropostaPage && (
                <>
                    {/* Topbar do Usuário (Elegante e Harmônica) */}
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
                            <div style={{ 
                                display: 'flex', alignItems: 'center', gap: '8px', 
                                background: 'var(--panel)', padding: '6px 16px', 
                                borderRadius: '999px', border: '1px solid var(--border)',
                                boxShadow: 'var(--shadow-soft)'
                            }}>
                                <div style={{ 
                                    width: '26px', height: '26px', borderRadius: '50%', 
                                    background: 'var(--primary)', color: '#fff', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    fontWeight: 'bold', fontSize: '0.85rem'
                                }}>
                                    {user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                    {user.nome || user.usuario}
                                </span>
                            </div>
                        )}
                        
                        <button onClick={handleLogout} className="btn-cancel" style={{ 
                            padding: '6px 16px', minHeight: 'auto', borderRadius: '999px', 
                            fontSize: '0.85rem', fontWeight: 'bold' 
                        }}>
                            Sair
                        </button>
                    </div>
                    
                    <Menu />
                </>
            )}
            <main className={!isLoginPage && !isPrintPage && !isPropostaPage ? "container" : ""}>
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
                        {/* Rota Pública (Aba de Autenticação) */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/proposta/:token" element={<Proposta />} /> {/* Rota Pública do Cliente */}
                        
                        {/* Rotas Privadas (Blindadas pelo RotaProtegida) */}
                        <Route path="/" element={<RotaProtegida><Dashboard /></RotaProtegida>} />
                        <Route path="/clientes" element={<RotaProtegida><Clientes /></RotaProtegida>} />
                        <Route path="/materiais" element={<RotaProtegida><Materiais /></RotaProtegida>} />
                        <Route path="/orcamento" element={<RotaProtegida><NovoOrcamento /></RotaProtegida>} />
                        <Route path="/orcamento/:id" element={<RotaProtegida><NovoOrcamento /></RotaProtegida>} />
                        <Route path="/historico" element={<RotaProtegida><Historico /></RotaProtegida>} />
                        <Route path="/imprimir/:id" element={<RotaProtegida><ImprimirOrcamento /></RotaProtegida>} />
                        <Route path="/kanban" element={<RotaProtegida><Kanban /></RotaProtegida>} />
                    </Routes>
                </LayoutSistema>
            </BrowserRouter>
            {/* Configuração global do Toast (Pode mudar a posição, ex: bottom-right) */}
            <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
        </>
    );
}