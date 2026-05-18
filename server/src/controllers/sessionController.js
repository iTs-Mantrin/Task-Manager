const Session = require('../models/Session');
const ActivityLog = require('../models/ActivityLog');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const ensureObjectId = require('../utils/ensureObjectId');
const { logActivity } = require('../services/activityLogService');
const { parseDeviceInfo } = require('../utils/deviceInfo');
const jwt = require('jsonwebtoken');

const listMySessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ user: req.user._id, isActive: true })
    .select('tokenIdentifier ipAddress deviceName deviceType location userAgent lastActiveAt createdAt expiresAt')
    .sort({ lastActiveAt: -1 })
    .lean();

  const currentToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;

  let currentSessionId = null;
  if (currentToken) {
    try {
      const decoded = jwt.decode(currentToken);
      currentSessionId = decoded?.sessionId || null;
    } catch {
      // best-effort
    }
  }

  const data = sessions.map(({ tokenIdentifier, ...rest }) => ({
    ...rest,
    isCurrentSession: tokenIdentifier === currentSessionId,
  }));

  res.json({ data, count: data.length });
});

const terminateSession = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'session id');

  const session = await Session.findOne({ _id: req.params.id, user: req.user._id });

  if (!session) {
    throw new AppError('Session not found', 404);
  }

  if (!session.isActive) {
    throw new AppError('Session is already inactive', 400);
  }

  const currentToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;

  if (currentToken) {
    try {
      const decoded = jwt.decode(currentToken);
      if (decoded?.sessionId === session.tokenIdentifier) {
        throw new AppError('Cannot terminate your current session. Use logout instead.', 400);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
    }
  }

  session.isActive = false;
  session.lastActiveAt = new Date();
  await session.save();

  const device = parseDeviceInfo(req);
  await logActivity(req.user, {
    action: 'session_revoked',
    resourceType: 'user',
    resourceId: req.user._id,
    resourceName: req.user.name,
    description: `Terminated session on ${session.deviceName || 'unknown device'}`,
    metadata: { terminatedSessionId: session._id, terminatedDeviceName: session.deviceName },
    ...device,
  });

  res.json({ message: 'Session terminated', data: { _id: session._id } });
});

const terminateAllOtherSessions = asyncHandler(async (req, res) => {
  const currentToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;

  let currentSessionId = null;
  if (currentToken) {
    try {
      const decoded = jwt.decode(currentToken);
      currentSessionId = decoded?.sessionId || null;
    } catch {
      // best-effort
    }
  }

  const filter = { user: req.user._id, isActive: true };
  if (currentSessionId) {
    filter.tokenIdentifier = { $ne: currentSessionId };
  }

  const result = await Session.updateMany(filter, { isActive: false, lastActiveAt: new Date() });

  const device = parseDeviceInfo(req);
  await logActivity(req.user, {
    action: 'session_revoked',
    resourceType: 'user',
    resourceId: req.user._id,
    resourceName: req.user.name,
    description: `Terminated all other sessions (${result.modifiedCount} devices)`,
    metadata: { terminatedCount: result.modifiedCount },
    ...device,
  });

  res.json({ message: 'All other sessions terminated', data: { terminatedCount: result.modifiedCount } });
});

module.exports = { listMySessions, terminateSession, terminateAllOtherSessions };
