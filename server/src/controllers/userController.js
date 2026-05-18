const User = require('../models/User');
const Team = require('../models/Team');
const Project = require('../models/Project');
const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const ensureObjectId = require('../utils/ensureObjectId');
const { idEquals } = require('../utils/access');

function userPayload(user) {
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const listUsers = asyncHandler(async (req, res) => {
  const [users, teams, projects] = await Promise.all([
    User.find().sort({ createdAt: -1 }).lean(),
    Team.find().select('name owner members').lean(),
    Project.find().select('name status team teams members').populate('team', 'name').populate('teams', 'name').lean(),
  ]);

  const data = users.map((user) => {
    const relatedTeams = teams.reduce((result, team) => {
      if (idEquals(team.owner, user._id)) {
        result.push({ _id: team._id, name: team.name, role: 'Owner' });
        return result;
      }

      const membership = (team.members || []).find((member) => idEquals(member.user, user._id));
      if (membership) {
        result.push({ _id: team._id, name: team.name, role: membership.role || 'Member' });
      }

      return result;
    }, []);

    const relatedProjects = projects.reduce((result, project) => {
      const projectTeams = (project.teams || []).length ? project.teams : (project.team ? [project.team] : []);
      const onTeam = relatedTeams.some((team) => projectTeams.some((projectTeam) => idEquals(team._id, projectTeam?._id || projectTeam)));
      const directMember = (project.members || []).some((memberId) => idEquals(memberId, user._id));

      if (onTeam || directMember) {
        result.push({
          _id: project._id,
          name: project.name,
          status: project.status,
          teamName: projectTeams.map((team) => team?.name || '—').join(', ') || '—',
          role: directMember ? 'Project Member' : 'Team Access',
        });
      }

      return result;
    }, []);

    return {
      ...userPayload(user),
      teams: relatedTeams,
      projects: relatedProjects,
    };
  });

  res.json({ data });
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError('Email already exists', 409);
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'Member',
  });

  res.status(201).json({ data: userPayload(user) });
});

const updateUser = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'user id');
  const user = await User.findById(req.params.id).select('+password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (req.body.email && req.body.email !== user.email) {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser && !idEquals(existingUser._id, user._id)) {
      throw new AppError('Email already exists', 409);
    }
  }

  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.email !== undefined) user.email = req.body.email;
  if (req.body.role !== undefined) user.role = req.body.role;
  if (req.body.password) user.password = req.body.password;

  await user.save();
  res.json({ data: userPayload(user) });
});

const deleteUser = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'user id');

  if (idEquals(req.params.id, req.user._id)) {
    throw new AppError('You cannot delete your own account', 400);
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await Promise.all([
    Team.updateMany({ owner: user._id }, { $set: { owner: req.user._id } }),
    Team.updateMany({}, { $pull: { members: { user: user._id } } }),
    Project.updateMany({ createdBy: user._id }, { $set: { createdBy: req.user._id } }),
    Project.updateMany({}, { $pull: { members: user._id } }),
    Task.updateMany({ createdBy: user._id }, { $set: { createdBy: req.user._id } }),
    Task.updateMany({ assignee: user._id }, { $set: { assignee: null } }),
  ]);

  await user.deleteOne();

  res.json({ message: 'User deleted' });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (req.body.email && req.body.email !== user.email) {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser && !idEquals(existingUser._id, user._id)) {
      throw new AppError('Email already exists', 409);
    }
  }

  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.email !== undefined) user.email = req.body.email;

  await user.save();
  res.json({ data: userPayload(user) });
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isValidPassword = await user.comparePassword(req.body.currentPassword);
  if (!isValidPassword) {
    throw new AppError('Current password is incorrect', 401);
  }

  user.password = req.body.newPassword;
  await user.save();

  res.json({ message: 'Password updated successfully' });
});

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword,
};
