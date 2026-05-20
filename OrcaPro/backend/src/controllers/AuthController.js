const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { enviarEmailResetSenha } = require('../services/emailService');
const MATERIAIS_PADRAO = require('../constants/materiaisPadrao');

const isProduction = process.env.NODE_ENV === 'production';

// Opções de cookie compartilhadas.
// SameSite=none obrigatório para cross-origin (Vercel + Render).
// Em dev, lax funciona para localhost → localhost.
function cookieOpts(maxAge) {
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge,
        path: '/',
    };
}

module.exports = {
    async login(req, res) {
        const { usuario, senha } = req.body;

        try {
            const user = await prisma.user.findUnique({ where: { usuario } });

            if (!user) {
                return res.status(401).json({ error: 'Usuário ou senha inválidos' });
            }

            const senhaValida = await bcrypt.compare(senha, user.password);
            if (!senhaValida) {
                return res.status(401).json({ error: 'Usuário ou senha inválidos' });
            }

            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                console.error('CRÍTICO: JWT_SECRET não configurado.');
                return res.status(500).json({ error: 'Erro interno de configuração do servidor' });
            }

            // Access token curto: janela de exposição menor em caso de comprometimento
            const accessToken = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '15m' });
            // Refresh token longo: permite renovar a sessão sem novo login por 7 dias
            const refreshToken = jwt.sign({ id: user.id, type: 'refresh' }, jwtSecret, { expiresIn: '7d' });

            res.cookie('token', accessToken, cookieOpts(15 * 60 * 1000));
            res.cookie('refreshToken', refreshToken, cookieOpts(7 * 24 * 60 * 60 * 1000));

            // Tokens também no body: necessário para Safari/iOS (ITP bloqueia cookies cross-domain)
            return res.json({
                user: { id: user.id, usuario: user.usuario, nome: user.name, email: user.email, avatar: user.avatar || null },
                accessToken,
                refreshToken,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro interno no servidor' });
        }
    },

    async refresh(req, res) {
        // Aceita token do body (Safari/iOS) ou do cookie (outros browsers)
        const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
        }

        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
            if (decoded.type !== 'refresh') throw new Error('Token inválido');

            const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
            res.cookie('token', newAccessToken, cookieOpts(15 * 60 * 1000));

            return res.json({ ok: true, accessToken: newAccessToken });
        } catch {
            res.clearCookie('token');
            res.clearCookie('refreshToken');
            return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
        }
    },

    async me(req, res) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.userId },
                select: { id: true, usuario: true, name: true, email: true, avatar: true }
            });
            if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
            return res.json({ id: user.id, usuario: user.usuario, nome: user.name, email: user.email, avatar: user.avatar || null });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro interno no servidor' });
        }
    },

    async logout(req, res) {
        res.clearCookie('token', cookieOpts(0));
        res.clearCookie('refreshToken', cookieOpts(0));
        return res.json({ ok: true });
    },

    async register(req, res) {
        try {
            const { nome, usuario, senha, email, turnstileToken } = req.body;

            // Verifica Turnstile apenas em produção (TURNSTILE_SECRET_KEY não definida em dev)
            const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
            if (turnstileSecret) {
                const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ secret: turnstileSecret, response: turnstileToken })
                });
                const verifyData = await verifyRes.json();
                if (!verifyData.success) {
                    return res.status(400).json({ error: 'Verificação de segurança falhou. Tente novamente.' });
                }
            }

            const userExists = await prisma.user.findUnique({ where: { usuario } });
            if (userExists) {
                return res.status(400).json({ error: 'Este nome de usuário já está em uso.' });
            }

            const hashPassword = await bcrypt.hash(senha, 10);
            const novoUsuario = await prisma.user.create({
                data: { name: nome, usuario, password: hashPassword, email: email || null }
            });

            await prisma.material.createMany({
                data: MATERIAIS_PADRAO.map(m => ({ ...m, userId: novoUsuario.id }))
            });

            return res.status(201).json({ message: 'Conta criada com sucesso!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao criar conta.' });
        }
    },

    async atualizarPerfil(req, res) {
        try {
            const { nome, email, avatar } = req.body;
            const data = { name: nome, email: email || null };
            if (avatar !== undefined) data.avatar = avatar; // null limpa, string salva, undefined não toca
            const user = await prisma.user.update({
                where: { id: req.userId },
                data,
                select: { id: true, usuario: true, name: true, email: true, avatar: true }
            });
            return res.json({ id: user.id, usuario: user.usuario, nome: user.name, email: user.email, avatar: user.avatar || null });
        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(409).json({ error: 'Este e-mail já está em uso por outra conta.' });
            }
            console.error(error);
            return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
        }
    },

    async alterarSenha(req, res) {
        try {
            const { senhaAtual, novaSenha } = req.body;
            if (!senhaAtual || !novaSenha || novaSenha.length < 6) {
                return res.status(400).json({ error: 'Dados inválidos para alteração de senha.' });
            }

            const user = await prisma.user.findUnique({ where: { id: req.userId } });
            const senhaValida = await bcrypt.compare(senhaAtual, user.password);
            if (!senhaValida) {
                return res.status(400).json({ error: 'Senha atual incorreta.' });
            }

            const hashNovaSenha = await bcrypt.hash(novaSenha, 10);
            await prisma.user.update({ where: { id: req.userId }, data: { password: hashNovaSenha } });

            return res.json({ message: 'Senha atualizada com sucesso!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao alterar senha.' });
        }
    },

    async forgotPassword(req, res) {
        try {
            const { usuario } = req.body;
            if (!usuario) {
                return res.status(400).json({ error: 'Informe o nome de usuário.' });
            }

            const user = await prisma.user.findUnique({ where: { usuario } });

            // Sempre retorna sucesso — não expõe se o usuário existe (prevenção de enumeração)
            if (!user || !user.email) {
                return res.json({ message: 'Se este usuário existir e tiver um e-mail cadastrado, você receberá as instruções em breve.' });
            }

            // O hash da senha atual faz parte do segredo — trocar a senha invalida o token automaticamente
            const resetSecret = process.env.JWT_SECRET + user.password;
            const resetToken = jwt.sign({ userId: user.id }, resetSecret, { expiresIn: '1h' });

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const linkReset = `${frontendUrl}/redefinir-senha?token=${resetToken}&id=${user.id}`;

            await enviarEmailResetSenha(user.email, user.name, linkReset);

            return res.json({ message: 'Se este usuário existir e tiver um e-mail cadastrado, você receberá as instruções em breve.' });
        } catch (error) {
            console.error('Erro ao processar recuperação de senha:', error);
            // Não expõe detalhes de falha de envio de email
            return res.json({ message: 'Se este usuário existir e tiver um e-mail cadastrado, você receberá as instruções em breve.' });
        }
    },

    async resetPassword(req, res) {
        try {
            const { token, userId, novaSenha } = req.body;
            if (!token || !userId || !novaSenha || novaSenha.length < 6) {
                return res.status(400).json({ error: 'Dados inválidos.' });
            }

            const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
            if (!user) {
                return res.status(400).json({ error: 'Link inválido ou expirado.' });
            }

            const resetSecret = process.env.JWT_SECRET + user.password;
            try {
                jwt.verify(token, resetSecret);
            } catch {
                return res.status(400).json({ error: 'Link inválido ou expirado.' });
            }

            const hashNovaSenha = await bcrypt.hash(novaSenha, 10);
            await prisma.user.update({ where: { id: user.id }, data: { password: hashNovaSenha } });

            return res.json({ message: 'Senha redefinida com sucesso! Faça login com a nova senha.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao redefinir senha.' });
        }
    },
};
