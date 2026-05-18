import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiError, teamApi, userApi } from '../lib/api';

const initialForm = { name: '', description: '', memberIds: [] };

function getCreateTeamPayload(form) {
  return {
    name: form.name,
    description: form.description,
    members: form.memberIds.map((userId) => ({ user: userId, role: 'Member' })),
  };
}

function TeamsPage() {
  const { isAdmin } = useAuth();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingTeamId, setEditingTeamId] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [teamsResponse, visibleUsers] = await Promise.all([
        teamApi.list(),
        isAdmin ? userApi.list() : Promise.resolve({ data: { data: [] } }),
      ]);

      setTeams(teamsResponse.data.data || []);
      setUsers(visibleUsers.data.data || []);
    } catch (loadError) {
      setError(getApiError(loadError, 'Unable to load teams'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const selectableUsers = useMemo(
    () => users.filter((user) => !form.memberIds.includes(user._id)),
    [form.memberIds, users],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingTeamId) {
        await teamApi.update(editingTeamId, {
          name: form.name,
          description: form.description,
        });
        setSuccess('Team updated successfully.');
      } else {
        await teamApi.create(getCreateTeamPayload(form));
        setSuccess('Team created successfully.');
      }

      setForm(initialForm);
      setEditingTeamId('');
      setShowCreateForm(false);
      await loadData();
    } catch (saveError) {
      setError(getApiError(saveError, editingTeamId ? 'Unable to update team' : 'Unable to create team'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (team) => {
    setEditingTeamId(team._id);
    setForm({
      name: team.name || '',
      description: team.description || '',
      memberIds: [],
    });
    setShowCreateForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (team) => {
    if (!window.confirm(`Delete team "${team.name}"? This also deletes its projects and tasks.`)) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await teamApi.remove(team._id);
      setSuccess('Team deleted successfully.');
      await loadData();
    } catch (deleteError) {
      setError(getApiError(deleteError, 'Unable to delete team'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setEditingTeamId('');
    setShowCreateForm(false);
  };

  return (
    <div className="page-stack">
      <section className="page-header split-row">
        <div>
          <p className="eyebrow">Collaboration</p>
          <h2>Teams</h2>
          <p>Organize work by team and control which members can access each project.</p>
        </div>
        {isAdmin ? (
          <div className="page-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowCreateForm((current) => !current)}
            >
              {showCreateForm ? 'Close' : 'Add team'}
            </button>
          </div>
        ) : null}
      </section>

      {error ? <div className="page-state error">{error}</div> : null}
      {success ? <div className="success-state">{success}</div> : null}

      <section className="card">
        <div className="section-title-row">
          <h3>All visible teams</h3>
          <span>{teams.length} team(s)</span>
        </div>

        {loading ? (
          <div className="empty-state">Loading teams…</div>
        ) : teams.length ? (
          <div className="table-wrap">
            <table className="resource-table responsive-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Owner</th>
                  <th>Members</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team._id}>
                    <td data-label="Team">
                      <Link to={`/teams/${team._id}`} className="table-link">
                        <strong>{team.name}</strong>
                      </Link>
                      <div className="table-subcopy table-description">{team.description || 'No description provided.'}</div>
                    </td>
                    <td data-label="Owner">
                      <strong>{team.owner?.name || '—'}</strong>
                      <div className="table-subcopy table-email">{team.owner?.email || 'No owner email'}</div>
                    </td>
                    <td data-label="Members">{(team.members?.length || 0) + 1}</td>
                     <td data-label="Actions">
                       <div className="table-actions">
                         <Link
                           to={`/teams/${team._id}`}
                           className="ghost-button icon-button"
                           aria-label={`View ${team.name}`}
                           title="View"
                         >
                           <span aria-hidden="true">👁</span>
                         </Link>
                         {isAdmin ? (
                           <>
                             <button
                               type="button"
                               className="ghost-button icon-button"
                               onClick={() => handleEdit(team)}
                               disabled={saving}
                               aria-label={`Edit ${team.name}`}
                               title="Edit"
                             >
                               <span aria-hidden="true">✎</span>
                             </button>
                             <button
                               type="button"
                               className="ghost-button danger icon-button"
                               onClick={() => handleDelete(team)}
                               disabled={saving}
                               aria-label={`Delete ${team.name}`}
                               title="Delete"
                             >
                               <span aria-hidden="true">🗑</span>
                             </button>
                           </>
                         ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No teams available yet.</div>
        )}
      </section>

      {isAdmin && showCreateForm ? (
        <div className="modal-overlay" role="presentation" onClick={handleCancel}>
          <section className="card modal-window" role="dialog" aria-modal="true" aria-labelledby="create-team-title" onClick={(event) => event.stopPropagation()}>
            <div className="section-title-row">
              <div>
                <h3 id="create-team-title">Create a team</h3>
                <span>Admin only</span>
              </div>
            </div>

            <form className="form-grid form-grid-wide" onSubmit={handleSubmit}>
              <label>
                Team name
                <input
                  name="name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  rows="4"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
              <label>
                Add members
                <select
                  disabled={Boolean(editingTeamId)}
                  value=""
                  onChange={(event) => {
                    if (!event.target.value) {
                      return;
                    }

                    setForm((current) => ({
                      ...current,
                      memberIds: Array.from(new Set([...current.memberIds, event.target.value])),
                    }));
                  }}
                >
                  <option value="">{editingTeamId ? 'Members can be managed in team details' : 'Select a user'}</option>
                  {selectableUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </label>
              {!editingTeamId && form.memberIds.length ? (
                <div className="chip-row">
                  {form.memberIds.map((userId) => {
                    const user = users.find((entry) => entry._id === userId);

                    return (
                      <button
                        key={userId}
                        type="button"
                        className="chip"
                        onClick={() => setForm((current) => ({ ...current, memberIds: current.memberIds.filter((id) => id !== userId) }))}
                      >
                        {user?.name || userId} ×
                      </button>
                    );
                  })}
                </div>
              ) : null}
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? 'Saving…' : editingTeamId ? 'Update team' : 'Create team'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default TeamsPage;
