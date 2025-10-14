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

// Unified payment validation
exports.validatePayment = [
  body('orderId').isMongoId().withMessage('Valid order ID is required'),
  body('paymentMethod').isIn(['stripe', 'paypack']).withMessage('Valid payment method is required'),
  body('paymentData').isObject().withMessage('Payment data is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Stripe-specific validation
exports.validateStripePayment = [
  body('orderId').isMongoId().withMessage('Valid order ID is required'),
  body('cardNumber').isLength({ min: 13, max: 19 }).withMessage('Valid card number is required'),
  body('expiryDate').matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/).withMessage('Valid expiry date (MM/YY) is required'),
  body('cvv').isLength({ min: 3, max: 4 }).withMessage('Valid CVV is required'),
  body('cardHolder').notEmpty().withMessage('Card holder name is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Stripe payment validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Paypack-specific validation
exports.validatePaypackPayment = [
  body('orderId').isMongoId().withMessage('Valid order ID is required'),
  body('mobileNumber').matches(/^(078|079|072|073)\d{7}$/).withMessage('Valid Rwanda mobile number is required'),
  body('network').isIn(['mtn', 'airtel', 'tigo']).withMessage('Valid mobile network is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Mobile payment validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];