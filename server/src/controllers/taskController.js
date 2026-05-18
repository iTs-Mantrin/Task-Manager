const Project = require('../models/Project');
const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const ensureObjectId = require('../utils/ensureObjectId');
const { getProjectForUser, userCanBeAssignedToProject, visibleProjectFilter } = require('../utils/access');

function updateCompletedAt(task, nextStatus) {
  if (nextStatus === 'Done' && task.status !== 'Done') {
    task.completedAt = new Date();
  }

  if (nextStatus && nextStatus !== 'Done') {
    task.completedAt = null;
  }
}

async function ensureAssigneeIsValid(assignee, project) {
  if (!assignee) {
    return;
  }

  if (!(await userCanBeAssignedToProject(assignee, project))) {
    throw new AppError('Assignee must belong to the task project or team', 400);
  }
}

async function findTaskForUser(taskId, user) {
  ensureObjectId(taskId, 'task id');

  const task = await Task.findById(taskId);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  await getProjectForUser(task.project, user);
  return task;
}

const createTask = asyncHandler(async (req, res) => {
  const project = await getProjectForUser(req.body.project, req.user);

  await ensureAssigneeIsValid(req.body.assignee, project);

  const task = await Task.create({
    title: req.body.title,
    description: req.body.description || '',
    status: req.body.status || 'Todo',
    priority: req.body.priority || 'Medium',
    project: project._id,
    team: project.team || null,
    assignee: req.body.assignee || null,
    dueDate: req.body.dueDate || null,
    completedAt: req.body.status === 'Done' ? new Date() : null,
    createdBy: req.user._id,
  });

  res.status(201).json({ data: task });
});

const listTasks = asyncHandler(async (req, res) => {
  const projectFilter = await visibleProjectFilter(req.user);
  const visibleProjects = await Project.find(projectFilter).select('_id');
  const filter = { project: { $in: visibleProjects.map((project) => project._id) } };

  if (req.query.status) filter.status = req.query.status;
  if (req.query.project) {
    const requestedProject = visibleProjects.find((project) => project._id.toString() === req.query.project);
    if (!requestedProject) {
      throw new AppError('You do not have access to this project', 403);
    }
    filter.project = req.query.project;
  }
  if (req.query.team) {
    const teamProjects = await Project.find({
      _id: filter.project.$in ? { $in: filter.project.$in } : filter.project,
      $or: [{ team: req.query.team }, { teams: req.query.team }],
    }).select('_id');
    filter.project = { $in: teamProjects.map((project) => project._id) };
  }
  if (req.query.assignee) filter.assignee = req.query.assignee;

  const tasks = await Task.find(filter)
    .populate('project', 'name status')
    .populate('team', 'name')
    .populate('assignee', 'name email role')
    .populate('createdBy', 'name email role')
    .sort({ dueDate: 1, createdAt: -1 });

  res.json({ data: tasks });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await findTaskForUser(req.params.id, req.user);
  await task.populate('project', 'name status');
  await task.populate('team', 'name');
  await task.populate('assignee', 'name email role');
  await task.populate('createdBy', 'name email role');

  res.json({ data: task });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await findTaskForUser(req.params.id, req.user);
  const project = await getProjectForUser(task.project, req.user);

  if (req.body.assignee !== undefined) {
    await ensureAssigneeIsValid(req.body.assignee, project);
    task.assignee = req.body.assignee || null;
  }

  if (req.body.title !== undefined) task.title = req.body.title;
  if (req.body.description !== undefined) task.description = req.body.description;
  if (req.body.priority !== undefined) task.priority = req.body.priority;
  if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate || null;
  if (req.body.status !== undefined) {
    updateCompletedAt(task, req.body.status);
    task.status = req.body.status;
  }

  await task.save();
  res.json({ data: task });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await findTaskForUser(req.params.id, req.user);

  await task.deleteOne();
  res.json({ message: 'Task deleted' });
});

module.exports = { createTask, listTasks, getTask, updateTask, deleteTask };

