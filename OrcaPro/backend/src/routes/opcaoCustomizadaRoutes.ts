import { Router } from "express";
import OpcaoCustomizadaController from "../controllers/OpcaoCustomizadaController";
import authMiddleware from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", OpcaoCustomizadaController.listar);
router.post("/", OpcaoCustomizadaController.criar);
router.delete("/:id", OpcaoCustomizadaController.excluir);

export default router;
