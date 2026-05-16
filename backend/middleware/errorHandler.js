class AppError extends Error {
  constructor(message, statusCode, exposeError = false, internalError = null) {
    super(message);
    this.statusCode = statusCode;
    this.exposeError = exposeError;
    this.internalError = internalError;
    this.isOperational = true;
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  console.error(`${req.method} ${req.originalUrl} error:`, err.internalError || message);

  if (err.exposeError) {
    return res.status(statusCode).json({
      message,
      error: err.internalError || message,
    });
  }

  res.status(statusCode).json({ message });
};

module.exports = { AppError, asyncHandler, errorHandler };
