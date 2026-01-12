import { Router } from 'express';
import authRoutes from './authRoutes.js';
import categoryBudgetRoutes from './categoryBudgetRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import goalRoutes from './goalRoutes.js';
import incomeRuleRoutes from './incomeRuleRoutes.js';
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

export default router;
