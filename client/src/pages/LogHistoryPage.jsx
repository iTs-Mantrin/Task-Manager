import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { activityLogApi, getApiError, userApi } from '../lib/api';
import { formatDateTime } from '../utils/format';

const actionLabels = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  profile_update: 'Profile update',
  password_change: 'Password change',
  member_add: 'Added member',
  member_update: 'Updated member',
  member_remove: 'Removed member',
  login: 'Login',
  logout: 'Logout',
  session_revoked: 'Session terminated',
};

const resourceLabels = {
  user: 'User',
  profile: 'Profile',
  team: 'Team',
  project: 'Project',
  task: 'Task',
};

function LogHistoryPage() {
  const { isAdmin, user } = useAuth();
  const [historyMode, setHistoryMode] = useState('own');
  const [memberFilter, setMemberFilter] = useState('');
  const [members, setMembers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadMembers() {
      if (!isAdmin) {
        return;
      }

      setLoadingMembers(true);

      try {
        const response = await userApi.list();
        if (!active) {
          return;
        }

        setMembers((response.data.data || []).filter((entry) => entry.role === 'Member'));
      } catch (loadError) {
        if (active) {
          setError(getApiError(loadError, 'Unable to load members'));
        }
      } finally {
        if (active) {
          setLoadingMembers(false);
        }
      }
    }

    loadMembers();

    return () => {
      active = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    let active = true;

    async function loadLogs() {
      setLoading(true);
      setError('');

      try {
        const response = isAdmin && historyMode === 'member'
          ? await activityLogApi.listMembers(memberFilter ? { userId: memberFilter } : {})
          : await activityLogApi.listMine();

        if (!active) {
          return;
        }

        setLogs(response.data.data || []);
      } catch (loadError) {
        if (active) {
          setError(getApiError(loadError, 'Unable to load activity history'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLogs();

    return () => {
      active = false;
    };
  }, [historyMode, isAdmin, memberFilter]);

  const selectedMember = useMemo(
    () => members.find((entry) => entry._id === memberFilter),
    [members, memberFilter],
  );

  const emptyMessage = isAdmin && historyMode === 'member'
    ? selectedMember
      ? `No activity found for ${selectedMember.name} yet.`
      : 'No member activity found yet.'
    : 'You have no activity history yet.';

  return (
    <div className="page-stack">
      {error ? <div className="page-state error compact-state">{error}</div> : null}

      <section className="card activity-log-toolbar-card">
        <div className="section-title-row">
          <h3>Activity history</h3>
          <span>{logs.length} log entr{logs.length === 1 ? 'y' : 'ies'}</span>
        </div>

        <div className="activity-log-toolbar">
          <div className="segmented-control" role="tablist" aria-label="History mode">
            <button
              type="button"
              className={historyMode === 'own' ? 'ghost-button active-segment' : 'ghost-button'}
              onClick={() => setHistoryMode('own')}
            >
              Own history
            </button>
            {isAdmin ? (
              <button
                type="button"
                className={historyMode === 'member' ? 'ghost-button active-segment' : 'ghost-button'}
                onClick={() => setHistoryMode('member')}
              >
                Member history
              </button>
            ) : null}
          </div>

          {isAdmin && historyMode === 'member' ? (
            <label className="activity-log-filter">
              Member
              <select value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)} disabled={loadingMembers}>
                <option value="">All members</option>
                {members.map((entry) => (
                  <option key={entry._id} value={entry._id}>{entry.name}</option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </section>

      {loading ? <div className="page-state">Loading activity history…</div> : null}

      {!loading && logs.length ? (
        <section className="activity-log-list" aria-label="Activity history list">
          {logs.map((entry) => (
            <article key={entry._id} className="card activity-log-card">
              <div className="activity-log-head">
                <div>
                  <p className="eyebrow">{formatDateTime(entry.createdAt)}</p>
                  <h3>{entry.description}</h3>
                </div>
                <div className="chip-row table-chip-row activity-log-chips">
                  <span className="chip static-chip">{actionLabels[entry.action] || entry.action}</span>
                  <span className="chip static-chip">{resourceLabels[entry.resourceType] || entry.resourceType}</span>
                </div>
              </div>

              <div className="activity-log-meta">
                <span><strong>Actor:</strong> {entry.actorName}{entry.actor === user?.id ? ' (you)' : ''}</span>
                <span><strong>Role:</strong> {entry.actorRole}</span>
                {entry.resourceName ? <span><strong>Item:</strong> {entry.resourceName}</span> : null}
                {entry.metadata?.fields?.length ? <span><strong>Fields:</strong> {entry.metadata.fields.join(', ')}</span> : null}
                {entry.metadata?.memberName ? <span><strong>Member:</strong> {entry.metadata.memberName}</span> : null}
                {entry.deviceName ? <span><strong>Device:</strong> {entry.deviceName}</span> : null}
                {entry.ipAddress ? <span><strong>IP:</strong> {entry.ipAddress}</span> : null}
                {entry.location ? <span><strong>Location:</strong> {entry.location}</span> : null}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {!loading && !logs.length ? <div className="empty-state">{emptyMessage}</div> : null}
    </div>
  );
}

export default LogHistoryPage;
