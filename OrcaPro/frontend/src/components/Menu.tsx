import { Link, useLocation } from 'react-router-dom';

export default function Menu() {
    const location = useLocation();

    const isActive = (path: string): React.CSSProperties => {
        if (location.pathname === path || (path === '/orcamento' && location.pathname.startsWith('/orcamento'))) {
            return { color: 'var(--primary)', background: 'var(--panel-soft)', borderColor: 'var(--border)' };
        }
        return {};
    };

    return (
        <nav className="menu no-print">
            <Link to="/" className="menu-logo">
                <img src="/icon-192.png" alt="OrçaPro" />
                <span className="menu-logo-text"><span style={{ color: '#8B6035' }}>Orça</span><span style={{ color: '#2C2C2C' }}>Pro</span></span>
            </Link>

            <div className="menu-links">
                <Link to="/" style={isActive('/')}>Dashboard</Link>
                <Link to="/clientes" style={isActive('/clientes')}>Clientes</Link>
                <Link to="/materiais" style={isActive('/materiais')}>Materiais</Link>
                <Link to="/orcamento" style={isActive('/orcamento')}>Novo Orçamento</Link>
                <Link to="/historico" style={isActive('/historico')}>Histórico</Link>
                <Link to="/kanban" style={isActive('/kanban')}>Produção</Link>
            </div>
        </nav>
    );
}
