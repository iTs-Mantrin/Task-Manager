const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new AppError('Authentication required', 401);
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('Authenticated user no longer exists', 401);
  }

  // If token has a sessionId, check the session is still active
  if (decoded.sessionId) {
    const session = await Session.findOne({ tokenIdentifier: decoded.sessionId, user: user._id });
    if (!session || !session.isActive) {
      throw new AppError('Session has been terminated. Please log in again.', 401);
    }
    // Update lastActiveAt on each request (fire-and-forget)
    Session.updateOne({ _id: session._id }, { lastActiveAt: new Date() }).catch(() => {});
  }

  req.user = user;
  next();
});

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
}

module.exports = { protect, requireRole };
