import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { getApiError, projectApi, teamApi } from '../lib/api';
import { formatDate } from '../utils/format';

function getProjectTeams(project) {
  return project?.teams?.length ? project.teams : (project?.team ? [project.team] : []);
}

function getUniqueMembers(selectedTeams) {
  return selectedTeams.flatMap((team) => {
    const members = team.members?.map((entry) => entry.user).filter(Boolean) || [];
    const owner = team.owner ? [team.owner] : [];
    return [...owner, ...members];
  }).filter(
    (user, index, list) => user && list.findIndex((entry) => entry._id === user._id) === index,
  );
}

function ProjectDetailPage() {
  const { isAdmin } = useAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [teams, setTeams] = useState([]);
  const [memberIds, setMemberIds] = useState([]);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    status: 'Planning',
    teams: [],
    startDate: '',
    dueDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProject = async () => {
    setLoading(true);
    setError('');

    try {
      const [projectResponse, teamsResponse] = await Promise.all([projectApi.detail(projectId), teamApi.list()]);
      const projectData = projectResponse.data.data;
      setTeams(teamsResponse.data.data || []);
      setProject(projectData);
      setMemberIds((projectData.members || []).map((member) => member._id));
      setProjectForm({
        name: projectData.name || '',
        description: projectData.description || '',
        status: projectData.status || 'Planning',
        teams: getProjectTeams(projectData).map((team) => team._id || team),
        startDate: projectData.startDate ? projectData.startDate.slice(0, 10) : '',
        dueDate: projectData.dueDate ? projectData.dueDate.slice(0, 10) : '',
      });
    } catch (loadError) {
      setError(getApiError(loadError, 'Unable to load project'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const selectedTeams = useMemo(
    () => teams.filter((team) => projectForm.teams.includes(team._id)),
    [projectForm.teams, teams],
  );

  const availableMembers = useMemo(() => {
    return getUniqueMembers(selectedTeams);
  }, [selectedTeams]);

  const handleTeamSelectionChange = (teamIds) => {
    const nextMembers = getUniqueMembers(teams.filter((team) => teamIds.includes(team._id))).map((member) => member._id);

    setProjectForm((current) => ({ ...current, teams: teamIds }));
    setMemberIds((current) => current.filter((memberId) => nextMembers.includes(memberId)));
  };

  const handleSaveMembers = async () => {
    setSaving(true);
    setError('');

    try {
      await projectApi.update(projectId, { members: memberIds });
      await loadProject();
    } catch (saveError) {
      setError(getApiError(saveError, 'Unable to update project members'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProject = async () => {
    setSaving(true);
    setError('');

    try {
      await projectApi.update(projectId, {
        ...projectForm,
        startDate: projectForm.startDate || null,
        dueDate: projectForm.dueDate || null,
      });
      await loadProject();
    } catch (saveError) {
      setError(getApiError(saveError, 'Unable to update project details'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    setSaving(true);
    setError('');

    try {
      await projectApi.remove(projectId);
      navigate('/projects');
    } catch (saveError) {
      setError(getApiError(saveError, 'Unable to delete project'));
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page-state">Loading project…</div>;
  }

  if (error && !project) {
    return <div className="page-state error">{error}</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Project detail</p>
          <h2>{project?.name}</h2>
          <p>{project?.description || 'No description provided.'}</p>
        </div>
      </section>

      {error ? <div className="page-state error">{error}</div> : null}

      <section className="content-grid two-column">
        <article className="card">
          <div className="section-title-row">
            <h3>Project snapshot</h3>
          </div>
          <div className="stack-list">
            <div className="split-row"><span>Status</span><StatusBadge value={project?.status} kind="project-status" /></div>
            <div className="split-row"><span>Teams</span><strong>{getProjectTeams(project).map((team) => team.name).join(', ') || '—'}</strong></div>
            <div className="split-row"><span>Start</span><strong>{formatDate(project?.startDate)}</strong></div>
            <div className="split-row"><span>Due</span><strong>{formatDate(project?.dueDate)}</strong></div>
          </div>
        </article>

        <article className="card">
          <div className="section-title-row">
            <h3>Project members</h3>
            <span>{project?.members?.length || 0} member(s)</span>
          </div>
          {project?.members?.length ? (
            <div className="stack-list">
              {project.members.map((member) => (
                <div key={member._id} className="person-card">
                  <strong>{member.name}</strong>
                  <span>{member.email}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No members assigned directly to this project.</div>
          )}
        </article>
      </section>

      {isAdmin ? (
        <section className="content-grid two-column">
          <article className="card">
            <div className="section-title-row">
              <h3>Project settings</h3>
              <span>Admin only</span>
            </div>
            <div className="form-grid">
              <label>
                Project name
                <input value={projectForm.name} onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label>
                Teams
                <select
                  multiple
                  className="multi-select"
                  value={projectForm.teams}
                  onChange={(event) => handleTeamSelectionChange(Array.from(event.target.selectedOptions, (option) => option.value))}
                >
                  {teams.map((entry) => (
                    <option key={entry._id} value={entry._id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
                <span className="table-subcopy">Hold Ctrl (or Cmd on Mac) to select multiple teams.</span>
              </label>
              <label>
                Status
                <select value={projectForm.status} onChange={(event) => setProjectForm((current) => ({ ...current, status: event.target.value }))}>
                  <option value="Planning">Planning</option>
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                </select>
              </label>
              <label>
                Start date
                <input type="date" value={projectForm.startDate} onChange={(event) => setProjectForm((current) => ({ ...current, startDate: event.target.value }))} />
              </label>
              <label>
                Due date
                <input type="date" value={projectForm.dueDate} onChange={(event) => setProjectForm((current) => ({ ...current, dueDate: event.target.value }))} />
              </label>
              <label>
                Description
                <textarea rows="4" value={projectForm.description} onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))} />
              </label>
              <div className="page-actions">
                <button type="button" className="ghost-button" onClick={handleSaveProject} disabled={saving}>
                  {saving ? 'Saving…' : 'Save project'}
                </button>
                <button type="button" className="ghost-button danger" onClick={handleDeleteProject} disabled={saving}>
                  Delete project
                </button>
              </div>
            </div>
          </article>

          <article className="card">
            <div className="section-title-row">
              <h3>Manage project members</h3>
               <span>Selected team members only</span>
            </div>

            {availableMembers.length ? (
              <>
                <div className="checkbox-grid">
                  {availableMembers.map((member) => (
                    <label key={member._id} className="checkbox-card">
                      <input
                        type="checkbox"
                        checked={memberIds.includes(member._id)}
                        onChange={(event) => {
                          setMemberIds((current) => (
                            event.target.checked
                              ? [...current, member._id]
                              : current.filter((id) => id !== member._id)
                          ));
                        }}
                      />
                      <div>
                        <strong>{member.name}</strong>
                        <span>{member.email}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <button type="button" className="primary-button" onClick={handleSaveMembers} disabled={saving}>
                  {saving ? 'Saving…' : 'Save members'}
                </button>
              </>
            ) : (
              <div className="empty-state">Add members to the selected teams first.</div>
            )}
          </article>
        </section>
      ) : null}
    </div>
  );
}

export default ProjectDetailPage;
