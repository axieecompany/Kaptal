import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/verify-login', authController.verifyLogin);
router.post('/resend-code', authController.resendCode);

// Protected routes
router.get('/me', authMiddleware, authController.me);
router.patch('/me', authMiddleware, authController.updateProfile);

export default router;
