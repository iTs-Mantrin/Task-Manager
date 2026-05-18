import { useCallback, useEffect, useState } from 'react';
import { sessionApi, getApiError } from '../lib/api';
import { formatDateTime } from '../utils/format';

function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState(null);
  const [error, setError] = useState('');

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await sessionApi.listMine();
      setSessions(response.data.data || []);
    } catch (loadError) {
      setError(getApiError(loadError, 'Unable to load sessions'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleTerminate = async (sessionId) => {
    setTerminating(sessionId);
    setError('');

    try {
      await sessionApi.terminate(sessionId);
      setSessions((current) => current.filter((session) => session._id !== sessionId));
    } catch (termError) {
      setError(getApiError(termError, 'Unable to terminate session'));
    } finally {
      setTerminating(null);
    }
  };

  const handleTerminateAllOther = async () => {
    setTerminating('all');
    setError('');

    try {
      await sessionApi.terminateAllOther();
      setSessions((current) => current.filter((session) => !session.isCurrentSession));
    } catch (termError) {
      setError(getApiError(termError, 'Unable to terminate sessions'));
    } finally {
      setTerminating(null);
    }
  };

  return (
    <div className="page-stack">
      {error ? <div className="page-state error compact-state">{error}</div> : null}

      <section className="card activity-log-toolbar-card">
        <div className="section-title-row">
          <h3>Active sessions</h3>
          <span>{sessions.length} active session{sessions.length !== 1 ? 's' : ''}</span>
        </div>

        {sessions.length > 1 ? (
          <div className="activity-log-toolbar">
            <p className="text-muted">
              You are logged in on {sessions.length} device{sessions.length !== 1 ? 's' : ''}.
            </p>
            <button
              type="button"
               className="ghost-button session-terminate-all"
              onClick={handleTerminateAllOther}
              disabled={terminating === 'all'}
            >
              {terminating === 'all' ? 'Terminating…' : 'Sign out all other devices'}
            </button>
          </div>
        ) : null}
      </section>

      {loading ? <div className="page-state">Loading sessions…</div> : null}

      {!loading && sessions.length ? (
        <section className="activity-log-list" aria-label="Active sessions list">
          {sessions.map((session) => (
            <article key={session._id} className="card activity-log-card">
              <div className="activity-log-head">
                <div>
                  {session.isCurrentSession ? (
                    <p className="eyebrow">
                      <span className="chip session-chip-current">Current session</span>
                    </p>
                  ) : null}
                  <h3>{session.deviceName || 'Unknown device'}</h3>
                </div>

                <div className="chip-row activity-log-chips">
                  <span className="chip static-chip">{session.deviceType}</span>
                  {!session.isCurrentSession ? (
                    <button
                      type="button"
                      className="chip session-chip-terminate"
                      onClick={() => handleTerminate(session._id)}
                      disabled={terminating === session._id}
                    >
                      {terminating === session._id ? 'Terminating…' : 'Terminate'}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="activity-log-meta">
                {session.ipAddress ? (
                  <span><strong>IP:</strong> {session.ipAddress}</span>
                ) : null}
                {session.location ? (
                  <span><strong>Location:</strong> {session.location}</span>
                ) : null}
                <span><strong>Last active:</strong> {formatDateTime(session.lastActiveAt)}</span>
                <span><strong>Logged in:</strong> {formatDateTime(session.createdAt)}</span>
                <span><strong>Expires:</strong> {formatDateTime(session.expiresAt)}</span>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {!loading && !sessions.length ? (
        <div className="empty-state">No active sessions found.</div>
      ) : null}
    </div>
  );
}

export default SessionsPage;
