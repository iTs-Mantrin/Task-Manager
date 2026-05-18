const express = require('express');
const { createProject, listProjects, getProject, updateProject, deleteProject } = require('../controllers/projectController');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { objectId, projectCreateRules, projectUpdateRules, projectListQueryRules } = require('../validators/rules');

const router = express.Router();

router.use(protect);
router.route('/')
  .get(projectListQueryRules, validate, listProjects)
  .post(requireRole('Admin'), projectCreateRules, validate, createProject);
router.route('/:id')
  .get(objectId('id'), validate, getProject)
  .patch(requireRole('Admin'), objectId('id'), projectUpdateRules, validate, updateProject)
  .delete(requireRole('Admin'), objectId('id'), validate, deleteProject);

module.exports = router;
