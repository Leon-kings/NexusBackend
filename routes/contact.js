const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');
const { validateContact } = require('../middleware/validation');

// Public routes
router.post('/', validateContact, contactController.createContact);

// Protected routes (Admin/Moderator)
// router.use(protect);

router.get('/',  contactController.getAllContacts);
router.get('/stats', authorize('admin', 'moderator'), contactController.getContactStats);
router.get('/:id', authorize('admin', 'moderator'), contactController.getContactById);
router.put('/:id', authorize('admin', 'moderator'), contactController.updateContact);
router.post('/:id/respond', authorize('admin', 'moderator'), contactController.respondToContact);
router.post('/:id/notes', authorize('admin', 'moderator'), contactController.addNote);
router.patch('/:id/archive', authorize('admin', 'moderator'), contactController.archiveContact);
router.post('/bulk-update', authorize('admin'), contactController.bulkUpdateContacts);

// Admin only routes
router.delete('/:id', authorize('admin'), contactController.deleteContact);

module.exports = router;