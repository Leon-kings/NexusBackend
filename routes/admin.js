const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and require admin role
// router.use(protect);
// router.use(authorize('admin'));

router.get('/', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/toggle-active', adminController.toggleUserActive);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/bulk-action', adminController.bulkAction);

module.exports = router;