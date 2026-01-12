import { Router } from 'express';
import * as statsController from '../controllers/statsController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/overview', statsController.getOverview);
router.get('/by-category', statsController.getStatsByCategory);
router.get('/monthly', statsController.getMonthlyHistory);

export default router;
