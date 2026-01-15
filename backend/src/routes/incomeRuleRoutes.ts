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

// POST /income-rules/copy-from-month - Copy rules from one month to another
router.post('/copy-from-month', incomeRuleController.copyFromMonth);

// POST /income-rules/reset-to-defaults - Reset rules to defaults for a specific month
router.post('/reset-to-defaults', incomeRuleController.resetToDefaults);

// POST /income-rules/sync-installments - Sync installment subitems without resetting
router.post('/sync-installments', incomeRuleController.syncInstallments);

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

// GET /income-rules/:ruleId/items/:itemId/spending - Get spending for an item
// GET /income-rules/:ruleId/items/:itemId/spending - Get spending for an item
router.get('/:ruleId/items/:itemId/spending', incomeRuleController.getItemSpending);

// GET /income-rules/:ruleId/spending - Get total spending for a rule
router.get('/:ruleId/spending', incomeRuleController.getRuleSpending);

export default router;
