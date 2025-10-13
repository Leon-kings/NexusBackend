const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const { validateBooking } = require('../middleware/validation');

// Public routes
router.post('/', validateBooking, bookingController.createBooking);

// Protected routes (Admin/Moderator/Sales)
// router.use(protect);

router.get('/', bookingController.getAllBookings);
router.get('/stats', authorize('admin', 'moderator', 'sales'), bookingController.getBookingStats);
router.get('/:id', authorize('admin', 'moderator', 'sales'), bookingController.getBookingById);
router.put('/:id', authorize('admin', 'moderator', 'sales'), bookingController.updateBooking);
router.patch('/:id/status', authorize('admin', 'moderator', 'sales'), bookingController.updateStatus);
router.post('/:id/notes', authorize('admin', 'moderator', 'sales'), bookingController.addNote);
router.patch('/:id/archive', authorize('admin', 'moderator', 'sales'), bookingController.archiveBooking);
router.post('/bulk-update', authorize('admin', 'sales'), bookingController.bulkUpdateBookings);

// Admin only routes
router.delete('/:id', authorize('admin'), bookingController.deleteBooking);

module.exports = router;