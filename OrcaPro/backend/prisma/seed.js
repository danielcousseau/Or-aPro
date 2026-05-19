const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('⚙️ Inicializando configurações do banco de dados e usuário administrador...');

    // Criptografa a senha antes de salvar (o número 10 é o custo da criptografia, padrão ouro)
    const hashPassword = await bcrypt.hash('ninguemsabe', 10);

    // Usa o upsert: Se o admin já existir ele não faz nada, se não, ele cria.
    await prisma.user.upsert({
        where: { usuario: 'admin' },
        update: {
            password: hashPassword // Força a regravar a senha correta mesmo se ele já existir!
        },
        create: {
            name: 'Administrador',
            usuario: 'admin',
            password: hashPassword
        }
    });

    console.log('✅ Configuração inicial do banco de dados concluída com sucesso!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });