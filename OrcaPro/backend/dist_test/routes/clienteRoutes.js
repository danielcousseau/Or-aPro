"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ClienteController_1 = __importDefault(require("../controllers/ClienteController"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const validate_1 = __importDefault(require("../middlewares/validate"));
const clienteSchema_1 = require("../schemas/clienteSchema");
const router = (0, express_1.Router)();
router.use(auth_1.default);
router.get('/', ClienteController_1.default.listar);
router.post('/', (0, validate_1.default)(clienteSchema_1.clienteSchema), ClienteController_1.default.criar);
router.put('/:id', (0, validate_1.default)(clienteSchema_1.clienteSchema), ClienteController_1.default.atualizar);
router.delete('/:id', ClienteController_1.default.excluir);
exports.default = router;
