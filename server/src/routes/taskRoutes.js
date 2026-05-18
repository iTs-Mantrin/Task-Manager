const express = require('express');
const { createTask, listTasks, getTask, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { objectId, taskCreateRules, taskUpdateRules, taskListQueryRules } = require('../validators/rules');

const router = express.Router();

router.use(protect);
router.route('/')
  .get(taskListQueryRules, validate, listTasks)
  .post(taskCreateRules, validate, createTask);
router.route('/:id')
  .get(objectId('id'), validate, getTask)
  .patch(objectId('id'), taskUpdateRules, validate, updateTask)
  .delete(objectId('id'), validate, deleteTask);

module.exports = router;
