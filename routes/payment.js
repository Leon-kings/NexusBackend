const express = require('express');
const router = express.Router();
const { processPayment, getPaymentStatus } = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth'); // adjust this if your JWT middleware has another name

// Create a new payment
router.post('/', verifyToken, processPayment);

// Get payment status
router.get('/:paymentId/status', verifyToken, getPaymentStatus);

module.exports = router;
