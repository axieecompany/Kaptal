import { Router } from 'express';
import * as categoryBudgetController from '../controllers/categoryBudgetController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', categoryBudgetController.getCategoryBudgets);
router.post('/', categoryBudgetController.setCategoryBudget);
router.delete('/:categoryId', categoryBudgetController.deleteCategoryBudget);

export default router;
