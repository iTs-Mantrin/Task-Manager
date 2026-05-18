const User = require('../models/User');
const Team = require('../models/Team');
const Project = require('../models/Project');
const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const ensureObjectId = require('../utils/ensureObjectId');
const { getTeamForUser, isAdmin, teamHasMember, visibleTeamFilter, idEquals, userCanBeAssignedToProject } = require('../utils/access');

function normalizeMembers(members = [], ownerId) {
  const seen = new Set([ownerId.toString()]);
  return members.reduce((result, member) => {
    const userId = member.user.toString();
    if (!seen.has(userId)) {
      seen.add(userId);
      result.push({ user: member.user, role: member.role || 'Member' });
    }
    return result;
  }, []);
}

async function findTeamOrThrow(teamId) {
  const team = await Team.findById(teamId);

  if (!team) {
    throw new AppError('Team not found', 404);
  }

  return team;
}

const createTeam = asyncHandler(async (req, res) => {
  const members = normalizeMembers(req.body.members || [], req.user._id);
  const memberIds = members.map((member) => member.user);
  const existingUsers = await User.countDocuments({ _id: { $in: memberIds } });

  if (existingUsers !== memberIds.length) {
    throw new AppError('One or more team members do not exist', 400);
  }

  const team = await Team.create({
    name: req.body.name,
    description: req.body.description || '',
    owner: req.user._id,
    members,
  });

  res.status(201).json({ data: team });
});

const listTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find(visibleTeamFilter(req.user))
    .populate('owner', 'name email role')
    .populate('members.user', 'name email role')
    .sort({ createdAt: -1 });

  res.json({ data: teams });
});

const getTeam = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'team id');
  const team = await getTeamForUser(req.params.id, req.user);
  await team.populate('owner', 'name email role');
  await team.populate('members.user', 'name email role');
  res.json({ data: team });
});

const updateTeam = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'team id');
  const team = await findTeamOrThrow(req.params.id);

  if (!isAdmin(req.user)) {
    throw new AppError('Only Admin users can update teams', 403);
  }

  if (req.body.name !== undefined) team.name = req.body.name;
  if (req.body.description !== undefined) team.description = req.body.description;

  await team.save();
  res.json({ data: team });
});

const addMember = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'team id');
  const team = await findTeamOrThrow(req.params.id);

  if (!isAdmin(req.user)) {
    throw new AppError('Only Admin users can manage team membership', 403);
  }

  const user = await User.findById(req.body.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (teamHasMember(team, user._id)) {
    throw new AppError('User is already on this team', 409);
  }

  team.members.push({ user: user._id, role: req.body.role || 'Member' });
  await team.save();
  await team.populate('members.user', 'name email role');
  res.status(201).json({ data: team });
});

const updateMember = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'team id');
  const team = await findTeamOrThrow(req.params.id);

  if (!isAdmin(req.user)) {
    throw new AppError('Only Admin users can manage team membership', 403);
  }

  if (idEquals(team.owner, req.params.userId)) {
    throw new AppError('Team owner role cannot be changed through membership updates', 400);
  }

  const member = team.members.find((entry) => idEquals(entry.user, req.params.userId));

  if (!member) {
    throw new AppError('Team member not found', 404);
  }

  member.role = req.body.role;
  await team.save();
  await team.populate('members.user', 'name email role');

  res.json({ data: team });
});

const removeMember = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'team id');
  const team = await findTeamOrThrow(req.params.id);

  if (!isAdmin(req.user)) {
    throw new AppError('Only Admin users can manage team membership', 403);
  }

  if (team.owner.toString() === req.params.userId) {
    throw new AppError('Team owner cannot be removed from the team', 400);
  }

  const before = team.members.length;
  team.members = team.members.filter((member) => member.user.toString() !== req.params.userId);

  if (team.members.length === before) {
    throw new AppError('Team member not found', 404);
  }

  await team.save();

  const affectedProjects = await Project.find({ $or: [{ team: team._id }, { teams: team._id }] }).select('_id members team teams');
  const affectedProjectIds = affectedProjects.map((project) => project._id);

  await Project.updateMany({ _id: { $in: affectedProjectIds } }, { $pull: { members: req.params.userId } });

  const tasks = await Task.find({ project: { $in: affectedProjectIds }, assignee: req.params.userId }).select('_id assignee project');
  const projectsById = new Map(affectedProjects.map((project) => [project._id.toString(), project]));

  for (const task of tasks) {
    const project = projectsById.get(task.project.toString());
    if (project && !(await userCanBeAssignedToProject(req.params.userId, project))) {
      task.assignee = null;
      await task.save();
    }
  }

  res.json({ message: 'Team member removed' });
});

const deleteTeam = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'team id');
  const team = await findTeamOrThrow(req.params.id);

  if (!isAdmin(req.user)) {
    throw new AppError('Only Admin users can delete teams', 403);
  }

  const projects = await Project.find({ $or: [{ team: team._id }, { teams: team._id }] });
  const projectsToDelete = [];
  const retainedProjects = [];

  for (const project of projects) {
    const remainingTeams = (project.teams || []).length
      ? project.teams.filter((projectTeamId) => projectTeamId.toString() !== team._id.toString())
      : project.team && project.team.toString() !== team._id.toString()
        ? [project.team]
        : [];

    if (!remainingTeams.length) {
      projectsToDelete.push(project);
      continue;
    }

    project.teams = remainingTeams;
    project.team = remainingTeams[0] || null;
    retainedProjects.push(project);
  }

  const retainedProjectIds = retainedProjects.map((project) => project._id);
  const deletedProjectIds = projectsToDelete.map((project) => project._id);

  for (const project of retainedProjects) {
    const remainingTeamIds = (project.teams || []).length ? project.teams : (project.team ? [project.team] : []);
    const remainingTeams = await Team.find({ _id: { $in: remainingTeamIds } }).select('owner members');

    project.members = project.members.filter((memberId) => (
      remainingTeams.some((currentTeam) => teamHasMember(currentTeam, memberId))
    ));

    await project.save();
  }

  await Task.deleteMany({ project: { $in: deletedProjectIds } });
  await Project.deleteMany({ _id: { $in: deletedProjectIds } });

  if (retainedProjectIds.length) {
    const retainedTasks = await Task.find({ project: { $in: retainedProjectIds }, assignee: { $ne: null } }).select('_id assignee project');
    const retainedProjectsById = new Map(retainedProjects.map((project) => [project._id.toString(), project]));

    for (const task of retainedTasks) {
      const project = retainedProjectsById.get(task.project.toString());
      if (!project || !(await userCanBeAssignedToProject(task.assignee, project))) {
        task.assignee = null;
      }
      task.team = project?.team || null;
      await task.save();
    }
  }

  await Team.deleteOne({ _id: team._id });

  res.json({ message: 'Team deleted', data: { deletedProjects: deletedProjectIds.length } });
});

module.exports = { createTeam, listTeams, getTeam, updateTeam, addMember, updateMember, removeMember, deleteTeam };
