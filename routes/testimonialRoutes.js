const express = require('express');
const router = express.Router();
const { upload } = require('../cloudinary/cloudinary');
const {
  createTestimonial,
  getTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
} = require('../controllers/testimonialController');

// Create testimonial with image upload
router.post('/', upload.single('image'), createTestimonial);

// Get all testimonials
router.get('/', getTestimonials);

// Get single testimonial
router.get('/:id', getTestimonialById);

// Update testimonial (with optional new image)
router.put('/:id', upload.single('image'), updateTestimonial);

// Delete testimonial
router.delete('/:id', deleteTestimonial);

module.exports = router;
