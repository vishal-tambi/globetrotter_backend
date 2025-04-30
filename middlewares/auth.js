const config = require('../config'); // Assuming you have a config file for your secrets
const { verifyChallengeToken } = require('../utils/auth');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');
const { logSecurityEvent } = require('../services/auditService');


// Rate limiter for auth endpoints
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  skipSuccessfulRequests: false,
  handler: (req, res, next, options) => {
    logSecurityEvent({
      event: 'RATE_LIMIT_EXCEEDED',
      ip: req.ip,
      route: req.originalUrl
    });
    res.status(options.statusCode).json({ error: options.message });
  }
});


// Authentication middleware with enhanced security
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logSecurityEvent({
      event: 'AUTH_HEADER_MISSING',
      ip: req.ip,
      route: req.originalUrl
    });
    return res.status(401).json({ error: 'Authentication token required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = await verifyChallengeToken(token);
    
    if (!decoded) {
      logSecurityEvent({
        event: 'INVALID_TOKEN',
        ip: req.ip,
        route: req.originalUrl
      });
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Verify user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      logSecurityEvent({
        event: 'USER_NOT_FOUND',
        userId: decoded.userId,
        ip: req.ip
      });
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Check if token was issued before last password change
    if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
      logSecurityEvent({
        event: 'TOKEN_EXPIRED_PASSWORD_CHANGE',
        userId: decoded.userId
      });
      return res.status(401).json({ error: 'Token expired. Please log in again' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    logSecurityEvent({
      event: 'AUTH_ERROR',
      error: error.message,
      ip: req.ip
    });
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logSecurityEvent({
        event: 'UNAUTHORIZED_ACCESS',
        username: req.user.username,
        attemptedRoute: req.originalUrl
      });
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    next();
  };
};

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    logSecurityEvent({
      event: 'ADMIN_AUTH_HEADER_MISSING',
      ip: req.ip,
      route: req.originalUrl
    });
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  const expectedToken = Buffer.from(`admin:${config.ADMIN_SECRET}`).toString('base64');
  
  if (token !== expectedToken) {
    logSecurityEvent({
      event: 'INVALID_ADMIN_TOKEN',
      ip: req.ip,
      route: req.originalUrl
    });
    return res.status(401).json({ error: 'Invalid admin token' });
  }
  
  next();
};

// Update exports
module.exports = {
  authRateLimiter,
  authenticate,
  authenticateAdmin,
  authorize
};
