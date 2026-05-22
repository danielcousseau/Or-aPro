import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { AuditLog, User } from '../types';

const CORES_ACAO: Record<string, { bg: string; color: string }> = {
    'criou':           { bg: '#dcfce7', color: '#166534' },
    'atualizou':       { bg: '#dbeafe', color: '#1e40af' },
    'atualizou status':{ bg: '#e0e7ff', color: '#3730a3' },
    'excluiu':         { bg: '#fee2e2', color: '#991b1b' },
    'login':           { bg: '#fef9c3', color: '#854d0e' },
};

function formatarData(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

const comprimirImagem = (file: File): Promise<string> => new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
        const MAX = 300;
        let { width: w, height: h } = img;
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = url;
});

export default function Perfil() {
    const [user, setUser] = useState<User>({});
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [nomeMarcenaria, setNomeMarcenaria] = useState('');
    const [salvandoPerfil, setSalvandoPerfil] = useState(false);
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [salvandoSenha, setSalvandoSenha] = useState(false);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [carregandoLogs, setCarregandoLogs] = useState(false);

    useEffect(() => {
        setCarregandoLogs(true);
        api.get('/audit-log')
            .then(({ data }) => setLogs(data))
            .catch(() => {})
            .finally(() => setCarregandoLogs(false));
    }, []);

    useEffect(() => {
        api.get('/me').then(({ data }) => {
            setUser(data);
            setNome(data.nome || '');
            setEmail(data.email || '');
            setNomeMarcenaria(data.nomeMarcenaria || '');
            if (data.avatar) setFotoPreview(data.avatar);
        }).catch(() => {
            const userStorage = localStorage.getItem('@OrcaPro:user');
            if (userStorage) {
                const parsed = JSON.parse(userStorage) as User;
                setUser(parsed);
                setNome(parsed.nome || '');
                setEmail(parsed.email || '');
                setNomeMarcenaria(parsed.nomeMarcenaria || '');
            }
        });
    }, []);

    const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Imagem muito grande. Escolha uma foto de até 5MB.');
            return;
        }

        try {
            const base64 = await comprimirImagem(file);
            setFotoPreview(base64);
            await api.put('/usuarios/perfil', { nome, email, avatar: base64 });
            toast.success('Foto de perfil atualizada!');
            const stored = localStorage.getItem('@OrcaPro:user');
            if (stored) localStorage.setItem('@OrcaPro:user', JSON.stringify({ ...JSON.parse(stored) as User, avatar: base64 }));
            window.dispatchEvent(new CustomEvent('avatarAtualizado', { detail: base64 }));
        } catch {
            toast.error('Erro ao salvar foto. Tente novamente.');
        }
    };

    const handleRemoverFoto = async () => {
        try {
            await api.put('/usuarios/perfil', { nome, email, avatar: null });
            setFotoPreview(null);
            const stored = localStorage.getItem('@OrcaPro:user');
            if (stored) localStorage.setItem('@OrcaPro:user', JSON.stringify({ ...JSON.parse(stored) as User, avatar: null }));
            toast.success('Foto removida.');
            window.dispatchEvent(new CustomEvent('avatarAtualizado', { detail: null }));
        } catch {
            toast.error('Erro ao remover foto.');
        }
    };

    const handlePerfilSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSalvandoPerfil(true);
        try {
            const response = await api.put('/usuarios/perfil', { nome, email, nomeMarcenaria });
            const updated: User = { ...user, email: response.data.email, nome: response.data.nome, nomeMarcenaria: response.data.nomeMarcenaria };
            setUser(updated);
            setNome(response.data.nome || '');
            setNomeMarcenaria(response.data.nomeMarcenaria || '');
            localStorage.setItem('@OrcaPro:user', JSON.stringify(updated));
            toast.success('Perfil atualizado com sucesso!');
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { error?: string } } };
            toast.error(axiosError.response?.data?.error || 'Erro ao atualizar perfil.');
        } finally {
            setSalvandoPerfil(false);
        }
    };

    const handleSenhaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (novaSenha !== confirmarSenha) {
            toast.error('A nova senha e a confirmação não coincidem.');
            return;
        }
        setSalvandoSenha(true);
        try {
            await api.put('/usuarios/senha', { senhaAtual, novaSenha });
            toast.success('Senha atualizada com sucesso!');
            setSenhaAtual('');
            setNovaSenha('');
            setConfirmarSenha('');
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { error?: string } } };
            toast.error(axiosError.response?.data?.error || 'Erro ao atualizar senha. Verifique sua senha atual.');
        } finally {
            setSalvandoSenha(false);
        }
    };

    return (
        <div>
            <h1 style={{ marginBottom: '30px' }}>Meu Perfil</h1>

            <div className="form-grid-1-1">
                <div className="cliente-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'start', width: '100%' }}>
                    <div style={{ width: '130px', height: '130px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', fontWeight: 'bold', marginBottom: '15px', overflow: 'hidden', border: '4px solid var(--panel-soft)', boxShadow: 'var(--shadow-soft)', position: 'relative' }}>
                        {fotoPreview ? (
                            <img src={fotoPreview} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            user.nome ? user.nome.charAt(0).toUpperCase() : 'U'
                        )}
                    </div>

                    <h2 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', textAlign: 'center' }}>{user.nome || user.usuario}</h2>
                    <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: 'var(--text-soft)' }}>@{user.usuario}</p>

                    <label style={{ background: 'var(--panel-soft)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary)', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Trocar Foto
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFotoChange} />
                    </label>

                    {fotoPreview && (
                        <button type="button" onClick={handleRemoverFoto} style={{ marginTop: '10px', background: 'transparent', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-soft)', transition: '0.2s' }}>
                            Remover foto
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="cliente-card">
                        <h2 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px', fontSize: '1.2rem' }}>Dados do Perfil</h2>
                        <form onSubmit={handlePerfilSubmit}>
                            <section className="form-section" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '16px' }}>
                                <label>Nome</label>
                                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" />
                            </section>
                            <section className="form-section" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '16px' }}>
                                <label>E-mail</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '6px' }}>Usado para recuperação de senha. Não será exibido a clientes.</p>
                            </section>
                            <section className="form-section" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '16px' }}>
                                <label>Nome da Marcenaria</label>
                                <input type="text" value={nomeMarcenaria} onChange={(e) => setNomeMarcenaria(e.target.value)} placeholder="Ex: Marcenaria Silva" />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '6px' }}>Aparece na mensagem do WhatsApp enviada ao cliente.</p>
                            </section>
                            <button type="submit" disabled={salvandoPerfil} style={{ width: '100%', opacity: salvandoPerfil ? 0.7 : 1, cursor: salvandoPerfil ? 'not-allowed' : 'pointer' }}>
                                {salvandoPerfil ? 'Salvando...' : 'Salvar Perfil'}
                            </button>
                        </form>
                    </div>

                    <div className="cliente-card">
                        <h2 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px', fontSize: '1.2rem' }}>Segurança e Senha</h2>
                        <form onSubmit={handleSenhaSubmit}>
                            <section className="form-section" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '15px' }}>
                                <label>Senha Atual</label>
                                <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required placeholder="Digite sua senha atual" />
                            </section>
                            <section className="form-section" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '15px' }}>
                                <label>Nova Senha</label>
                                <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required placeholder="Mínimo 6 caracteres" minLength={6} />
                            </section>
                            <section className="form-section" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '25px' }}>
                                <label>Confirmar Nova Senha</label>
                                <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required placeholder="Repita a nova senha" minLength={6} />
                            </section>
                            <button type="submit" disabled={salvandoSenha} style={{ width: '100%', opacity: salvandoSenha ? 0.7 : 1, cursor: salvandoSenha ? 'not-allowed' : 'pointer' }}>
                                {salvandoSenha ? 'Atualizando Segurança...' : 'Atualizar Senha'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <div className="cliente-card" style={{ marginTop: '24px' }}>
                <h2 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px', fontSize: '1.2rem' }}>Histórico de Atividade</h2>

                {carregandoLogs ? (
                    <p style={{ color: 'var(--text-soft)', textAlign: 'center', padding: '20px' }}>Carregando...</p>
                ) : logs.length === 0 ? (
                    <p style={{ color: 'var(--text-soft)', textAlign: 'center', padding: '20px' }}>Nenhuma atividade registrada ainda.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {logs.map(log => {
                            const estilo = CORES_ACAO[log.acao] || { bg: 'var(--panel-soft)', color: 'var(--text-main)' };
                            return (
                                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', background: 'var(--panel-soft)', border: '1px solid var(--border)' }}>
                                    <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold', background: estilo.bg, color: estilo.color, whiteSpace: 'nowrap' }}>
                                        {log.acao}
                                    </span>
                                    <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>{log.recurso}</span>
                                    {log.detalhe && <span style={{ color: 'var(--text-soft)', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.detalhe}</span>}
                                    <span style={{ color: 'var(--text-soft)', fontSize: '0.75rem', whiteSpace: 'nowrap', marginLeft: 'auto' }}>{formatarData(log.criadoEm)}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
