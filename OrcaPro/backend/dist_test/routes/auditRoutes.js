"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma = require("../lib/prisma");
const auth_1 = __importDefault(require("../middlewares/auth"));
const adminAuth_1 = __importDefault(require("../middlewares/adminAuth"));
const router = (0, express_1.Router)();
router.get("/", auth_1.default, async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { userId: req.userId },
      orderBy: { criadoEm: "desc" },
      take: 100,
    });
    res.json(logs);
  } catch {
    res.status(500).json({ error: "Erro ao buscar logs." });
  }
});
router.get("/admin", auth_1.default, adminAuth_1.default, async (_req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { criadoEm: "desc" },
      take: 500,
      include: {
        user: { select: { id: true, usuario: true, name: true } },
      },
    });
    res.json(logs);
  } catch {
    res.status(500).json({ error: "Erro ao buscar logs." });
  }
});
exports.default = router;
