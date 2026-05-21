const express = require('express');
const router = express.Router();
const OrcamentoController = require('../controllers/OrcamentoController');
const authMiddleware = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { orcamentoSchema } = require('../schemas/orcamentoSchema');

// [SecOps] Rota PÚBLICA! O cliente não tem token de login admin. 
// Ela deve ficar ANTES do authMiddleware para não ser bloqueada.
router.get('/proposta/:token', OrcamentoController.buscarPorTokenPublico);

// Aplica o middleware de autenticação em todas as rotas abaixo dele
router.use(authMiddleware);

router.get('/', OrcamentoController.listar);
router.post('/', validate(orcamentoSchema), OrcamentoController.criar);
router.get('/:id/pdf', OrcamentoController.gerarPDF);
router.get('/:id', OrcamentoController.buscarPorId);
router.put('/:id', validate(orcamentoSchema), OrcamentoController.atualizar);
router.patch('/:id/status', OrcamentoController.atualizarStatus);
router.delete('/:id', OrcamentoController.excluir);

// Rota protegida: Apenas você (logado) pode gerar esse link criptografado
router.post('/:id/link-publico', OrcamentoController.gerarTokenPublico);

module.exports = router;