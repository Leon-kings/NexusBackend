const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth'); // if using JWT auth

router.post('/process', protect, paymentController.processPayment);
router.get('/status/:paymentId', protect, paymentController.getPaymentStatus);

module.exports = router;
