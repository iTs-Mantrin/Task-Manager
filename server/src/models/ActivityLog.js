const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    actorRole: {
      type: String,
      enum: ['Admin', 'Member'],
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'profile_update', 'password_change', 'member_add', 'member_update', 'member_remove', 'login', 'logout', 'session_revoked'],
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['user', 'profile', 'team', 'project', 'task'],
      required: true,
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    resourceName: {
      type: String,
      trim: true,
      default: '',
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
      trim: true,
      maxlength: 45,
    },
    deviceName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },
    location: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200,
    },
    userAgent: {
      type: String,
      default: '',
      maxlength: 500,
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ actor: 1, createdAt: -1 });
activityLogSchema.index({ actorRole: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
