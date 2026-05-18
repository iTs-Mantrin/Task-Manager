const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const signToken = require('../utils/signToken');
const { logActivity } = require('../services/activityLogService');
const { parseDeviceInfo } = require('../utils/deviceInfo');

function userPayload(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError('Email already exists', 409);
  }

  const user = await User.create({ name, email, password, role: role || 'Member' });
  const device = parseDeviceInfo(req);

  const tokenIdentifier = crypto.randomUUID();
  await Session.create({
    user: user._id,
    tokenIdentifier,
    ipAddress: device.ipAddress,
    deviceName: device.deviceName,
    deviceType: device.deviceType,
    location: device.location,
    userAgent: device.userAgent,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const token = signToken(user, { sessionId: tokenIdentifier });

  await logActivity(user, {
    action: 'create',
    resourceType: 'user',
    resourceId: user._id,
    resourceName: user.name,
    description: 'Created account',
    ...device,
  });

  res.status(201).json({ token, user: userPayload(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const device = parseDeviceInfo(req);

  const tokenIdentifier = crypto.randomUUID();
  await Session.create({
    user: user._id,
    tokenIdentifier,
    ipAddress: device.ipAddress,
    deviceName: device.deviceName,
    deviceType: device.deviceType,
    location: device.location,
    userAgent: device.userAgent,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const token = signToken(user, { sessionId: tokenIdentifier });

  await logActivity(user, {
    action: 'login',
    resourceType: 'user',
    resourceId: user._id,
    resourceName: user.name,
    description: 'Logged in',
    ...device,
  });

  res.json({ token, user: userPayload(user) });
});

const logout = asyncHandler(async (req, res) => {
  const device = parseDeviceInfo(req);
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;

  if (token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded?.sessionId) {
        await Session.findOneAndUpdate(
          { tokenIdentifier: decoded.sessionId, user: req.user._id },
          { isActive: false, lastActiveAt: new Date() }
        );
      }
    } catch {
      // token decode best-effort
    }
  }

  await logActivity(req.user, {
    action: 'logout',
    resourceType: 'user',
    resourceId: req.user._id,
    resourceName: req.user.name,
    description: 'Logged out',
    ...device,
  });

  res.json({ message: 'Logged out successfully' });
});

const me = asyncHandler(async (req, res) => {
  res.json({ data: userPayload(req.user) });
});

module.exports = { signup, login, logout, me };
