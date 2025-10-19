// routes/payment.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authorize } = require('../middleware/auth');
const { 
  validatePayment, 
  validateStripePayment, 
  validatePaypackPayment 
} = require('../middleware/validation');

// Unified payment route (auto-detects provider)
router.post('/process', validatePayment, paymentController.processPayment);

// Get available payment methods
router.get('/methods', paymentController.getPaymentMethods);

// Individual provider routes (for specific use cases)
router.post('/stripe', validateStripePayment, paymentController.processStripePayment);
router.post('/paypack', validatePaypackPayment, paymentController.processPaypackPayment);

// Payment status and management
router.get('/status/:paymentId', paymentController.getPaymentStatus);
router.get('/:paymentId', paymentController.getPaymentDetails);

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
router.get('/stats', authorize('admin', 'moderator'), paymentController.getPaymentStats);
router.get('/inventory/stats', authorize('admin', 'moderator'), paymentController.getInventoryStats);
router.get('/orders/stats', authorize('admin', 'moderator'), paymentController.getOrderStats);

// Admin payment management
router.get('/', authorize('admin', 'moderator'), paymentController.getAllPayments);
router.get('/provider/:provider', authorize('admin', 'moderator'), paymentController.getPaymentsByProvider);

module.exports = router;