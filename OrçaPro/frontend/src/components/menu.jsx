import { Link, useLocation } from 'react-router-dom';

export default function Menu() {
    const location = useLocation();

    // Função simples para destacar o botão da página atual no menu
    const isActive = (path) => {
        if (location.pathname === path || (path === '/orcamento' && location.pathname.startsWith('/orcamento'))) {
            return { 
                color: 'var(--primary)', 
                background: 'var(--panel-soft)',
                borderColor: 'var(--border)'
            };
        }
        return {};
    };

    return (
        <nav className="menu no-print" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            {/* LOGO DA EMPRESA */}
            <div>
                <Link to="/" style={{ padding: 0, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center' }}>
                    <img 
                        src="/logo-orcapro.png" 
                        alt="Logo da Empresa" 
                        style={{ height: '80px', objectFit: 'contain' }} 
                    />
                </Link>
            </div>

            {/* LINKS DE NAVEGAÇÃO */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Link to="/" style={isActive('/')}>Dashboard</Link>
                <Link to="/clientes" style={isActive('/clientes')}>Clientes</Link>
                <Link to="/materiais" style={isActive('/materiais')}>Materiais</Link>
                <Link to="/orcamento" style={isActive('/orcamento')}>Novo Orçamento</Link>
                <Link to="/historico" style={isActive('/historico')}>Histórico</Link>
                <Link to="/kanban" style={isActive('/kanban')}>Produção (Kanban)</Link>
            </div>
        </nav>
    );
}