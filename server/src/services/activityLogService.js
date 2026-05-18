const ActivityLog = require('../models/ActivityLog');

function pickProvidedFields(payload, fields) {
  return fields.filter((field) => Object.prototype.hasOwnProperty.call(payload, field));
}

async function logActivity(actor, entry) {
  if (!actor?._id) {
    return;
  }

  await ActivityLog.create({
    actor: actor._id,
    actorName: actor.name,
    actorRole: actor.role,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId || null,
    resourceName: entry.resourceName || '',
    description: entry.description,
    metadata: entry.metadata || {},
    ipAddress: entry.ipAddress || '',
    deviceName: entry.deviceName || '',
    deviceType: entry.deviceType || 'unknown',
    location: entry.location || '',
    userAgent: entry.userAgent || '',
  });
}

module.exports = { logActivity, pickProvidedFields };
