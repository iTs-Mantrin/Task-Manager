const jwt = require('jsonwebtoken');

function signToken(user, extraPayload = {}) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }

  return jwt.sign(
    { id: user._id.toString(), role: user.role, ...extraPayload },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = signToken;
