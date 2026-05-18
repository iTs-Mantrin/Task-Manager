function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = error.message || 'Server error';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors).map((item) => item.message).join(', ');
  }

  if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    message = `${field} already exists`;
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${error.path}`;
  }

  res.status(statusCode).json({ message });
}

module.exports = errorHandler;
