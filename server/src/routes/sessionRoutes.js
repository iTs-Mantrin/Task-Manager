const express = require('express');
const { listMySessions, terminateSession, terminateAllOtherSessions } = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { objectId } = require('../validators/rules');

const router = express.Router();

router.use(protect);
router.get('/me', listMySessions);
router.delete('/other', terminateAllOtherSessions);
router.delete('/:id', objectId('id'), validate, terminateSession);

module.exports = router;
