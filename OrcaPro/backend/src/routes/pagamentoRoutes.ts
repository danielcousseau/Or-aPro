import { Router } from "express";
import PagamentoController from "../controllers/PagamentoController";
import authMiddleware from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", PagamentoController.listarTodos);
router.get("/rentabilidade", PagamentoController.listarRentabilidade);
router.get("/:orcamentoId", PagamentoController.listar);
router.post("/:orcamentoId", PagamentoController.criar);
router.delete("/:orcamentoId/:id", PagamentoController.excluir);

export default router;
