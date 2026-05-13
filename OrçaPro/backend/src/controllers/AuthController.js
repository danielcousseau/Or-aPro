const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
    async login(req, res) {
        const { usuario, senha } = req.body;

        try {
            // Busca o usuário no banco de dados
            let user = await prisma.user.findUnique({
                where: { usuario }
            });

            // Se não achou o usuário ou a senha estiver errada, bloqueia
            if (!user) {
                // Retornamos 401 direto. A ambiguidade impede a enumeração de usuários por cibercriminosos.
                return res.status(401).json({ error: 'Usuário ou senha inválidos' });
            }

            // Compara a senha digitada com a criptografia salva no banco
            const senhaValida = await bcrypt.compare(senha, user.password);
            if (!senhaValida) {
                return res.status(401).json({ error: 'Usuário ou senha inválidos' });
            }

            // [SecOps] Fail-Secure: Garante que o sistema não emita tokens com base em um segredo previsível
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                console.error("CRÍTICO: Tentativa de login falhou porque JWT_SECRET não está configurado no .env");
                return res.status(500).json({ error: 'Erro interno de configuração do servidor' });
            }

            // Gera o token real e seguro
            const token = jwt.sign({ id: user.id }, jwtSecret, {
                expiresIn: '1d', 
            });

            return res.json({
                user: { id: user.id, usuario: user.usuario, nome: user.name },
                token
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro interno no servidor' });
        }
    }
};