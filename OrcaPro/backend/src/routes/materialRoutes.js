const express = require('express');
const router = express.Router();
const MaterialController = require('../controllers/MaterialController');
const authMiddleware = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { materialSchema } = require('../schemas/materialSchema');

// Aplica a verificação de token para todas as rotas de materiais
router.use(authMiddleware);

router.get('/', MaterialController.listar);
router.post('/', validate(materialSchema), MaterialController.criar);
router.put('/:id', validate(materialSchema), MaterialController.atualizar);
router.delete('/:id', MaterialController.excluir);

module.exports = router;