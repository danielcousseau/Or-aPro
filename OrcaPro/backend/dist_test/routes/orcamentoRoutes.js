"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const OrcamentoController_1 = __importDefault(
  require("../controllers/OrcamentoController"),
);
const auth_1 = __importDefault(require("../middlewares/auth"));
const validate_1 = __importDefault(require("../middlewares/validate"));
const orcamentoSchema_1 = require("../schemas/orcamentoSchema");
const router = (0, express_1.Router)();
// [SecOps] Rota PÚBLICA — deve ficar ANTES do authMiddleware
router.get(
  "/proposta/:token",
  OrcamentoController_1.default.buscarPorTokenPublico,
);
router.use(auth_1.default);
router.get("/", OrcamentoController_1.default.listar);
router.post(
  "/",
  (0, validate_1.default)(orcamentoSchema_1.orcamentoSchema),
  OrcamentoController_1.default.criar,
);
router.get("/:id/pdf", OrcamentoController_1.default.gerarPDF);
router.get("/:id", OrcamentoController_1.default.buscarPorId);
router.put(
  "/:id",
  (0, validate_1.default)(orcamentoSchema_1.orcamentoSchema),
  OrcamentoController_1.default.atualizar,
);
router.patch("/:id/status", OrcamentoController_1.default.atualizarStatus);
router.delete("/:id", OrcamentoController_1.default.excluir);
router.post(
  "/:id/link-publico",
  OrcamentoController_1.default.gerarTokenPublico,
);
exports.default = router;
