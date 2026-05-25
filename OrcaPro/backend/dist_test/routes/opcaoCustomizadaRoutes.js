"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const OpcaoCustomizadaController_1 = __importDefault(require("../controllers/OpcaoCustomizadaController"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const router = (0, express_1.Router)();
router.use(auth_1.default);
router.get('/', OpcaoCustomizadaController_1.default.listar);
router.post('/', OpcaoCustomizadaController_1.default.criar);
router.delete('/:id', OpcaoCustomizadaController_1.default.excluir);
exports.default = router;
