import { Router } from "express";
import MarcenaricController from "../controllers/MarcenaricController";
import authMiddleware from "../middlewares/auth";
import validate from "../middlewares/validate";
import {
  configBaseSchema,
  tipoMovelSchema,
  chapaSchema,
  fitaSchema,
  ferragemSchema,
  correducaSchema,
  calcularMovelSchema,
} from "../schemas/marcenariaSchemas";

const router = Router();
router.use(authMiddleware);

// Configuração base
router.get("/config", MarcenaricController.buscarConfig);
router.post(
  "/config",
  validate(configBaseSchema),
  MarcenaricController.salvarConfig,
);

// Tipos de móvel
router.post(
  "/config/tipos",
  validate(tipoMovelSchema),
  MarcenaricController.criarTipo,
);
router.put(
  "/config/tipos/:id",
  validate(tipoMovelSchema),
  MarcenaricController.atualizarTipo,
);
router.delete("/config/tipos/:id", MarcenaricController.deletarTipo);

// Chapas
router.post(
  "/config/chapas",
  validate(chapaSchema),
  MarcenaricController.criarChapa,
);
router.put(
  "/config/chapas/:id",
  validate(chapaSchema),
  MarcenaricController.atualizarChapa,
);
router.delete("/config/chapas/:id", MarcenaricController.deletarChapa);

// Fitas
router.post(
  "/config/fitas",
  validate(fitaSchema),
  MarcenaricController.criarFita,
);
router.put(
  "/config/fitas/:id",
  validate(fitaSchema),
  MarcenaricController.atualizarFita,
);
router.delete("/config/fitas/:id", MarcenaricController.deletarFita);

// Corrediças
router.post(
  "/config/corredicas",
  validate(correducaSchema),
  MarcenaricController.criarCorredica,
);
router.put(
  "/config/corredicas/:id",
  validate(correducaSchema),
  MarcenaricController.atualizarCorredica,
);
router.delete("/config/corredicas/:id", MarcenaricController.deletarCorredica);

// Ferragens
router.post(
  "/config/ferragens",
  validate(ferragemSchema),
  MarcenaricController.criarFerragem,
);
router.put(
  "/config/ferragens/:id",
  validate(ferragemSchema),
  MarcenaricController.atualizarFerragem,
);
router.delete("/config/ferragens/:id", MarcenaricController.deletarFerragem);

// Motor de cálculo
router.post(
  "/calcular",
  validate(calcularMovelSchema),
  MarcenaricController.calcular,
);

export default router;
