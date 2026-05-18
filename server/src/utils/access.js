const Team = require('../models/Team');
const Project = require('../models/Project');
const AppError = require('./AppError');

function isAdmin(user) {
  return user && user.role === 'Admin';
}

function idEquals(left, right) {
  return left && right && left.toString() === right.toString();
}

function toIdString(value) {
  return (value._id || value).toString();
}

function teamHasMember(team, userId) {
  return idEquals(team.owner, userId) || team.members.some((member) => idEquals(member.user, userId));
}

async function getTeamForUser(teamId, user) {
  const team = await Team.findById(teamId);
  if (!team) {
    throw new AppError('Team not found', 404);
  }

  if (!isAdmin(user) && !teamHasMember(team, user._id)) {
    throw new AppError('You do not have access to this team', 403);
  }

  return team;
}

function projectHasMember(project, userId) {
  return project.members.some((memberId) => idEquals(memberId, userId));
}

function getProjectTeamIds(project) {
  const projectTeams = Array.isArray(project.teams) && project.teams.length
    ? project.teams
    : project.team
      ? [project.team]
      : [];

  return [...new Set(projectTeams.filter(Boolean).map(toIdString))];
}

async function getProjectForUser(projectId, user) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (isAdmin(user) || projectHasMember(project, user._id)) {
    return project;
  }

  const teams = await Team.find({ _id: { $in: getProjectTeamIds(project) } });
  if (teams.some((team) => teamHasMember(team, user._id))) {
    return project;
  }

  throw new AppError('You do not have access to this project', 403);
}

function visibleTeamFilter(user) {
  if (isAdmin(user)) {
    return {};
  }

  return {
    $or: [
      { owner: user._id },
      { 'members.user': user._id },
    ],
  };
}

async function visibleProjectFilter(user) {
  if (isAdmin(user)) {
    return {};
  }

  const teams = await Team.find(visibleTeamFilter(user)).select('_id');
  const visibleTeamIds = teams.map((team) => team._id);

  return {
    $or: [
      { team: { $in: visibleTeamIds } },
      { teams: { $in: visibleTeamIds } },
      { members: user._id },
    ],
  };
}

async function userCanBeAssignedToProject(userId, project) {
  if (projectHasMember(project, userId)) {
    return true;
  }

  const teams = await Team.find({ _id: { $in: getProjectTeamIds(project) } });
  return teams.some((team) => teamHasMember(team, userId));
}

module.exports = {
  isAdmin,
  idEquals,
  teamHasMember,
  getTeamForUser,
  getProjectForUser,
  getProjectTeamIds,
  visibleTeamFilter,
  visibleProjectFilter,
  userCanBeAssignedToProject,
};
