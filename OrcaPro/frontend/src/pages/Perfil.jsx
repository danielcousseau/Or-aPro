import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function Perfil() {
    const [user, setUser] = useState({});
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [salvandoPerfil, setSalvandoPerfil] = useState(false);
    const [fotoPreview, setFotoPreview] = useState(null);
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [salvandoSenha, setSalvandoSenha] = useState(false);

    useEffect(() => {
        const userStorage = localStorage.getItem('@OrcaPro:user');
        if (userStorage) {
            const parsed = JSON.parse(userStorage);
            setUser(parsed);
            setNome(parsed.nome || '');
            setEmail(parsed.email || '');
        }

        const avatar = localStorage.getItem('@OrcaPro:avatar');
        if (avatar) setFotoPreview(avatar);
    }, []);

    const handleFotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Impede fotos gigantes de travarem o navegador (limite de 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error('A imagem é muito grande. Escolha uma foto de até 2MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFotoPreview(reader.result);
                localStorage.setItem('@OrcaPro:avatar', reader.result); // Salva no cache do navegador
                toast.success('Foto de perfil atualizada!');
                
                // Dispara um "sinalizador" para o sistema atualizar a bolinha do menu na mesma hora!
                window.dispatchEvent(new Event('avatarAtualizado'));
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePerfilSubmit = async (e) => {
        e.preventDefault();
        setSalvandoPerfil(true);
        try {
            const response = await api.put('/usuarios/perfil', { nome, email });
            const updated = { ...user, email: response.data.email, nome: response.data.nome };
            setUser(updated);
            setNome(response.data.nome || '');
            localStorage.setItem('@OrcaPro:user', JSON.stringify(updated));
            toast.success('Perfil atualizado com sucesso!');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao atualizar perfil.');
        } finally {
            setSalvandoPerfil(false);
        }
    };

    const handleSenhaSubmit = async (e) => {
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
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao atualizar senha. Verifique sua senha atual.');
        } finally {
            setSalvandoSenha(false);
        }
    };

    return (
        <div>
            <h1 style={{ marginBottom: '30px' }}>Meu Perfil</h1>
            
            <div className="form-grid-1-1">
                {/* Coluna da Foto */}
                <div className="cliente-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'start', width: '100%' }}>
                    <div style={{ 
                        width: '130px', height: '130px', borderRadius: '50%', 
                        background: 'var(--primary)', color: '#fff', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: '3.5rem', fontWeight: 'bold', marginBottom: '15px', 
                        overflow: 'hidden', border: '4px solid var(--panel-soft)', 
                        boxShadow: 'var(--shadow-soft)', position: 'relative'
                    }}>
                        {fotoPreview ? (
                            <img src={fotoPreview} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            user.nome ? user.nome.charAt(0).toUpperCase() : 'U'
                        )}
                    </div>
                    
                    <h2 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', textAlign: 'center' }}>{user.nome || user.usuario}</h2>
                    <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: 'var(--text-soft)' }}>@{user.usuario}</p>
                    
                    <label style={{ 
                        background: 'var(--panel-soft)', border: '1px solid var(--border)', 
                        padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', 
                        fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary)', 
                        transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        📷 Trocar Foto
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFotoChange} />
                    </label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '15px', textAlign: 'center', maxWidth: '80%' }}>
                        A imagem ficará salva no seu navegador e não gastará espaço no servidor.
                    </p>
                </div>

                {/* Coluna do E-mail e Senha */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Card de E-mail (necessário para recuperação de senha) */}
                <div className="cliente-card">
                    <h2 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px', fontSize: '1.2rem' }}>
                        Dados do Perfil
                    </h2>
                    <form onSubmit={handlePerfilSubmit}>
                        <section className="form-section" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '16px' }}>
                            <label>Nome</label>
                            <input
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Seu nome completo"
                            />
                        </section>
                        <section className="form-section" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '16px' }}>
                            <label>E-mail</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '6px' }}>
                                Usado para recuperação de senha. Não será exibido a clientes.
                            </p>
                        </section>
                        <button type="submit" disabled={salvandoPerfil} style={{ width: '100%', opacity: salvandoPerfil ? 0.7 : 1, cursor: salvandoPerfil ? 'not-allowed' : 'pointer' }}>
                            {salvandoPerfil ? 'Salvando...' : 'Salvar Perfil'}
                        </button>
                    </form>
                </div>

                {/* Card de Senha */}
                <div className="cliente-card">
                    <h2 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px', fontSize: '1.2rem' }}>
                        🔐 Segurança e Senha
                    </h2>
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

                </div>{/* fecha wrapper email+senha */}
            </div>{/* fecha form-grid-1-1 */}
        </div>
    );
}