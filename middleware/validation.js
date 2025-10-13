const { body, validationResult } = require('express-validator');

// Validation middleware
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Booking validation
exports.validateBooking = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot be more than 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .isLength({ max: 20 })
    .withMessage('Phone number cannot be more than 20 characters'),
  
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot be more than 100 characters'),
  
  body('serviceType')
    .isIn([
      'web-development',
      'mobile-app',
      'ecommerce',
      'ui-ux-design',
      'digital-marketing',
      'seo',
      'consulting',
      'maintenance',
      'other'
    ])
    .withMessage('Invalid service type'),
  
  body('budget')
    .optional()
    .isIn([
      '1000-5000',
      '5000-10000',
      '10000-25000',
      '25000-50000',
      '50000-100000',
      '100000+',
      'not-specified'
    ])
    .withMessage('Invalid budget range'),
  
  body('timeline')
    .isIn([
      'immediate',
      '2-weeks',
      '1-month',
      '2-3-months',
      '3-6-months',
      '6-months-plus',
      'flexible'
    ])
    .withMessage('Invalid timeline'),
  
  body('requirements')
    .trim()
    .notEmpty()
    .withMessage('Requirements are required')
    .isLength({ max: 5000 })
    .withMessage('Requirements cannot be more than 5000 characters'),
  
  this.handleValidationErrors
];
// Validation middleware
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Question validation
exports.validateQuestion = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot be more than 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ max: 200 })
    .withMessage('Subject cannot be more than 200 characters'),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 5000 })
    .withMessage('Message cannot be more than 5000 characters'),
  
  body('category')
    .optional()
    .isIn([
      'general',
      'technical',
      'billing',
      'support',
      'feature-request',
      'bug-report',
      'partnership',
      'other'
    ])
    .withMessage('Invalid category'),
  
  this.handleValidationErrors
];


// Enhanced validation middleware
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Enhanced Registration validation with both express-validator and custom checks
exports.validateRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot be more than 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  // Additional custom validation for required fields
  (req, res, next) => {
    const { name, email, password, confirmPassword } = req.body;

    // Check if all required fields are present
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    next();
  },
  
  this.handleValidationErrors
];

// Enhanced Login validation
exports.validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  // Additional custom validation for required fields
  (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    next();
  },
  
  this.handleValidationErrors
];

// Contact form validation (unchanged from first version)
exports.validateContact = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot be more than 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot be more than 20 characters'),
  
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot be more than 100 characters'),
  
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ max: 200 })
    .withMessage('Subject cannot be more than 200 characters'),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 5000 })
    .withMessage('Message cannot be more than 5000 characters'),
  
  body('interest')
    .optional()
    .isIn([
      'general',
      'web-development',
      'mobile-app',
      'ecommerce',
      'consulting',
      'partnership',
      'career',
      'other'
    ])
    .withMessage('Invalid interest type'),
  
  body('budget')
    .optional()
    .isIn([
      '500-1000',
      '1000-5000',
      '5000-10000',
      '10000-25000',
      '25000-50000',
      '50000+',
      'not-specified'
    ])
    .withMessage('Invalid budget range'),
  
  this.handleValidationErrors
];

// Alternative simple validation functions (for backward compatibility)
exports.validateRegistrationSimple = (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters'
    });
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address'
    });
  }

  next();
};

exports.validateLoginSimple = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  next();
};

// Validation middleware
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Stripe payment validation
exports.validateStripePayment = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Invalid order ID'),
  
  body('paymentMethodId')
    .notEmpty()
    .withMessage('Payment method ID is required'),
  
  body('cardHolder')
    .trim()
    .notEmpty()
    .withMessage('Card holder name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Card holder name must be between 2 and 100 characters'),
  
  body('saveCard')
    .optional()
    .isBoolean()
    .withMessage('Save card must be a boolean value'),
  
  this.handleValidationErrors
];

// Paypack payment validation
exports.validatePaypackPayment = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Invalid order ID'),
  
  body('mobileNumber')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^\+?[0-9\s\-\(\)]{10,}$/)
    .withMessage('Please enter a valid mobile number'),
  
  body('provider')
    .isIn(['mtn', 'airtel', 'tigo'])
    .withMessage('Provider must be mtn, airtel, or tigo'),
  
  this.handleValidationErrors
];