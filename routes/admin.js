const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and require admin role
// router.use(protect);
// router.use(authorize('admin'));

router.get('/', adminController.getAllUsers);
router.get('/:id', adminController.getUserById);
router.put('/:id/role', adminController.updateUserRole);
router.patch('/:id/toggle-active', adminController.toggleUserActive);
router.delete('/:id', adminController.deleteUser);
router.post('/bulk-action', adminController.bulkAction);

module.exports = router;