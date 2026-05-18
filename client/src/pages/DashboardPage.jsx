import { useCallback, useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { dashboardApi, getApiError, taskApi } from '../lib/api';
import { formatDate, isPastDue } from '../utils/format';

function getOverdueTasks(tasks = []) {
  return tasks.filter((task) => task.isOverdue || isPastDue(task.dueDate)).slice(0, 5);
}

function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    try {
      const [summaryResponse, tasksResponse] = await Promise.all([
        dashboardApi.summary(),
        taskApi.list(),
      ]);
      setSummary(summaryResponse.data.data);
      setTasks(getOverdueTasks(tasksResponse.data.data || []));
    } catch (loadError) {
      setError(getApiError(loadError, 'Unable to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return <div className="page-state">Loading dashboard…</div>;
  }

  if (error) {
    return <div className="page-state error">{error}</div>;
  }

  const projectStatuses = Object.entries(summary?.projects?.byStatus || {});
  const taskStatuses = Object.entries(summary?.tasks?.byStatus || {});

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Dashboard</h2>
          <p>Keep track of delivery status, workload, and overdue tasks.</p>
        </div>
      </section>

      <section className="stats-grid dashboard-stats-grid">
        <StatCard label="Total tasks" value={summary?.tasks?.total ?? 0} />
        <StatCard label="Assigned to me" value={summary?.tasks?.assignedToMe ?? 0} tone="accent" />
        <StatCard label="Overdue" value={summary?.tasks?.overdue ?? 0} tone="danger" />
        <StatCard label="Projects" value={summary?.projects?.total ?? 0} />
      </section>

      <section className="content-grid two-column dashboard-panels-grid">
        <article className="card">
          <div className="section-title-row">
            <h3>Task status mix</h3>
          </div>
          <div className="stack-list">
            {taskStatuses.map(([status, count]) => (
              <div key={status} className="stack-row split-row">
                <StatusBadge value={status} kind="status" />
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="section-title-row">
            <h3>Project status mix</h3>
          </div>
          <div className="stack-list">
            {projectStatuses.map(([status, count]) => (
              <div key={status} className="stack-row split-row">
                <StatusBadge value={status} kind="project-status" />
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card">
        <div className="section-title-row">
          <h3>Overdue work</h3>
          <span>{tasks.length} visible task(s)</span>
        </div>

        {tasks.length ? (
          <div className="table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id}>
                    <td data-label="Task">{task.title}</td>
                    <td data-label="Project">{task.project?.name || '—'}</td>
                    <td data-label="Status"><StatusBadge value={task.status} kind="status" /></td>
                    <td data-label="Due">{formatDate(task.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No overdue tasks right now.</div>
        )}
      </section>
    </div>
  );
}

export default DashboardPage;
