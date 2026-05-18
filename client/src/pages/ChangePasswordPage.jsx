import { useState } from 'react';
import { getApiError, userApi } from '../lib/api';

function ChangePasswordPage() {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setSavingPassword(true);
    setError('');
    setSuccess('');

    try {
      await userApi.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setSuccess('Password updated successfully.');
    } catch (saveError) {
      setError(getApiError(saveError, 'Unable to update password'));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      {error ? <div className="page-state error compact-state">{error}</div> : null}
      {success ? <div className="success-state">{success}</div> : null}

      <section className="card">
        <div className="section-title-row">
          <h3>Change password</h3>
        </div>

        <form className="form-grid" onSubmit={handlePasswordSubmit}>
          <label>
            Current password
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
              required
            />
          </label>
          <button type="submit" className="primary-button btn-inline" disabled={savingPassword}>
            {savingPassword ? 'Saving…' : 'Change password'}
          </button>
        </form>
      </section>
    </>
  );
}

export default ChangePasswordPage;
