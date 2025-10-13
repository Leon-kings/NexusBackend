const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth');

// Protected admin routes
router.get('/users', protect, authorize('admin', 'moderator'), statsController.getUserStats);
router.get('/dashboard', protect, authorize('admin'), statsController.getDashboardStats);
router.get('/activity', protect, authorize('admin'), statsController.getUserActivity);

module.exports = router;