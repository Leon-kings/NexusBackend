// routes/payment.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');
const { 
  validatePayment, 
  validateStripePayment, 
  validatePaypackPayment 
} = require('../middleware/validation');

// Unified payment route (auto-detects provider)
router.post('/process', protect, validatePayment, paymentController.processPayment);

// Get available payment methods
router.get('/methods', protect, paymentController.getPaymentMethods);

// Individual provider routes (for specific use cases)
router.post('/stripe', protect, validateStripePayment, paymentController.processStripePayment);
router.post('/paypack', protect, validatePaypackPayment, paymentController.processPaypackPayment);

// Payment status and management
router.get('/status/:paymentId', protect, paymentController.getPaymentStatus);
router.get('/:paymentId', protect, paymentController.getPaymentDetails);

// Webhook endpoints (no auth required for webhooks)
router.post('/webhook/stripe', 
  express.raw({type: 'application/json'}), 
  paymentController.handleWebhook
);
router.post('/webhook/paypack', 
  express.json(), 
  paymentController.handleWebhook
);

// Admin statistics routes
router.get('/stats', protect, authorize('admin', 'moderator'), paymentController.getPaymentStats);
router.get('/inventory/stats', protect, authorize('admin', 'moderator'), paymentController.getInventoryStats);
router.get('/orders/stats', protect, authorize('admin', 'moderator'), paymentController.getOrderStats);

// Admin payment management
router.get('/', protect, authorize('admin', 'moderator'), paymentController.getAllPayments);
router.get('/provider/:provider', protect, authorize('admin', 'moderator'), paymentController.getPaymentsByProvider);

module.exports = router;