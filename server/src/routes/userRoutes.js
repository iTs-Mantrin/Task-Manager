const express = require('express');
const { me } = require('../controllers/authController');
const { changePassword, createUser, deleteUser, listUsers, updateProfile, updateUser } = require('../controllers/userController');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { objectId, passwordChangeRules, profileUpdateRules, signupRules, userUpdateRules } = require('../validators/rules');

const router = express.Router();

router.use(protect);
router.route('/profile')
  .get(me)
  .patch(profileUpdateRules, validate, updateProfile);
router.patch('/profile/password', passwordChangeRules, validate, changePassword);

router.route('/')
  .get(requireRole('Admin'), listUsers)
  .post(requireRole('Admin'), signupRules, validate, createUser);

router.route('/:id')
  .patch(requireRole('Admin'), objectId('id'), userUpdateRules, validate, updateUser)
  .delete(requireRole('Admin'), objectId('id'), validate, deleteUser);

module.exports = router;
