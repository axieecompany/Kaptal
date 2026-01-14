import { Router } from 'express';
import { dividendController } from '../controllers/dividendController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', dividendController.getAllForUser);
router.get('/holding/:holdingId', dividendController.getByHolding);
router.post('/', dividendController.create);
router.delete('/:id', dividendController.delete);

export default router;
