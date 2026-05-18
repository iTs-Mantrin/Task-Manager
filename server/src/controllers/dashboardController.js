const Project = require('../models/Project');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const { visibleProjectFilter } = require('../utils/access');

function countByStatus(items, statuses) {
  const counts = Object.fromEntries(statuses.map((status) => [status, 0]));
  for (const item of items) {
    counts[item._id] = item.count;
  }
  return counts;
}

const getSummary = asyncHandler(async (req, res) => {
  const projectFilter = await visibleProjectFilter(req.user);
  const visibleProjects = await Project.find(projectFilter).select('_id');
  const projectIds = visibleProjects.map((project) => project._id);
  const now = new Date();

  const [taskStatusCounts, projectStatusCounts, overdueTasks, assignedToMe, totalTasks] = await Promise.all([
    Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Project.aggregate([
      { $match: { _id: { $in: projectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.countDocuments({ project: { $in: projectIds }, status: { $ne: 'Done' }, dueDate: { $lt: now } }),
    Task.countDocuments({ project: { $in: projectIds }, assignee: req.user._id }),
    Task.countDocuments({ project: { $in: projectIds } }),
  ]);

  res.json({
    data: {
      projects: {
        total: projectIds.length,
        byStatus: countByStatus(projectStatusCounts, ['Planning', 'Active', 'On Hold', 'Completed', 'Archived']),
      },
      tasks: {
        total: totalTasks,
        byStatus: countByStatus(taskStatusCounts, ['Todo', 'In Progress', 'Review', 'Done']),
        overdue: overdueTasks,
        assignedToMe,
      },
    },
  });
});

module.exports = { getSummary };
