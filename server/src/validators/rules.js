const { body, param, query } = require('express-validator');

const objectId = (field, location = param) => location(field).isMongoId().withMessage(`${field} must be a valid id`);
const optionalObjectId = (field) => body(field).optional({ nullable: true }).isMongoId().withMessage(`${field} must be a valid id`);

const signupRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('email').isEmail().withMessage('Email must be valid').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['Admin', 'Member']).withMessage('Role must be Admin or Member'),
];

const loginRules = [
  body('email').isEmail().withMessage('Email must be valid').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const userUpdateRules = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('email').optional().isEmail().withMessage('Email must be valid').normalizeEmail(),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['Admin', 'Member']).withMessage('Role must be Admin or Member'),
];

const profileUpdateRules = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('email').optional().isEmail().withMessage('Email must be valid').normalizeEmail(),
];

const passwordChangeRules = [
  body('currentPassword').notEmpty().withMessage('currentPassword is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('newPassword must be at least 8 characters'),
];

const teamCreateRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Team name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('members').optional().isArray().withMessage('Members must be an array'),
  body('members.*.user').optional().isMongoId().withMessage('Member user must be a valid id'),
  body('members.*.role').optional().isIn(['Admin', 'Member']).withMessage('Member role must be Admin or Member'),
];

const teamUpdateRules = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Team name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
];

const memberRules = [
  body('userId').isMongoId().withMessage('userId must be a valid id'),
  body('role').optional().isIn(['Admin', 'Member']).withMessage('Role must be Admin or Member'),
];

const memberUpdateRules = [
  body('role').isIn(['Admin', 'Member']).withMessage('Role must be Admin or Member'),
];

const projectCreateRules = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Project name must be 2-120 characters'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('status').optional().isIn(['Planning', 'Active', 'On Hold', 'Completed', 'Archived']).withMessage('Invalid project status'),
  body('teams').isArray({ min: 1 }).withMessage('teams must contain at least one team id'),
  body('teams.*').isMongoId().withMessage('teams must contain valid ids'),
  body('members').optional().isArray().withMessage('Members must be an array'),
  body('members.*').optional().isMongoId().withMessage('Project members must be valid ids'),
  body('startDate').optional({ nullable: true }).isISO8601().withMessage('startDate must be a valid date'),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('dueDate must be a valid date'),
];

const projectUpdateRules = [
  body('name').optional().trim().isLength({ min: 2, max: 120 }).withMessage('Project name must be 2-120 characters'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('status').optional().isIn(['Planning', 'Active', 'On Hold', 'Completed', 'Archived']).withMessage('Invalid project status'),
  body('teams').optional().isArray({ min: 1 }).withMessage('teams must contain at least one team id'),
  body('teams.*').optional().isMongoId().withMessage('teams must contain valid ids'),
  body('members').optional().isArray().withMessage('Members must be an array'),
  body('members.*').optional().isMongoId().withMessage('Project members must be valid ids'),
  body('startDate').optional({ nullable: true }).isISO8601().withMessage('startDate must be a valid date'),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('dueDate must be a valid date'),
];

const taskCreateRules = [
  body('title').trim().isLength({ min: 2, max: 160 }).withMessage('Task title must be 2-160 characters'),
  body('description').optional().trim().isLength({ max: 4000 }).withMessage('Description cannot exceed 4000 characters'),
  body('status').optional().isIn(['Todo', 'In Progress', 'Review', 'Done']).withMessage('Invalid task status'),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid task priority'),
  body('project').isMongoId().withMessage('project must be a valid id'),
  optionalObjectId('assignee'),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('dueDate must be a valid date'),
];

const taskUpdateRules = [
  body('title').optional().trim().isLength({ min: 2, max: 160 }).withMessage('Task title must be 2-160 characters'),
  body('description').optional().trim().isLength({ max: 4000 }).withMessage('Description cannot exceed 4000 characters'),
  body('status').optional().isIn(['Todo', 'In Progress', 'Review', 'Done']).withMessage('Invalid task status'),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid task priority'),
  optionalObjectId('assignee'),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('dueDate must be a valid date'),
];

const projectListQueryRules = [
  query('status').optional().isIn(['Planning', 'Active', 'On Hold', 'Completed', 'Archived']).withMessage('Invalid project status'),
  query('team').optional().isMongoId().withMessage('team must be a valid id'),
  query('project').optional().isMongoId().withMessage('project must be a valid id'),
  query('assignee').optional().isMongoId().withMessage('assignee must be a valid id'),
];

const taskListQueryRules = [
  query('status').optional().isIn(['Todo', 'In Progress', 'Review', 'Done']).withMessage('Invalid task status'),
  query('team').optional().isMongoId().withMessage('team must be a valid id'),
  query('project').optional().isMongoId().withMessage('project must be a valid id'),
  query('assignee').optional().isMongoId().withMessage('assignee must be a valid id'),
];

const activityLogQueryRules = [
  query('userId').optional().isMongoId().withMessage('userId must be a valid id'),
];

module.exports = {
  objectId,
  signupRules,
  loginRules,
  userUpdateRules,
  profileUpdateRules,
  passwordChangeRules,
  teamCreateRules,
  teamUpdateRules,
  memberRules,
  memberUpdateRules,
  projectCreateRules,
  projectUpdateRules,
  taskCreateRules,
  taskUpdateRules,
  projectListQueryRules,
  taskListQueryRules,
  activityLogQueryRules,
};
