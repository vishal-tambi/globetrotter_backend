class ApiResponse {
    constructor(statusCode, data, message = "Success") {
      this.statusCode = statusCode;
      this.data = data;
      this.message = message;
      this.success = statusCode < 400;
    }
  }
  
  class ApiError extends Error {
    constructor(statusCode, message, errors = [], stack = "") {
      super(message);
      this.statusCode = statusCode;
      this.errors = errors;
      this.success = false;
      
      if (stack) {
        this.stack = stack;
      } else {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }
  
  const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
      Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    };
  };
  
  module.exports = {
    ApiResponse,
    ApiError,
    asyncHandler
  };