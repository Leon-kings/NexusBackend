const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');
const { validateStripePayment, validatePaypackPayment } = require('../middleware/validation');

// Payment routes
router.post('/stripe', protect, validateStripePayment, paymentController.processStripePayment);
router.post('/paypack', protect, validatePaypackPayment, paymentController.processPaypackPayment);
router.get('/status/:paymentId', protect, paymentController.getPaymentStatus);

// Statistics routes
router.get('/stats', protect, authorize('admin', 'moderator'), paymentController.getPaymentStats);
router.get('/inventory/stats', protect, authorize('admin', 'moderator'), paymentController.getInventoryStats);
router.get('/orders/stats', protect, authorize('admin', 'moderator'), paymentController.getOrderStats);

module.exports = router;    