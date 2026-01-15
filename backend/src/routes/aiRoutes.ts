import { Router } from 'express';
import { aiController } from '../controllers/aiController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Protect all AI routes
router.use(authMiddleware);

// Chat route
router.post('/chat', aiController.chat);

export default router;
