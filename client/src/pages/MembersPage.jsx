import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiError, userApi } from '../lib/api';

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: 'Member',
};

function getUserUpdatePayload(form) {
  const payload = {
    name: form.name,
    email: form.email,
    role: form.role,
  };

  if (form.password) {
    payload.password = form.password;
  }

  return payload;
}

function MembersPage() {
  const { isAdmin, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingUserId, setEditingUserId] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const summary = useMemo(() => ({
    total: users.length,
    admins: users.filter((entry) => entry.role === 'Admin').length,
    members: users.filter((entry) => entry.role === 'Member').length,
  }), [users]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await userApi.list();
      setUsers(response.data.data || []);
    } catch (loadError) {
      setError(getApiError(loadError, 'Unable to load users'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      return;
    }

    setLoading(false);
  }, [isAdmin]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await userApi.create(form);
      setForm(initialForm);
      setEditingUserId('');
      setShowCreateForm(false);
      setSuccess('User created successfully.');
      await loadUsers();
    } catch (saveError) {
      setError(getApiError(saveError, 'Unable to create user'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingUserId(entry._id);
    setShowCreateForm(true);
    setSuccess('');
    setError('');
    setForm({
      name: entry.name,
      email: entry.email,
      password: '',
      role: entry.role,
    });
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await userApi.update(editingUserId, getUserUpdatePayload(form));
      setForm(initialForm);
      setEditingUserId('');
      setShowCreateForm(false);
      setSuccess('User updated successfully.');
      await loadUsers();
    } catch (saveError) {
      setError(getApiError(saveError, 'Unable to update user'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await userApi.remove(userId);
      setSuccess('User deleted successfully.');
      await loadUsers();
    } catch (saveError) {
      setError(getApiError(saveError, 'Unable to delete user'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setEditingUserId('');
    setShowCreateForm(false);
    setError('');
  };

  if (!isAdmin) {
    return <div className="page-state error">Only Admin users can manage members.</div>;
  }

  if (loading) {
    return <div className="page-state">Loading members…</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Admin controls</p>
          <h2>Members</h2>
          <p>Create, update, and remove users while reviewing their team and project access.</p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              if (showCreateForm && !editingUserId) {
                handleCancel();
                return;
              }

              setEditingUserId('');
              setForm(initialForm);
              setShowCreateForm(true);
              setSuccess('');
              setError('');
            }}
          >
            {showCreateForm && !editingUserId ? 'Close' : 'Add member'}
          </button>
        </div>
      </section>

      {error ? <div className="page-state error compact-state">{error}</div> : null}
      {success ? <div className="success-state">{success}</div> : null}

      <section className="stats-grid dashboard-stats-grid">
        <article className="stat-card">
          <span>Total users</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="stat-card accent">
          <span>Admins</span>
          <strong>{summary.admins}</strong>
        </article>
        <article className="stat-card">
          <span>Members</span>
          <strong>{summary.members}</strong>
        </article>
        <article className="stat-card">
          <span>Your role</span>
          <strong>{user?.role || '—'}</strong>
        </article>
      </section>

      <section className="card">
          <div className="section-title-row">
          <h3>Member directory</h3>
          <span>{users.length} user(s)</span>
        </div>

        {users.length ? (
          <div className="table-wrap">
            <table className="member-table responsive-table members-responsive-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Teams</th>
                  <th>Projects</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((entry) => (
                  <tr key={entry._id}>
                    <td data-label="Member">
                      <strong>{entry.name}</strong>
                      <div className="table-subcopy table-email">{entry.email}</div>
                    </td>
                    <td data-label="Role">
                      <span className={`badge ${entry.role.toLowerCase()}`}>{entry.role}</span>
                    </td>
                    <td data-label="Teams">
                      {entry.teams?.length ? (
                        <div className="chip-row table-chip-row">
                          {entry.teams.map((team) => (
                            <span key={team._id} className="chip static-chip">{team.name} · {team.role}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="table-subcopy">No teams yet</span>
                      )}
                    </td>
                    <td data-label="Projects">
                      {entry.projects?.length ? (
                        <div className="chip-row table-chip-row">
                          {entry.projects.map((project) => (
                            <span key={project._id} className="chip static-chip">{project.name}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="table-subcopy">No projects yet</span>
                      )}
                    </td>
                    <td data-label="Actions">
                      <div className="table-actions">
                        <button
                          type="button"
                          className="ghost-button icon-button"
                          onClick={() => handleEdit(entry)}
                          disabled={saving}
                          aria-label={`Edit ${entry.name}`}
                          title="Edit"
                        >
                          <span aria-hidden="true">✎</span>
                        </button>
                        <button
                          type="button"
                          className="ghost-button danger icon-button"
                          onClick={() => handleDelete(entry._id)}
                          disabled={saving || entry._id === user?.id}
                          aria-label={`Delete ${entry.name}`}
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
          <div className="empty-state">No users found.</div>
        )}
      </section>

      {showCreateForm ? (
        <div className="modal-overlay" role="presentation" onClick={handleCancel}>
          <section className="card modal-window" role="dialog" aria-modal="true" aria-labelledby="member-modal-title" onClick={(event) => event.stopPropagation()}>
            <div className="section-title-row">
              <div>
                <h3 id="member-modal-title">{editingUserId ? 'Update member' : 'Create member'}</h3>
                <span>Admin only</span>
              </div>
            </div>

            <form className="form-grid form-grid-wide" onSubmit={editingUserId ? handleUpdate : handleCreate}>
              <label>
                Full name
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
              </label>
              <label>
                Email
                <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder={editingUserId ? 'Leave blank to keep current password' : ''}
                  required={!editingUserId}
                />
              </label>
              <label>
                Role
                <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? 'Saving…' : editingUserId ? 'Update member' : 'Create member'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default MembersPage;
