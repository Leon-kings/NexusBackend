const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/auth');
const { validateQuestion } = require('../middleware/validation');

// Public routes
router.post('/', validateQuestion, questionController.createQuestion);

// Protected routes (Admin/Moderator)
// router.use(protect);

router.get('/', questionController.getAllQuestions);
router.get('/stats', authorize('admin', 'moderator'), questionController.getQuestionStats);
router.get('/:id', authorize('admin', 'moderator'), questionController.getQuestionById);
router.put('/:id', authorize('admin', 'moderator'), questionController.updateQuestion);
router.post('/:id/answer', authorize('admin', 'moderator'), questionController.answerQuestion);
router.post('/:id/notes', authorize('admin', 'moderator'), questionController.addNote);
router.patch('/:id/archive', authorize('admin', 'moderator'), questionController.archiveQuestion);
router.post('/bulk-update', authorize('admin'), questionController.bulkUpdateQuestions);

// Admin only routes
router.delete('/:id', authorize('admin'), questionController.deleteQuestion);

module.exports = router;