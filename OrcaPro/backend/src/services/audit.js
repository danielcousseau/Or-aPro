const prisma = require('../lib/prisma');

async function registrar(userId, acao, recurso, recursoId = null, detalhe = null) {
    try {
        await prisma.auditLog.create({
            data: { userId, acao, recurso, recursoId, detalhe }
        });
    } catch (err) {
        console.error('Audit log falhou (não crítico):', err.message);
    }
}

module.exports = { registrar };
