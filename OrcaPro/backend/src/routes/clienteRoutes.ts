import { Router } from "express";
import ClienteController from "../controllers/ClienteController";
import authMiddleware from "../middlewares/auth";
import validate from "../middlewares/validate";
import { clienteSchema } from "../schemas/clienteSchema";

const router = Router();

router.use(authMiddleware);

router.get("/", ClienteController.listar);
router.post("/", validate(clienteSchema), ClienteController.criar);
router.put("/:id", validate(clienteSchema), ClienteController.atualizar);
router.delete("/:id", ClienteController.excluir);

export default router;
