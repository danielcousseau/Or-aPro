import { Router } from 'express';
import MaterialController from '../controllers/MaterialController';
import authMiddleware from '../middlewares/auth';
import validate from '../middlewares/validate';
import { materialSchema } from '../schemas/materialSchema';

const router = Router();

router.use(authMiddleware);

router.get('/', MaterialController.listar);
router.post('/', validate(materialSchema), MaterialController.criar);
router.put('/:id', validate(materialSchema), MaterialController.atualizar);
router.patch('/:id/estoque', MaterialController.ajustarEstoque);
router.delete('/:id', MaterialController.excluir);

export default router;
