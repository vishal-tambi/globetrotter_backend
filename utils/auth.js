const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { promisify } = require('util');

const jwtSign = promisify(jwt.sign);
const jwtVerify = promisify(jwt.verify);

// Generate secure random token
const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

// Create challenge token with enhanced security
const createChallengeToken = async (username) => {
  const payload = {
    username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    jti: generateToken(16) // Unique token ID
  };
  
  return await jwtSign(payload, process.env.JWT_SECRET);
};

// Verify challenge token with comprehensive checks
const verifyChallengeToken = async (token) => {
  try {
    const decoded = await jwtVerify(token, process.env.JWT_SECRET);
    
    // Additional validation checks
    if (!decoded.username || !decoded.iat || !decoded.exp || !decoded.jti) {
      throw new Error('Invalid token structure');
    }
    
    if (decoded.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }
    
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

// Password hashing with salt rounds
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

// Password verification with timing-safe comparison
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
  generateToken,
  createChallengeToken,
  verifyChallengeToken,
  hashPassword,
  verifyPassword
};