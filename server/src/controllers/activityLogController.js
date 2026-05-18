const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const ensureObjectId = require('../utils/ensureObjectId');

const listOwnActivity = asyncHandler(async (req, res) => {
  const data = await ActivityLog.find({ actor: req.user._id })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  res.json({ data });
});

const listMemberActivity = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const filter = userId ? { actor: userId } : { actorRole: 'Member' };

  if (userId) {
    ensureObjectId(userId, 'user id');
    const member = await User.findById(userId).select('role');

    if (!member) {
      throw new AppError('Member not found', 404);
    }

    if (member.role !== 'Member') {
      throw new AppError('Only member history can be viewed in this section', 400);
    }
  }

  const data = await ActivityLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  res.json({ data });
});

module.exports = { listOwnActivity, listMemberActivity };
