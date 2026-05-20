const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const MATERIAIS_PADRAO = [
    // --- Chapas ---
    { nome: 'MDF 18mm branco',      categoria: 'Chapas',    valor: 185.00, unidade: 'Chapa' },
    { nome: 'MDF 18mm cor',         categoria: 'Chapas',    valor: 210.00, unidade: 'Chapa' },
    { nome: 'MDF 18mm amadeirado',  categoria: 'Chapas',    valor: 225.00, unidade: 'Chapa' },
    { nome: 'Fundo 6mm',            categoria: 'Chapas',    valor: 85.00,  unidade: 'Chapa' },
    { nome: 'Fundo 6mm cor',        categoria: 'Chapas',    valor: 95.00,  unidade: 'Chapa' },

    // --- Fixação ---
    { nome: 'Parafuso 16',          categoria: 'Fixação',   valor: 9.00,   unidade: 'Caixa' },
    { nome: 'Parafuso 16 F',        categoria: 'Fixação',   valor: 11.00,  unidade: 'Caixa' },
    { nome: 'Parafuso 30',          categoria: 'Fixação',   valor: 13.00,  unidade: 'Caixa' },
    { nome: 'Parafuso 50',          categoria: 'Fixação',   valor: 16.00,  unidade: 'Caixa' },
    { nome: 'Parafuso 60',          categoria: 'Fixação',   valor: 18.00,  unidade: 'Caixa' },
    { nome: 'Parafuso 70',          categoria: 'Fixação',   valor: 21.00,  unidade: 'Caixa' },
    { nome: 'Parafuso 80',          categoria: 'Fixação',   valor: 23.00,  unidade: 'Caixa' },
    { nome: 'Parafuso 90',          categoria: 'Fixação',   valor: 26.00,  unidade: 'Caixa' },
    { nome: 'Parafuso 100',         categoria: 'Fixação',   valor: 29.00,  unidade: 'Caixa' },

    // --- Ferragens ---
    { nome: 'Dobradiça curva',       categoria: 'Ferragens', valor: 5.00,   unidade: 'Unidade' },
    { nome: 'Dobradiça reta',        categoria: 'Ferragens', valor: 4.00,   unidade: 'Unidade' },
    { nome: 'Dobradiça super curva', categoria: 'Ferragens', valor: 8.00,   unidade: 'Unidade' },
    { nome: 'Corrediça 20cm',        categoria: 'Ferragens', valor: 9.00,   unidade: 'Par' },
    { nome: 'Corrediça 25cm',        categoria: 'Ferragens', valor: 11.00,  unidade: 'Par' },
    { nome: 'Corrediça 30cm',        categoria: 'Ferragens', valor: 13.00,  unidade: 'Par' },
    { nome: 'Corrediça 35cm',        categoria: 'Ferragens', valor: 15.00,  unidade: 'Par' },
    { nome: 'Corrediça 40cm',        categoria: 'Ferragens', valor: 17.00,  unidade: 'Par' },
    { nome: 'Corrediça 45cm',        categoria: 'Ferragens', valor: 19.00,  unidade: 'Par' },
    { nome: 'Corrediça 50cm',        categoria: 'Ferragens', valor: 21.00,  unidade: 'Par' },
    { nome: 'Corrediça 55cm',        categoria: 'Ferragens', valor: 23.00,  unidade: 'Par' },
    { nome: 'Sapata',                categoria: 'Ferragens', valor: 2.50,   unidade: 'Unidade' },

    // --- Acabamento ---
    { nome: 'Lâmina de borda 22mm cor',    categoria: 'Acabamento', valor: 1.00,  unidade: 'Metro' },
    { nome: 'Lâmina de borda 44mm cor',    categoria: 'Acabamento', valor: 1.80,  unidade: 'Metro' },
    { nome: 'Lâmina de borda 22mm branco', categoria: 'Acabamento', valor: 0.80,  unidade: 'Metro' },
    { nome: 'Lâmina de borda 44mm branco', categoria: 'Acabamento', valor: 1.50,  unidade: 'Metro' },
    { nome: 'Cola',                        categoria: 'Acabamento', valor: 28.00, unidade: 'Kg' },
];

async function main() {
    console.log('⚙️ Inicializando configurações do banco de dados e usuário administrador...');

    const hashPassword = await bcrypt.hash('ninguemsabe', 10);

    const admin = await prisma.user.upsert({
        where: { usuario: 'admin' },
        update: {}, // Não altera nada se o admin já existir
        create: {
            name: 'Administrador',
            usuario: 'admin',
            password: hashPassword
        }
    });

    console.log('✅ Configuração inicial do banco de dados concluída com sucesso!');

    // Só cria os materiais padrão se o admin ainda não tiver nenhum cadastrado
    const materiaisExistentes = await prisma.material.count({ where: { userId: admin.id } });

    if (materiaisExistentes === 0) {
        await prisma.material.createMany({
            data: MATERIAIS_PADRAO.map(m => ({ ...m, userId: admin.id }))
        });
        console.log(`✅ ${MATERIAIS_PADRAO.length} materiais padrão cadastrados com sucesso!`);
    } else {
        console.log(`ℹ️ Materiais já cadastrados (${materiaisExistentes} encontrados), seed ignorado.`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
