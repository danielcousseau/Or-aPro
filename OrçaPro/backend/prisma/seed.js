const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Plantando dados de teste no banco...');

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

    // Cria um cliente de teste
    const cliente1 = await prisma.cliente.create({
        data: {
            nome: 'João da Silva (Teste)',
            telefone: '(11) 99999-9999',
            cidade: 'São Paulo',
            bairro: 'Centro'
        }
    });

    // Cria alguns materiais básicos
    await prisma.material.createMany({
        data: [
            { nome: 'MDF Branco 15mm', valor: 145.50, categoria: 'Chapa' },
            { nome: 'MDF Amadeirado 18mm', valor: 210.00, categoria: 'Chapa' },
            { nome: 'Corrediça Telescópica 45cm', valor: 25.00, categoria: 'Ferragem' },
            { nome: 'Dobradiça com Amortecedor', valor: 8.50, categoria: 'Ferragem' },
        ]
    });

    console.log('✅ Banco de dados preenchido com sucesso!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });