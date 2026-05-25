"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MaterialController_1 = __importDefault(require("../controllers/MaterialController"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const validate_1 = __importDefault(require("../middlewares/validate"));
const materialSchema_1 = require("../schemas/materialSchema");
const router = (0, express_1.Router)();
router.use(auth_1.default);
router.get('/', MaterialController_1.default.listar);
router.post('/', (0, validate_1.default)(materialSchema_1.materialSchema), MaterialController_1.default.criar);
router.put('/:id', (0, validate_1.default)(materialSchema_1.materialSchema), MaterialController_1.default.atualizar);
router.patch('/:id/estoque', MaterialController_1.default.ajustarEstoque);
router.delete('/:id', MaterialController_1.default.excluir);
exports.default = router;
