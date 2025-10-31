const express = require('express');
const router = express.Router();
const {
  createTestimonial,
  getTestimonials,
  getTestimonial,
  updateTestimonial,
  deleteTestimonial
} = require('../controllers/testimonialController');
const { uploadImage, handleUploadErrors } = require('../middleware/upload');

// Public routes
router.get('/', getTestimonials);
router.get('/:id', getTestimonial);

// Protected routes (add authentication middleware as needed)
router.post('/', uploadImage, handleUploadErrors, createTestimonial);
router.put('/:id', uploadImage, handleUploadErrors, updateTestimonial);
router.delete('/:id', deleteTestimonial);

module.exports = router;