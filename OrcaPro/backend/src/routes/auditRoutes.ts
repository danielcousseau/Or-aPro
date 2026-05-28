import { Router, Request, Response } from "express";
import prisma = require("../lib/prisma");
import authMiddleware from "../middlewares/auth";
import adminAuth from "../middlewares/adminAuth";

const router = Router();

router.get(
  "/",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
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
  },
);

router.get(
  "/admin",
  authMiddleware,
  adminAuth,
  async (_req: Request, res: Response): Promise<void> => {
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
  },
);

export default router;
