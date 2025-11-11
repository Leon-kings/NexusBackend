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
router.get('/stats', questionController.getQuestionStats);
router.get('/:id', questionController.getQuestionById);
router.put('/:id', questionController.updateQuestion);
router.post('/:id/answer', questionController.answerQuestion);
router.post('/:id/notes', questionController.addNote);
router.patch('/:id/archive', questionController.archiveQuestion);
router.post('/bulk-update', questionController.bulkUpdateQuestions);

// Admin only routes
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;