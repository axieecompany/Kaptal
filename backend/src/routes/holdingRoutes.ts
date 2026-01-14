import { Router } from 'express';
import { holdingController } from '../controllers/holdingController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', holdingController.getAll);
router.post('/', holdingController.create);
router.put('/:id', holdingController.update);
router.delete('/:id', holdingController.delete);

export default router;
