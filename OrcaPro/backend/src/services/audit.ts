import prisma = require("../lib/prisma");

export async function registrar(
  userId: number,
  acao: string,
  recurso: string,
  recursoId: number | null = null,
  detalhe: string | null = null,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: { userId, acao, recurso, recursoId, detalhe },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Audit log falhou (não crítico):", msg);
  }
}
