const express = require('express');
const { signup, login, logout, me } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { signupRules, loginRules } = require('../validators/rules');

const router = express.Router();

router.post('/signup', signupRules, validate, signup);
router.post('/register', signupRules, validate, signup);
router.post('/login', loginRules, validate, login);
router.post('/logout', protect, logout);
router.get('/me', protect, me);

module.exports = router;
