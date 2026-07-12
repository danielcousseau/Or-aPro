import express, { Router } from "express";
import OrcamentoController from "../controllers/OrcamentoController";
import authMiddleware from "../middlewares/auth";
import validate from "../middlewares/validate";
import { orcamentoSchema } from "../schemas/orcamentoSchema";

const router = Router();

// [SecOps] Rotas PÚBLICAS — devem ficar ANTES do authMiddleware
router.get("/proposta/:token", OrcamentoController.buscarPorTokenPublico);
router.get("/contrato/:token", OrcamentoController.buscarContratoPorToken);
router.patch("/contrato/:token/aceitar", OrcamentoController.aceitarContrato);

router.use(authMiddleware);

router.get("/", OrcamentoController.listar);
router.get("/em-producao", OrcamentoController.emProducao);
router.post("/", validate(orcamentoSchema), OrcamentoController.criar);
router.get("/:id/pdf", OrcamentoController.gerarPDF);
router.get("/:id", OrcamentoController.buscarPorId);
router.put("/:id", validate(orcamentoSchema), OrcamentoController.atualizar);
router.patch("/:id/status", OrcamentoController.atualizarStatus);
router.post("/:id/gerar-contrato", OrcamentoController.gerarContrato);
router.delete("/:id", OrcamentoController.excluir);
router.post("/:id/link-publico", OrcamentoController.gerarTokenPublico);
router.post(
  "/:id/enviar-telegram",
  express.raw({ type: "application/pdf", limit: "15mb" }),
  OrcamentoController.enviarPdfTelegram,
);

export default router;
