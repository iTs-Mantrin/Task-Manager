const express = require('express');
const { listOwnActivity, listMemberActivity } = require('../controllers/activityLogController');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { activityLogQueryRules } = require('../validators/rules');

const router = express.Router();

router.use(protect);
router.get('/me', listOwnActivity);
router.get('/members', requireRole('Admin'), activityLogQueryRules, validate, listMemberActivity);

module.exports = router;
