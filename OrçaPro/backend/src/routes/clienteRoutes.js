const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/ClienteController');
const authMiddleware = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { clienteSchema } = require('../schemas/clienteSchema');

// Aplica a verificação de token para todas as rotas de clientes
router.use(authMiddleware);

router.get('/', ClienteController.listar);
router.post('/', validate(clienteSchema), ClienteController.criar);
router.put('/:id', validate(clienteSchema), ClienteController.atualizar);
router.delete('/:id', ClienteController.excluir);

module.exports = router;