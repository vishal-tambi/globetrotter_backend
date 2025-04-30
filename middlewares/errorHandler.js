const { ApiError } = require('../utils/response');
const { logSecurityEvent } = require('../services/auditService');

const errorHandler = (err, req, res, next) => {
  let error = err;
  
  // Handle mongoose validation errors
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(val => val.message);
    error = new ApiError(400, 'Validation Error', messages);
  }
  
  // Handle mongoose duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    error = new ApiError(400, `${field} already exists`);
  }
  
  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token');
  }
  
  // Handle token expired error
  if (error.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expired');
  }
  
  // Log the error
  logSecurityEvent({
    event: 'API_ERROR',
    error: error.message,
    stack: error.stack,
    ip: req.ip,
    route: req.originalUrl,
    statusCode: error.statusCode || 500
  });
  
  // Send response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errors = error.errors || [];
  
  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

module.exports = errorHandler;