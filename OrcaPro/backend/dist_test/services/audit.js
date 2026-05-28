"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrar = registrar;
const prisma = require("../lib/prisma");
async function registrar(
  userId,
  acao,
  recurso,
  recursoId = null,
  detalhe = null,
) {
  try {
    await prisma.auditLog.create({
      data: { userId, acao, recurso, recursoId, detalhe },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Audit log falhou (não crítico):", msg);
  }
}
