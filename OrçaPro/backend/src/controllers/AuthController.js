const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
    async login(req, res) {
        const { usuario, senha } = req.body;

        console.log(`\n[DEBUG LOGIN] ------------------------`);
        console.log(`1. Tentando logar com usuário: "${usuario}" e senha: "${senha}"`);

        try {
            // Busca o usuário no banco de dados
            let user = await prisma.user.findUnique({
                where: { usuario }
            });

            console.log(`2. Achou no banco de dados?`, user ? `SIM (ID: ${user.id})` : `NÃO`);

            // --- INÍCIO DA CRIAÇÃO AUTOMÁTICA (SALVA-VIDAS) ---
            // Se não achar o admin, ele cria na mesma hora e deixa logar!
            if (!user && usuario === 'admin' && senha === 'ninguemsabe') {
                console.log(`[SALVA-VIDAS] Criando o usuário admin automaticamente agora...`);
                const hashPassword = await bcrypt.hash('ninguemsabe', 10);
                user = await prisma.user.create({
                    data: {
                        name: 'Administrador',
                        usuario: 'admin',
                        password: hashPassword
                    }
                });
                console.log(`[SALVA-VIDAS] Usuário criado com sucesso! ID: ${user.id}`);
            }
            // --- FIM DA CRIAÇÃO AUTOMÁTICA ---

            // Se não achou o usuário ou a senha estiver errada, bloqueia
            if (!user) {
                return res.status(401).json({ error: 'Usuário ou senha inválidos' });
            }

            // Compara a senha digitada com a criptografia salva no banco
            const senhaValida = await bcrypt.compare(senha, user.password);
            console.log(`3. A senha bateu com a criptografia?`, senhaValida ? `SIM` : `NÃO`);
            if (!senhaValida) {
                return res.status(401).json({ error: 'Usuário ou senha inválidos' });
            }

            // Se tudo estiver certo, gera o token real
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'segredo_super_seguro_orcamento', {
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