const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const MATERIAIS_PADRAO = require("../src/constants/materiaisPadrao");
const prisma = new PrismaClient();

async function main() {
  console.log("⚙️ Inicializando banco de dados...");

  const hashPassword = await bcrypt.hash("ninguemsabe", 10);

  await prisma.user.upsert({
    where: { usuario: "admin" },
    update: {}, // Não altera nada se o admin já existir
    create: {
      name: "Administrador",
      usuario: "admin",
      password: hashPassword,
    },
  });

  console.log("✅ Usuário admin verificado.");

  // Seed de materiais para todos os usuários que ainda não têm nenhum
  const usuarios = await prisma.user.findMany({ select: { id: true } });

  for (const usuario of usuarios) {
    const count = await prisma.material.count({
      where: { userId: usuario.id },
    });
    if (count === 0) {
      await prisma.material.createMany({
        data: MATERIAIS_PADRAO.map((m) => ({ ...m, userId: usuario.id })),
      });
      console.log(
        `✅ ${MATERIAIS_PADRAO.length} materiais criados para o usuário ${usuario.id}.`,
      );
    }
  }

  console.log("✅ Seed concluído.");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
