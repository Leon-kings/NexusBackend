const jwt = require('jsonwebtoken');

// Generate JWT Token
exports.generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Generate Refresh Token
exports.generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '90d' });
};

// Verify Token
exports.verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Verify Refresh Token
exports.verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};