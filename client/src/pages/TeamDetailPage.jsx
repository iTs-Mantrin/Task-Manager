import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiError, teamApi, userApi } from '../lib/api';

function TeamDetailPage() {
  const { isAdmin } = useAuth();
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [users, setUsers] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [roleUpdates, setRoleUpdates] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadTeam = async () => {
    setLoading(true);
    setError('');

    try {
      const [teamResponse, visibleUsers] = await Promise.all([
        teamApi.detail(teamId),
        isAdmin ? userApi.list() : Promise.resolve({ data: { data: [] } }),
      ]);
      setTeam(teamResponse.data.data);
      setRoleUpdates(
        Object.fromEntries((teamResponse.data.data?.members || []).map((member) => [member.user?._id, member.role || 'Member'])),
      );
      setUsers(visibleUsers.data.data || []);
    } catch (loadError) {
      setError(getApiError(loadError, 'Unable to load team'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [teamId, isAdmin]);

  const availableUsers = users.filter(
    (user) => user._id !== team?.owner?._id && !(team?.members || []).some((member) => member.user?._id === user._id),
  );

  const handleAddMember = async (event) => {
    event.preventDefault();
    if (!memberId) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await teamApi.addMember(teamId, { userId: memberId, role: 'Member' });
      setMemberId('');
      await loadTeam();
    } catch (saveError) {
      setError(getApiError(saveError, 'Unable to add member'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    setSaving(true);
    setError('');

    try {
      await teamApi.removeMember(teamId, userId);
      await loadTeam();
    } catch (saveError) {
      setError(getApiError(saveError, 'Unable to remove member'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMemberRole = async (userId) => {
    setSaving(true);
    setError('');

    try {
      await teamApi.updateMember(teamId, userId, { role: roleUpdates[userId] || 'Member' });
      await loadTeam();
    } catch (saveError) {
      setError(getApiError(saveError, 'Unable to update member role'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page-state">Loading team…</div>;
  }

  if (error && !team) {
    return <div className="page-state error">{error}</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Team detail</p>
          <h2>{team?.name}</h2>
          <p>{team?.description || 'No description provided.'}</p>
        </div>
      </section>

      {error ? <div className="page-state error">{error}</div> : null}

      <section className="content-grid two-column">
        <article className="card">
          <div className="section-title-row">
            <h3>Owner</h3>
          </div>
          <div className="person-card">
            <strong>{team?.owner?.name}</strong>
            <span>{team?.owner?.email}</span>
          </div>
        </article>

        <article className="card">
          <div className="section-title-row">
            <h3>Members</h3>
            <span>{team?.members?.length || 0} member(s)</span>
          </div>

            {team?.members?.length ? (
              <div className="stack-list">
                {team.members.map((member) => (
                  <div key={member.user?._id} className="stack-row split-row member-row">
                    <div>
                      <strong>{member.user?.name}</strong>
                      <span>{member.user?.email}</span>
                    </div>
                    {isAdmin ? (
                      <div className="page-actions member-actions">
                        <select
                          value={roleUpdates[member.user?._id] || member.role || 'Member'}
                          onChange={(event) => {
                            const nextRole = event.target.value;
                            setRoleUpdates((current) => ({ ...current, [member.user?._id]: nextRole }));
                          }}
                          disabled={saving}
                        >
                          <option value="Admin">Admin</option>
                          <option value="Member">Member</option>
                        </select>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => handleUpdateMemberRole(member.user?._id)}
                          disabled={saving}
                        >
                          Save role
                        </button>
                        <button
                          type="button"
                          className="ghost-button danger"
                          onClick={() => handleRemoveMember(member.user?._id)}
                          disabled={saving}
                        >
                          Remove
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
            </div>
          ) : (
            <div className="empty-state">No members added yet.</div>
          )}
        </article>
      </section>

      {isAdmin ? (
        <section className="card">
          <div className="section-title-row">
            <h3>Add member</h3>
          </div>
          <form className="form-inline" onSubmit={handleAddMember}>
            <select value={memberId} onChange={(event) => setMemberId(event.target.value)}>
              <option value="">Select a user</option>
              {availableUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            <button type="submit" className="primary-button" disabled={saving || !memberId}>
              {saving ? 'Saving…' : 'Add member'}
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}

export default TeamDetailPage;
