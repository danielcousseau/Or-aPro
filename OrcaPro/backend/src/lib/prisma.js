const { PrismaClient } = require('@prisma/client');

// Singleton: evita criar múltiplas conexões em hot-reload (dev) e esgotamento
// de pool em produção. Em dev, reutiliza a instância salva em global.
const prisma = global.__prismaInstance || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    global.__prismaInstance = prisma;
}

module.exports = prisma;
