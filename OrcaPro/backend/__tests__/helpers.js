const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');

const TEST_PREFIX = `test_${Date.now()}_`;

async function criarUsuarioTeste(sufixo) {
    const hash = await bcrypt.hash('senha123', 10);
    return prisma.user.create({
        data: {
            name: `Usuário Teste ${sufixo}`,
            usuario: `${TEST_PREFIX}${sufixo}`,
            password: hash,
            email: null,
        },
    });
}

async function limparUsuarioTeste(userId) {
    // Precisa deletar em ordem por causa das FKs (sem cascade do User)
    await prisma.auditLog.deleteMany({ where: { userId } });
    await prisma.orcamento.deleteMany({ where: { userId } }); // OrcamentoMaterial cascadeia
    await prisma.cliente.deleteMany({ where: { userId } });
    await prisma.material.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
}

function parseCookies(res) {
    return res.headers['set-cookie'] || [];
}

module.exports = { criarUsuarioTeste, limparUsuarioTeste, parseCookies, TEST_PREFIX };
