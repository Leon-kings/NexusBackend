const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegistration } = require('../middleware/validation');

// Public routes
router.post('/register', validateRegistration, authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationCode);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', protect, authController.logout);

// Protected routes
router.get('/me', protect, authController.getMe);
router.get('/:id', authController.getUserStatus); // Add this line
router.get('/verify', protect, authController.verifyToken); // Add token verification endpoint
router.put('/profile', protect, authController.updateProfile);

module.exports = router;