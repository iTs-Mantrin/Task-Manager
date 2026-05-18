require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');

const mongoose = require('mongoose');

const connectDB = require('../config/db');
const User = require('../models/User');
const Team = require('../models/Team');
const Project = require('../models/Project');
const Task = require('../models/Task');

const OUTPUT_PATH = path.resolve(__dirname, '../../seed-output.json');

const usersSeed = [
  { name: 'Aarav Mehta', email: 'aarav.mehta@northstar.dev', password: 'NorthstarAdmin1!', role: 'Admin' },
  { name: 'Priya Nair', email: 'priya.nair@northstar.dev', password: 'NorthstarAdmin2!', role: 'Admin' },
  { name: 'Rohan Kapoor', email: 'rohan.kapoor@northstar.dev', password: 'NorthstarMember1!', role: 'Member' },
  { name: 'Neha Sharma', email: 'neha.sharma@northstar.dev', password: 'NorthstarMember2!', role: 'Member' },
  { name: 'Kabir Verma', email: 'kabir.verma@northstar.dev', password: 'NorthstarMember3!', role: 'Member' },
  { name: 'Isha Menon', email: 'isha.menon@northstar.dev', password: 'NorthstarMember4!', role: 'Member' },
  { name: 'Arjun Bhat', email: 'arjun.bhat@northstar.dev', password: 'NorthstarMember5!', role: 'Member' },
  { name: 'Sneha Kulkarni', email: 'sneha.kulkarni@northstar.dev', password: 'NorthstarMember6!', role: 'Member' },
  { name: 'Dev Malhotra', email: 'dev.malhotra@northstar.dev', password: 'NorthstarMember7!', role: 'Member' },
  { name: 'Maya Iyer', email: 'maya.iyer@northstar.dev', password: 'NorthstarMember8!', role: 'Member' },
  { name: 'Karan Joshi', email: 'karan.joshi@northstar.dev', password: 'NorthstarMember9!', role: 'Member' },
  { name: 'Ananya Rao', email: 'ananya.rao@northstar.dev', password: 'NorthstarMember10!', role: 'Member' },
  { name: 'Rahul Desai', email: 'rahul.desai@northstar.dev', password: 'NorthstarMember11!', role: 'Member' },
  { name: 'Zoya Khan', email: 'zoya.khan@northstar.dev', password: 'NorthstarMember12!', role: 'Member' },
  { name: 'Vikram Singh', email: 'vikram.singh@northstar.dev', password: 'NorthstarMember13!', role: 'Member' },
  { name: 'Aditi Chawla', email: 'aditi.chawla@northstar.dev', password: 'NorthstarMember14!', role: 'Member' },
  { name: 'Siddharth Jain', email: 'siddharth.jain@northstar.dev', password: 'NorthstarMember15!', role: 'Member' },
  { name: 'Pooja Reddy', email: 'pooja.reddy@northstar.dev', password: 'NorthstarMember16!', role: 'Member' },
  { name: 'Nikhil Patil', email: 'nikhil.patil@northstar.dev', password: 'NorthstarMember17!', role: 'Member' },
  { name: 'Meera Thomas', email: 'meera.thomas@northstar.dev', password: 'NorthstarMember18!', role: 'Member' },
];

const teamDefinitions = [
  {
    name: 'Platform Engineering',
    description: 'Builds shared backend foundations, service templates, and deployment guardrails for product squads.',
    ownerEmail: 'aarav.mehta@northstar.dev',
    memberEmails: ['rohan.kapoor@northstar.dev', 'kabir.verma@northstar.dev', 'rahul.desai@northstar.dev'],
  },
  {
    name: 'Frontend Experience',
    description: 'Owns React architecture, design system adoption, and customer-facing dashboard performance.',
    ownerEmail: 'priya.nair@northstar.dev',
    memberEmails: ['neha.sharma@northstar.dev', 'maya.iyer@northstar.dev', 'aditi.chawla@northstar.dev'],
  },
  {
    name: 'Identity and Access',
    description: 'Delivers authentication, authorization, session hardening, and enterprise access controls.',
    ownerEmail: 'aarav.mehta@northstar.dev',
    memberEmails: ['isha.menon@northstar.dev', 'zoya.khan@northstar.dev', 'meera.thomas@northstar.dev'],
  },
  {
    name: 'Developer Experience',
    description: 'Improves local tooling, CI reliability, code generation, and onboarding workflows for engineers.',
    ownerEmail: 'priya.nair@northstar.dev',
    memberEmails: ['dev.malhotra@northstar.dev', 'nikhil.patil@northstar.dev', 'siddharth.jain@northstar.dev'],
  },
  {
    name: 'Data Services',
    description: 'Manages event pipelines, reporting APIs, analytics readiness, and data contract quality.',
    ownerEmail: 'aarav.mehta@northstar.dev',
    memberEmails: ['karan.joshi@northstar.dev', 'pooja.reddy@northstar.dev', 'vikram.singh@northstar.dev'],
  },
  {
    name: 'Quality Engineering',
    description: 'Drives regression automation, release quality gates, and production verification coverage.',
    ownerEmail: 'priya.nair@northstar.dev',
    memberEmails: ['sneha.kulkarni@northstar.dev', 'arjun.bhat@northstar.dev', 'meera.thomas@northstar.dev'],
  },
  {
    name: 'Mobile Platform',
    description: 'Maintains shared mobile SDKs, notification plumbing, and app runtime integration patterns.',
    ownerEmail: 'aarav.mehta@northstar.dev',
    memberEmails: ['ananya.rao@northstar.dev', 'vikram.singh@northstar.dev', 'neha.sharma@northstar.dev'],
  },
  {
    name: 'Cloud Reliability',
    description: 'Owns uptime engineering, observability baselines, disaster recovery playbooks, and SLO tracking.',
    ownerEmail: 'priya.nair@northstar.dev',
    memberEmails: ['rahul.desai@northstar.dev', 'dev.malhotra@northstar.dev', 'nikhil.patil@northstar.dev'],
  },
  {
    name: 'Checkout Systems',
    description: 'Builds payment flows, order orchestration, and billing support tooling for transaction-heavy products.',
    ownerEmail: 'aarav.mehta@northstar.dev',
    memberEmails: ['kabir.verma@northstar.dev', 'pooja.reddy@northstar.dev', 'maya.iyer@northstar.dev'],
  },
  {
    name: 'AI Tools',
    description: 'Experiments with productivity copilots, retrieval systems, and internal automation workflows.',
    ownerEmail: 'priya.nair@northstar.dev',
    memberEmails: ['zoya.khan@northstar.dev', 'siddharth.jain@northstar.dev', 'arjun.bhat@northstar.dev'],
  },
];

const projectDefinitions = [
  {
    name: 'API Gateway Modernization',
    description: 'Replace legacy edge routing with versioned gateway policies, centralized auth, and better request telemetry.',
    status: 'Active',
    teamName: 'Platform Engineering',
    memberEmails: ['rohan.kapoor@northstar.dev', 'kabir.verma@northstar.dev', 'rahul.desai@northstar.dev'],
    startDate: new Date('2026-01-05T00:00:00.000Z'),
    dueDate: new Date('2026-04-30T00:00:00.000Z'),
    createdByEmail: 'aarav.mehta@northstar.dev',
  },
  {
    name: 'Customer Operations Dashboard',
    description: 'Ship a responsive admin console for support teams with workflow insights, SLA alerts, and safer bulk actions.',
    status: 'Active',
    teamName: 'Frontend Experience',
    memberEmails: ['neha.sharma@northstar.dev', 'maya.iyer@northstar.dev', 'aditi.chawla@northstar.dev'],
    startDate: new Date('2026-01-12T00:00:00.000Z'),
    dueDate: new Date('2026-05-15T00:00:00.000Z'),
    createdByEmail: 'priya.nair@northstar.dev',
  },
  {
    name: 'Feature Flag Control Plane',
    description: 'Launch a secure internal service for staged rollouts, kill switches, audit trails, and environment targeting.',
    status: 'Planning',
    teamName: 'Developer Experience',
    memberEmails: ['dev.malhotra@northstar.dev', 'nikhil.patil@northstar.dev', 'siddharth.jain@northstar.dev'],
    startDate: new Date('2026-02-01T00:00:00.000Z'),
    dueDate: new Date('2026-06-20T00:00:00.000Z'),
    createdByEmail: 'priya.nair@northstar.dev',
  },
  {
    name: 'Identity Session Hardening',
    description: 'Tighten refresh token rotation, device visibility, and suspicious-session response flows for enterprise tenants.',
    status: 'On Hold',
    teamName: 'Identity and Access',
    memberEmails: ['isha.menon@northstar.dev', 'zoya.khan@northstar.dev', 'meera.thomas@northstar.dev'],
    startDate: new Date('2026-01-20T00:00:00.000Z'),
    dueDate: new Date('2026-05-30T00:00:00.000Z'),
    createdByEmail: 'aarav.mehta@northstar.dev',
  },
  {
    name: 'Release Pipeline Reliability',
    description: 'Reduce flaky deployments by standardizing preview environments, rollback automation, and release health checks.',
    status: 'Completed',
    teamName: 'Cloud Reliability',
    memberEmails: ['rahul.desai@northstar.dev', 'dev.malhotra@northstar.dev', 'nikhil.patil@northstar.dev'],
    startDate: new Date('2025-11-10T00:00:00.000Z'),
    dueDate: new Date('2026-02-28T00:00:00.000Z'),
    createdByEmail: 'priya.nair@northstar.dev',
  },
];

const taskTemplates = [
  'Define success metrics for {project}',
  'Draft technical design for {project}',
  'Implement backend endpoint for {project}',
  'Add request validation rules for {project}',
  'Build React workflow for {project}',
  'Refactor data fetching for {project}',
  'Add audit logging to {project}',
  'Set up dashboards and alerts for {project}',
  'Write integration tests for {project}',
  'Fix QA issues reported for {project}',
  'Document rollout steps for {project}',
  'Review API contract changes for {project}',
  'Optimize database query path for {project}',
  'Implement access control checks for {project}',
  'Prepare release checklist for {project}',
  'Add pagination and filtering to {project}',
  'Instrument latency tracking for {project}',
  'Clean up legacy code path blocked by {project}',
  'Validate mobile compatibility for {project}',
  'Run post-release verification for {project}',
];

const taskDescriptions = [
  'Coordinate with design and product, then deliver the production-ready implementation with tests and rollout notes.',
  'Handle edge cases, update documentation, and make sure the change fits existing service conventions.',
  'Ship the smallest correct change, keep observability intact, and include follow-up notes for QA.',
  'Cover the happy path plus failure cases so the team can safely roll this out in the next sprint.',
  'Work across API and UI boundaries where needed, but avoid unrelated cleanup while making the feature reliable.',
];

const taskStatuses = ['Todo', 'In Progress', 'Review', 'Done'];
const taskPriorities = ['Low', 'Medium', 'High', 'Urgent'];

function byEmail(createdUsers) {
  return new Map(createdUsers.map((user) => [user.email, user]));
}

function byName(records) {
  return new Map(records.map((record) => [record.name, record]));
}

function pickFrom(list, index) {
  return list[index % list.length];
}

async function seed() {
  await connectDB();
  await mongoose.connection.db.dropDatabase();

  const createdUsers = [];
  for (const user of usersSeed) {
    createdUsers.push(await User.create(user));
  }

  const usersByEmail = byEmail(createdUsers);
  const teams = [];

  for (const definition of teamDefinitions) {
    const owner = usersByEmail.get(definition.ownerEmail);
    const members = [
      { user: owner._id, role: 'Admin' },
      ...definition.memberEmails.map((email) => ({ user: usersByEmail.get(email)._id, role: 'Member' })),
    ];

    teams.push(await Team.create({
      name: definition.name,
      description: definition.description,
      owner: owner._id,
      members,
    }));
  }

  const teamsByName = byName(teams);
  const projects = [];

  for (const definition of projectDefinitions) {
    const team = teamsByName.get(definition.teamName);
    const createdBy = usersByEmail.get(definition.createdByEmail);
    const memberIds = [team.owner, ...definition.memberEmails.map((email) => usersByEmail.get(email)._id)];

    projects.push(await Project.create({
      name: definition.name,
      description: definition.description,
      status: definition.status,
      team: team._id,
      teams: [team._id],
      members: memberIds,
      startDate: definition.startDate,
      dueDate: definition.dueDate,
      createdBy: createdBy._id,
    }));
  }

  const tasks = [];

  for (let index = 0; index < 100; index += 1) {
    const project = projects[index % projects.length];
    const team = teams.find((candidate) => String(candidate._id) === String(project.team || project.teams?.[0]));
    const status = pickFrom(taskStatuses, index);
    const priority = pickFrom(taskPriorities, index + 1);
    const title = taskTemplates[index % taskTemplates.length].replace('{project}', project.name);
    const description = `${pickFrom(taskDescriptions, index)} Team: ${team.name}.`; 
    const assigneePool = project.members;
    const assignee = index % 6 === 0 ? null : assigneePool[index % assigneePool.length];
    const dueDate = new Date(project.dueDate);
    dueDate.setDate(project.dueDate.getDate() - (index % 21) + 10);

    tasks.push({
      title,
      description,
      status,
      priority,
      project: project._id,
      team: team._id,
      assignee,
      createdBy: project.createdBy,
      dueDate,
      completedAt: status === 'Done' ? new Date(dueDate) : null,
    });
  }

  await Task.insertMany(tasks);

  const output = {
    createdAt: new Date().toISOString(),
    note: 'All names and credentials are realistic fictional demo data for software engineering scenarios.',
    counts: {
      users: createdUsers.length,
      teams: teams.length,
      projects: projects.length,
      tasks: tasks.length,
    },
    admins: usersSeed.filter((user) => user.role === 'Admin').map(({ name, email, password }) => ({ name, email, password })),
    sampleTeams: teamDefinitions.map(({ name, description }) => ({ name, description })),
    sampleProjects: projectDefinitions.map(({ name, description, teamName }) => ({ name, description, teamName })),
    credentials: usersSeed.map(({ name, email, password, role }) => ({ name, email, password, role })),
  };

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    message: 'Database reset and realistic demo data created successfully.',
    counts: output.counts,
    outputFile: OUTPUT_PATH,
  }, null, 2));
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
