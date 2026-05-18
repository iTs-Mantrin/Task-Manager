const express = require('express');
const { createTeam, listTeams, getTeam, updateTeam, addMember, updateMember, removeMember, deleteTeam } = require('../controllers/teamController');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { objectId, teamCreateRules, teamUpdateRules, memberRules, memberUpdateRules } = require('../validators/rules');

const router = express.Router();

router.use(protect);
router.route('/')
  .get(listTeams)
  .post(requireRole('Admin'), teamCreateRules, validate, createTeam);
router.route('/:id')
  .get(objectId('id'), validate, getTeam)
  .patch(requireRole('Admin'), objectId('id'), teamUpdateRules, validate, updateTeam)
  .delete(requireRole('Admin'), objectId('id'), validate, deleteTeam);
router.post('/:id/members', requireRole('Admin'), objectId('id'), memberRules, validate, addMember);
router.patch('/:id/members/:userId', requireRole('Admin'), objectId('id'), objectId('userId'), memberUpdateRules, validate, updateMember);
router.delete('/:id/members/:userId', requireRole('Admin'), objectId('id'), objectId('userId'), validate, removeMember);

module.exports = router;
