import { Router } from 'express';
import { savingsGoalController } from '../controllers/savingsGoalController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// CRUD operations
router.get('/', savingsGoalController.getAll);
router.post('/', savingsGoalController.create);
router.put('/:id', savingsGoalController.update);
router.delete('/:id', savingsGoalController.delete);

// Deposit operations
router.post('/:id/deposit', savingsGoalController.deposit);
router.get('/:id/deposits', savingsGoalController.getDeposits);
router.delete('/:id/deposits/:depositId', savingsGoalController.deleteDeposit);

export default router;
