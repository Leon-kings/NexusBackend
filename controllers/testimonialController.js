const Testimonial = require('../models/Testimonial');
const { cloudinary } = require('../cloudinary/cloudinary');

// @desc    Create a new testimonial
// @route   POST /api/testimonials
// @access  Public/Admin
const createTestimonial = async (req, res) => {
  try {
    const { name, position, quote } = req.body;

    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }

    // Create testimonial
    const testimonial = new Testimonial({
      name,
      position,
      quote,
      image: {
        public_id: req.file.filename,
        url: req.file.path
      }
    });

    await testimonial.save();

    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      data: testimonial
    });
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating testimonial',
      error: error.message
    });
  }
};

// @desc    Get all testimonials
// @route   GET /api/testimonials
// @access  Public
const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find()
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials
    });
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching testimonials',
      error: error.message
    });
  }
};

// @desc    Get single testimonial
// @route   GET /api/testimonials/:id
// @access  Public
const getTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    res.status(200).json({
      success: true,
      data: testimonial
    });
  } catch (error) {
    console.error('Get testimonial error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid testimonial ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching testimonial',
      error: error.message
    });
  }
};

// @desc    Update testimonial
// @route   PUT /api/testimonials/:id
// @access  Public/Admin
const updateTestimonial = async (req, res) => {
  try {
    const { name, position, quote } = req.body;
    
    let updateData = { name, position, quote };

    // If new image is uploaded
    if (req.file) {
      // First get the current testimonial to delete old image
      const currentTestimonial = await Testimonial.findById(req.params.id);
      
      if (currentTestimonial && currentTestimonial.image.public_id) {
        // Delete old image from Cloudinary
        await cloudinary.uploader.destroy(currentTestimonial.image.public_id);
      }

      updateData.image = {
        public_id: req.file.filename,
        url: req.file.path
      };
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Testimonial updated successfully',
      data: testimonial
    });
  } catch (error) {
    console.error('Update testimonial error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid testimonial ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating testimonial',
      error: error.message
    });
  }
};

// @desc    Delete testimonial
// @route   DELETE /api/testimonials/:id
// @access  Public/Admin
const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    // Delete image from Cloudinary
    if (testimonial.image.public_id) {
      await cloudinary.uploader.destroy(testimonial.image.public_id);
    }

    // Delete from database
    await Testimonial.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid testimonial ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error deleting testimonial',
      error: error.message
    });
  }
};

module.exports = {
  createTestimonial,
  getTestimonials,
  getTestimonial,
  updateTestimonial,
  deleteTestimonial
};