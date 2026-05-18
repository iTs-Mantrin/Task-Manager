const User = require('../models/User');
const Team = require('../models/Team');
const Project = require('../models/Project');
const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const ensureObjectId = require('../utils/ensureObjectId');
const { getTeamForUser, getProjectForUser, getProjectTeamIds, isAdmin, teamHasMember, visibleProjectFilter, userCanBeAssignedToProject } = require('../utils/access');

function normalizeDateValue(value) {
  return value || null;
}

function sameIds(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

async function normalizeProjectTeams(teamIds = [], user) {
  const uniqueIds = [...new Set(teamIds.map((id) => id.toString()))];

  if (!uniqueIds.length) {
    throw new AppError('At least one team is required for a project', 400);
  }

  await Promise.all(uniqueIds.map((teamId) => getTeamForUser(teamId, user)));

  return uniqueIds;
}

async function normalizeProjectMembers(memberIds = [], project) {
  const uniqueIds = [...new Set(memberIds.map((id) => id.toString()))];
  const users = await User.countDocuments({ _id: { $in: uniqueIds } });
  const teams = await Team.find({ _id: { $in: getProjectTeamIds(project) } }).select('owner members');

  if (users !== uniqueIds.length) {
    throw new AppError('One or more project members do not exist', 400);
  }

  for (const userId of uniqueIds) {
    if (!teams.some((team) => teamHasMember(team, userId))) {
      throw new AppError('Project members must belong to at least one selected project team', 400);
    }
  }

  return uniqueIds;
}

const createProject = asyncHandler(async (req, res) => {
  if (!isAdmin(req.user)) {
    throw new AppError('Only Admin users can create projects', 403);
  }

  const teamIds = await normalizeProjectTeams(req.body.teams, req.user);
  const project = new Project({
    name: req.body.name,
    description: req.body.description || '',
    status: req.body.status || 'Planning',
    team: teamIds[0],
    teams: teamIds,
    members: [],
    startDate: normalizeDateValue(req.body.startDate),
    dueDate: normalizeDateValue(req.body.dueDate),
    createdBy: req.user._id,
  });

  project.members = await normalizeProjectMembers(req.body.members || [], project);
  await project.save();

  res.status(201).json({ data: project });
});

const listProjects = asyncHandler(async (req, res) => {
  const filter = await visibleProjectFilter(req.user);
  const constraints = [filter];

  if (req.query.status) {
    constraints.push({ status: req.query.status });
  }

  if (req.query.team) {
    constraints.push({ $or: [{ team: req.query.team }, { teams: req.query.team }] });
  }

  const projects = await Project.find(constraints.length === 1 ? constraints[0] : { $and: constraints })
    .populate('team', 'name')
    .populate('teams', 'name')
    .populate('members', 'name email role')
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 });

  res.json({ data: projects });
});

const getProject = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'project id');
  const project = await getProjectForUser(req.params.id, req.user);
  await project.populate('team', 'name');
  await project.populate('teams', 'name');
  await project.populate('members', 'name email role');
  await project.populate('createdBy', 'name email role');
  res.json({ data: project });
});

const updateProject = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'project id');
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (!isAdmin(req.user)) {
    throw new AppError('Only Admin users can update projects', 403);
  }

  const currentTeamIds = getProjectTeamIds(project).sort();
  const nextTeamIds = req.body.teams !== undefined
    ? (await normalizeProjectTeams(req.body.teams, req.user)).sort()
    : currentTeamIds;
  const teamChanged = !sameIds(currentTeamIds, nextTeamIds);

  if (req.body.teams !== undefined) {
    project.teams = nextTeamIds;
    project.team = nextTeamIds[0] || null;
  }

  if (req.body.name !== undefined) project.name = req.body.name;
  if (req.body.description !== undefined) project.description = req.body.description;
  if (req.body.status !== undefined) project.status = req.body.status;
  if (req.body.startDate !== undefined) project.startDate = normalizeDateValue(req.body.startDate);
  if (req.body.dueDate !== undefined) project.dueDate = normalizeDateValue(req.body.dueDate);

  const shouldRefreshMembers = req.body.members !== undefined || req.body.teams !== undefined;

  if (shouldRefreshMembers) {
    const members = req.body.members !== undefined ? req.body.members : project.members;
    project.members = await normalizeProjectMembers(members, project);
  }

  await project.save();

  if (teamChanged) {
    await Task.updateMany({ project: project._id }, { $set: { team: project.team || null } });
  }

  if (shouldRefreshMembers) {
    const tasks = await Task.find({ project: project._id, assignee: { $ne: null } }).select('_id assignee');

    for (const task of tasks) {
      if (!(await userCanBeAssignedToProject(task.assignee, project))) {
        task.assignee = null;
        await task.save();
      }
    }
  }

  res.json({ data: project });
});

const deleteProject = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'project id');
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (!isAdmin(req.user)) {
    throw new AppError('Only Admin users can delete projects', 403);
  }

  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  res.json({ message: 'Project deleted' });
});

module.exports = { createProject, listProjects, getProject, updateProject, deleteProject };
