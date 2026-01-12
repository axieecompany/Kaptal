import { Router } from 'express';
import { incomeRuleController } from '../controllers/incomeRuleController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /income-rules - Get all income rules
router.get('/', incomeRuleController.getAll);

// POST /income-rules - Create a new income rule
router.post('/', incomeRuleController.create);

// PUT /income-rules/:id - Update an income rule
router.put('/:id', incomeRuleController.update);

// DELETE /income-rules/:id - Delete an income rule
router.delete('/:id', incomeRuleController.delete);

// Item routes
// POST /income-rules/:ruleId/items - Add item to a rule
router.post('/:ruleId/items', incomeRuleController.addItem);

// PUT /income-rules/:ruleId/items/:itemId - Update an item
router.put('/:ruleId/items/:itemId', incomeRuleController.updateItem);

// DELETE /income-rules/:ruleId/items/:itemId - Delete an item
router.delete('/:ruleId/items/:itemId', incomeRuleController.deleteItem);

export default router;
