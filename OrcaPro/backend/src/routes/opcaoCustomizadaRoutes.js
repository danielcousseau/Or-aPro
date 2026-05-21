const express = require('express');
const router = express.Router();
const OpcaoCustomizadaController = require('../controllers/OpcaoCustomizadaController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', OpcaoCustomizadaController.listar);
router.post('/', OpcaoCustomizadaController.criar);
router.delete('/:id', OpcaoCustomizadaController.excluir);

module.exports = router;
