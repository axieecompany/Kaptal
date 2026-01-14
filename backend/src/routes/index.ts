import { Router } from 'express';
import authRoutes from './authRoutes.js';
import categoryBudgetRoutes from './categoryBudgetRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import dividendRoutes from './dividendRoutes.js';
import goalRoutes from './goalRoutes.js';
import holdingRoutes from './holdingRoutes.js';
import incomeRuleRoutes from './incomeRuleRoutes.js';
import savingsGoalRoutes from './savingsGoalRoutes.js';
import statsRoutes from './statsRoutes.js';
import transactionRoutes from './transactionRoutes.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/category-budgets', categoryBudgetRoutes);
router.use('/transactions', transactionRoutes);
router.use('/stats', statsRoutes);
router.use('/goals', goalRoutes);
router.use('/income-rules', incomeRuleRoutes);
router.use('/savings-goals', savingsGoalRoutes);
router.use('/holdings', holdingRoutes);
router.use('/dividends', dividendRoutes);

export default router;


