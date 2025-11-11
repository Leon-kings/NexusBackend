// routes/subscriptionRoutes.js
const express = require('express');
const { body } = require('express-validator');
const subscriptionController = require('../controllers/subscriptionController');

const router = express.Router();

// Validation rules
const subscribeValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

// Routes
router.post('/subscribe', subscribeValidation, subscriptionController.subscribe);
router.post('/unsubscribe', subscribeValidation, subscriptionController.unsubscribe);
router.get('/', subscriptionController.getSubscriptions);
router.get('/stats', subscriptionController.getStats);

module.exports = router;