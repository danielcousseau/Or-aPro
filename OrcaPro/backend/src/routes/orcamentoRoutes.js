const express = require('express');
const router = express.Router();
const OrcamentoController = require('../controllers/OrcamentoController');
const authMiddleware = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { orcamentoSchema } = require('../schemas/orcamentoSchema');

// Aplica o middleware de autenticação em todas as rotas abaixo dele
router.use(authMiddleware);

router.get('/', OrcamentoController.listar);
router.post('/', validate(orcamentoSchema), OrcamentoController.criar);
router.get('/:id', OrcamentoController.buscarPorId); 
router.put('/:id', validate(orcamentoSchema), OrcamentoController.atualizar);
router.patch('/:id/status', OrcamentoController.atualizarStatus);
router.delete('/:id', OrcamentoController.excluir);

module.exports = router;