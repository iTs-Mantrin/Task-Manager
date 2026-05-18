import { useEffect, useMemo, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { getApiError, projectApi, taskApi, teamApi } from '../lib/api';
import { formatDate, isPastDue } from '../utils/format';

const initialForm = {
  title: '',
  description: '',
  project: '',
  assignee: '',
  status: 'Todo',
  priority: 'Medium',
  dueDate: '',
};

function toDateInputValue(value) {
  return value ? value.slice(0, 10) : '';
}

function formatCompactDateTime(value) {
  if (!value) {
    return 'No timestamp';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function getProjectTeams(project) {
  return project?.teams?.length ? project.teams : (project?.team ? [project.team] : []);
}

function getTeamPeople(team) {
  const members = team.members?.map((entry) => entry.user).filter(Boolean) || [];
  return team.owner ? [team.owner, ...members] : members;
}

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingTaskId, setEditingTaskId] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedProject = useMemo(
    () => projects.find((project) => project._id === form.project),
    [form.project, projects],
  );

  const selectedTeams = useMemo(
    () => teams.filter((team) => getProjectTeams(selectedProject).some((projectTeam) => (projectTeam._id || projectTeam) === team._id)),
    [selectedProject, teams],
  );

  const assignees = useMemo(() => {
    if (!selectedProject) {
      return [];
    }

    const directMembers = selectedProject.members || [];
    const teamMembers = selectedTeams.flatMap(getTeamPeople);

    return [...directMembers, ...teamMembers].filter(
      (entry, index, list) => entry && list.findIndex((candidate) => candidate._id === entry._id) === index,
    );
  }, [selectedProject, selectedTeams]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [tasksResponse, projectsResponse, teamsResponse] = await Promise.all([
        taskApi.list(),
        projectApi.list(),
        teamApi.list(),
      ]);
      setTasks(tasksResponse.data.data || []);
      setProjects(projectsResponse.data.data || []);
      setTeams(teamsResponse.data.data || []);
    } catch (loadError) {
      setError(getApiError(loadError, 'Unable to load tasks'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingTaskId('');
    setForm(initialForm);
    setShowTaskForm(true);
    setError('');
    setSuccess('');
  };

  const handleOpenEdit = (task) => {
    setEditingTaskId(task._id);
    setForm({
      title: task.title || '',
      description: task.description || '',
      project: task.project?._id || '',
      assignee: task.assignee?._id || '',
      status: task.status || 'Todo',
      priority: task.priority || 'Medium',
      dueDate: toDateInputValue(task.dueDate),
    });
    setShowTaskForm(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
        assignee: form.assignee || null,
        dueDate: form.dueDate || null,
      };

      if (editingTaskId) {
        await taskApi.update(editingTaskId, payload);
        setSuccess('Task updated successfully.');
      } else {
        await taskApi.create(payload);
        setSuccess('Task created successfully.');
      }

      setForm(initialForm);
      setEditingTaskId('');
      setShowTaskForm(false);
      await loadData();
    } catch (saveError) {
      setError(getApiError(saveError, editingTaskId ? 'Unable to update task' : 'Unable to create task'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await taskApi.update(taskId, { status });
      setSuccess('Task status updated successfully.');
      await loadData();
    } catch (saveError) {
      setError(getApiError(saveError, 'Unable to update task status'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await taskApi.remove(taskId);
      setSuccess('Task deleted successfully.');
      await loadData();
    } catch (saveError) {
      setError(getApiError(saveError, 'Unable to delete task'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setEditingTaskId('');
    setShowTaskForm(false);
    setError('');
  };

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Execution</p>
          <h2>Tasks</h2>
          <p>Create, assign, update, and complete visible work across your projects.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="primary-button" onClick={handleOpenCreate}>
            Add task
          </button>
        </div>
      </section>

      {error ? <div className="page-state error compact-state">{error}</div> : null}
      {success ? <div className="success-state">{success}</div> : null}

      <section className="card">
        <div className="section-title-row">
          <h3>Task board</h3>
          <span>{tasks.length} task(s)</span>
        </div>

        {loading ? (
          <div className="empty-state">Loading tasks…</div>
        ) : tasks.length ? (
          <div className="table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id}>
                    <td data-label="Task">
                      <strong>{task.title}</strong>
                      <div className="table-subcopy table-description">{task.description || 'No description'}</div>
                      <div className="table-subcopy table-meta-row">
                        <span>By {task.createdBy?.name || 'Unknown'}</span>
                        <span>{formatCompactDateTime(task.createdAt)}</span>
                      </div>
                    </td>
                    <td data-label="Project">{task.project?.name || '—'}</td>
                    <td data-label="Assignee">{task.assignee?.name || 'Unassigned'}</td>
                    <td data-label="Status">
                      <select
                        value={task.status}
                        onChange={(event) => handleStatusChange(task._id, event.target.value)}
                        disabled={saving}
                      >
                        <option value="Todo">Todo</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Review">Review</option>
                        <option value="Done">Done</option>
                      </select>
                    </td>
                    <td data-label="Priority"><StatusBadge value={task.priority} kind="priority" /></td>
                    <td data-label="Due">
                      <span className={isPastDue(task.dueDate) && task.status !== 'Done' ? 'text-danger' : ''}>
                        {formatDate(task.dueDate)}
                      </span>
                    </td>
                      <td data-label="Actions">
                       <div className="table-actions">
                         <button
                           type="button"
                           className="ghost-button icon-button"
                           onClick={() => handleOpenEdit(task)}
                           disabled={saving}
                           aria-label={`Edit ${task.title}`}
                           title="Edit"
                         >
                           <span aria-hidden="true">✎</span>
                         </button>
                         <button
                           type="button"
                           className="ghost-button danger icon-button"
                           onClick={() => handleDeleteTask(task._id)}
                           disabled={saving}
                           aria-label={`Delete ${task.title}`}
                           title="Delete"
                         >
                           <span aria-hidden="true">🗑</span>
                         </button>
                       </div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No tasks available yet.</div>
        )}
      </section>

      {showTaskForm ? (
        <div className="modal-overlay" role="presentation" onClick={handleCancel}>
          <section className="card modal-window wide-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title" onClick={(event) => event.stopPropagation()}>
            <div className="section-title-row">
              <div>
                <h3 id="task-modal-title">{editingTaskId ? 'Update task' : 'Create a task'}</h3>
                <span>Visible project access required</span>
              </div>
            </div>

            <form className="form-grid form-grid-wide compact-form" onSubmit={handleSubmit}>
              <label>
                Title
                <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
              </label>
              <label>
                Project
                <select
                  value={form.project}
                  onChange={(event) => setForm((current) => ({ ...current, project: event.target.value, assignee: '' }))}
                  required
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>{project.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Assignee
                <select value={form.assignee} onChange={(event) => setForm((current) => ({ ...current, assignee: event.target.value }))}>
                  <option value="">Unassigned</option>
                  {assignees.map((member) => (
                    <option key={member._id} value={member._id}>{member.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Done">Done</option>
                </select>
              </label>
              <label>
                Priority
                <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </label>
              <label>
                Due date
                <input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
              </label>
              <label>
                Description
                <textarea rows="4" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={handleCancel}>Cancel</button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? 'Saving…' : editingTaskId ? 'Update task' : 'Create task'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default TasksPage;
