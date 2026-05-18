import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { getApiError, projectApi, teamApi } from '../lib/api';
import { formatDate } from '../utils/format';

const initialForm = {
  name: '',
  description: '',
  teams: [],
  status: 'Planning',
  startDate: '',
  dueDate: '',
  members: [],
};

function getProjectTeams(project) {
  return project?.teams?.length ? project.teams : (project?.team ? [project.team] : []);
}

function getMemberIds(teams) {
  return getUniqueMembers(teams).map((member) => member._id);
}

function getUniqueMembers(selectedTeams) {
  return selectedTeams.flatMap((team) => {
    const directMembers = team.members?.map((entry) => ({ ...entry.user, teamRole: entry.role })).filter(Boolean) || [];
    const owner = team.owner ? [{ ...team.owner, teamRole: 'Owner' }] : [];
    return [...owner, ...directMembers];
  }).filter(
    (entry, index, list) => entry && list.findIndex((candidate) => candidate._id === entry._id) === index,
  );
}

function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingProjectId, setEditingProjectId] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedTeams = useMemo(
    () => teams.filter((team) => form.teams.includes(team._id)),
    [form.teams, teams],
  );

  const availableMembers = useMemo(() => {
    if (!selectedTeams.length) {
      return [];
    }

    return getUniqueMembers(selectedTeams);
  }, [selectedTeams]);

  const handleTeamSelectionChange = (teamIds) => {
    setForm((current) => {
      const nextMembers = getMemberIds(teams.filter((team) => teamIds.includes(team._id)));

      return {
        ...current,
        teams: teamIds,
        members: current.members.filter((memberId) => nextMembers.includes(memberId)),
      };
    });
  };

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [projectsResponse, teamsResponse] = await Promise.all([projectApi.list(), teamApi.list()]);
      setProjects(projectsResponse.data.data || []);
      setTeams(teamsResponse.data.data || []);
    } catch (loadError) {
      setError(getApiError(loadError, 'Unable to load projects'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingProjectId('');
    setForm(initialForm);
    setShowCreateForm(true);
    setError('');
    setSuccess('');
  };

  const handleOpenEdit = (project) => {
    setEditingProjectId(project._id);
    setForm({
      name: project.name || '',
      description: project.description || '',
      teams: getProjectTeams(project).map((team) => team._id || team),
      status: project.status || 'Planning',
      startDate: project.startDate ? project.startDate.slice(0, 10) : '',
      dueDate: project.dueDate ? project.dueDate.slice(0, 10) : '',
      members: (project.members || []).map((member) => member._id),
    });
    setShowCreateForm(true);
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
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
      };

      if (editingProjectId) {
        await projectApi.update(editingProjectId, payload);
        setSuccess('Project updated successfully.');
      } else {
        await projectApi.create(payload);
        setSuccess('Project created successfully.');
      }

      setForm(initialForm);
      setEditingProjectId('');
      setShowCreateForm(false);
      await loadData();
    } catch (saveError) {
      setError(getApiError(saveError, editingProjectId ? 'Unable to update project' : 'Unable to create project'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete project "${project.name}"? This also deletes its tasks.`)) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await projectApi.remove(project._id);
      setSuccess('Project deleted successfully.');
      await loadData();
    } catch (deleteError) {
      setError(getApiError(deleteError, 'Unable to delete project'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setEditingProjectId('');
    setShowCreateForm(false);
  };

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Delivery planning</p>
          <h2>Projects</h2>
          <p>Connect every project to a team, a timeline, and the right set of members.</p>
        </div>
        {isAdmin ? (
          <div className="page-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => (showCreateForm ? handleCancel() : handleOpenCreate())}
            >
              {showCreateForm ? 'Close' : 'Add project'}
            </button>
          </div>
        ) : null}
      </section>

      {error ? <div className="page-state error">{error}</div> : null}
      {success ? <div className="success-state">{success}</div> : null}

      <section className="card">
        <div className="section-title-row">
          <h3>Visible projects</h3>
          <span>{projects.length} project(s)</span>
        </div>

        {loading ? (
          <div className="empty-state">Loading projects…</div>
        ) : projects.length ? (
          <div className="table-wrap">
            <table className="resource-table responsive-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Teams</th>
                  <th>Due date</th>
                  <th>Members</th>
                  {isAdmin ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project._id}>
                    <td data-label="Project">
                      <Link to={`/projects/${project._id}`} className="table-link">
                        <strong>{project.name}</strong>
                      </Link>
                      <div className="table-subcopy table-description">{project.description || 'No description provided.'}</div>
                    </td>
                    <td data-label="Status">
                      <StatusBadge value={project.status} kind="project-status" />
                    </td>
                    <td data-label="Teams">{getProjectTeams(project).map((team) => team.name).join(', ') || '—'}</td>
                    <td data-label="Due date">{formatDate(project.dueDate)}</td>
                    <td data-label="Members">{project.members?.length || 0}</td>
                    {isAdmin ? (
                      <td data-label="Actions">
                        <div className="table-actions">
                          <Link
                            to={`/projects/${project._id}`}
                            className="ghost-button icon-button"
                            aria-label={`View ${project.name}`}
                            title="View"
                          >
                            <span aria-hidden="true">👁</span>
                          </Link>
                          <button
                            type="button"
                            className="ghost-button icon-button"
                            onClick={() => handleOpenEdit(project)}
                            disabled={saving}
                            aria-label={`Edit ${project.name}`}
                            title="Edit"
                          >
                            <span aria-hidden="true">✎</span>
                          </button>
                          <button
                            type="button"
                            className="ghost-button danger icon-button"
                            onClick={() => handleDelete(project)}
                            disabled={saving}
                            aria-label={`Delete ${project.name}`}
                            title="Delete"
                          >
                            <span aria-hidden="true">🗑</span>
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No projects available yet.</div>
        )}
      </section>

      {isAdmin && showCreateForm ? (
        <div className="modal-overlay" role="presentation" onClick={handleCancel}>
          <section className="card modal-window wide-modal" role="dialog" aria-modal="true" aria-labelledby="create-project-title" onClick={(event) => event.stopPropagation()}>
            <div className="section-title-row">
              <div>
                <h3 id="create-project-title">{editingProjectId ? 'Update project' : 'Create a project'}</h3>
                <span>Admin only</span>
              </div>
            </div>

            <form className="form-grid form-grid-wide compact-form" onSubmit={handleSubmit}>
              <label>
                Project name
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
              </label>
              <div className="form-span-full">
                Teams
                <select
                  multiple
                  className="multi-select"
                  value={form.teams}
                  onChange={(event) => handleTeamSelectionChange(Array.from(event.target.selectedOptions, (option) => option.value))}
                >
                  {teams.map((team) => (
                    <option key={team._id} value={team._id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <div className="table-subcopy">Hold Ctrl (or Cmd on Mac) to select multiple teams.</div>
              </div>
              <div className="form-span-full">
                <label>Initial members</label>
                {availableMembers.length ? (
                  <div className="checkbox-grid checkbox-grid-stacked">
                    {availableMembers.map((member) => (
                      <label key={member._id} className="checkbox-card">
                        <input
                          type="checkbox"
                          checked={form.members.includes(member._id)}
                          onChange={(event) => {
                            setForm((current) => ({
                              ...current,
                              members: event.target.checked
                                ? [...current.members, member._id]
                                : current.members.filter((entry) => entry !== member._id),
                            }));
                          }}
                        />
                        <div>
                          <strong>{member.name}</strong>
                          <span>{member.email}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state compact-state">Select one or more teams to choose project members.</div>
                )}
              </div>
              <label>
                Status
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                  <option value="Planning">Planning</option>
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                </select>
              </label>
              <label>
                Start date
                <input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} />
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
                <button type="button" className="ghost-button" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? 'Saving…' : editingProjectId ? 'Update project' : 'Create project'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default ProjectsPage;
