import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CORES_ACAO = {
    'criou':            { bg: '#dcfce7', color: '#166534' },
    'atualizou':        { bg: '#dbeafe', color: '#1e40af' },
    'atualizou status': { bg: '#e0e7ff', color: '#3730a3' },
    'excluiu':          { bg: '#fee2e2', color: '#991b1b' },
    'login':            { bg: '#fef9c3', color: '#854d0e' },
};

function formatarData(iso) {
    return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

export default function Admin() {
    const [logs, setLogs] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [filtroUsuario, setFiltroUsuario] = useState('');
    const [filtroRecurso, setFiltroRecurso] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/audit-log/admin')
            .then(({ data }) => setLogs(data))
            .catch((err) => {
                if (err.response?.status === 403) navigate('/');
            })
            .finally(() => setCarregando(false));
    }, []);

    const usuarios = [...new Set(logs.map(l => l.user?.usuario).filter(Boolean))].sort();
    const recursos = [...new Set(logs.map(l => l.recurso).filter(Boolean))].sort();

    const logsFiltrados = logs.filter(l => {
        const matchUsuario = !filtroUsuario || l.user?.usuario === filtroUsuario;
        const matchRecurso = !filtroRecurso || l.recurso === filtroRecurso;
        return matchUsuario && matchRecurso;
    });

    return (
        <div>
            <div className="page-header">
                <h1>Painel Admin</h1>
            </div>

            <div className="cliente-card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select value={filtroUsuario} onChange={e => setFiltroUsuario(e.target.value)} style={{ flex: 1, minWidth: '160px' }}>
                        <option value="">Todos os usuários</option>
                        {usuarios.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <select value={filtroRecurso} onChange={e => setFiltroRecurso(e.target.value)} style={{ flex: 1, minWidth: '140px' }}>
                        <option value="">Todos os recursos</option>
                        {recursos.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {(filtroUsuario || filtroRecurso) && (
                        <button type="button" className="btn-cancel" onClick={() => { setFiltroUsuario(''); setFiltroRecurso(''); }}>
                            Limpar filtros
                        </button>
                    )}
                    <span style={{ color: 'var(--text-soft)', fontSize: '0.85rem', marginLeft: 'auto' }}>
                        {logsFiltrados.length} eventos
                    </span>
                </div>
            </div>

            <div className="cliente-card">
                {carregando ? (
                    <p style={{ color: 'var(--text-soft)', textAlign: 'center', padding: '30px' }}>Carregando...</p>
                ) : logsFiltrados.length === 0 ? (
                    <p style={{ color: 'var(--text-soft)', textAlign: 'center', padding: '30px' }}>Nenhum evento encontrado.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {logsFiltrados.map(log => {
                            const estilo = CORES_ACAO[log.acao] || { bg: 'var(--panel-soft)', color: 'var(--text-main)' };
                            return (
                                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', background: 'var(--panel-soft)', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                        @{log.user?.usuario}
                                    </span>
                                    <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold', background: estilo.bg, color: estilo.color, whiteSpace: 'nowrap' }}>
                                        {log.acao}
                                    </span>
                                    <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>{log.recurso}</span>
                                    {log.detalhe && (
                                        <span style={{ color: 'var(--text-soft)', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {log.detalhe}
                                        </span>
                                    )}
                                    <span style={{ color: 'var(--text-soft)', fontSize: '0.75rem', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                                        {formatarData(log.criadoEm)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
