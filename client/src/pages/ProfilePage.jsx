import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiError, userApi } from '../lib/api';

function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setError('');
    setSuccess('');

    try {
      await userApi.updateProfile(profileForm);
      await refreshUser();
      setSuccess('Profile updated successfully.');
    } catch (saveError) {
      setError(getApiError(saveError, 'Unable to update profile'));
    } finally {
      setSavingProfile(false);
    }
  };

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
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Account</p>
          <h2>Profile</h2>
          <p>Update your account details and change your password.</p>
        </div>
      </section>

      {error ? <div className="page-state error compact-state">{error}</div> : null}
      {success ? <div className="success-state">{success}</div> : null}

      <section className="content-grid two-column profile-grid">
        <article className="card">
          <div className="section-title-row">
            <h3>Profile details</h3>
            <span>{user?.role || '—'}</span>
          </div>

          <form className="form-grid" onSubmit={handleProfileSubmit}>
            <label>
              Full name
              <input
                value={profileForm.name}
                onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </label>
            <button type="submit" className="primary-button btn-inline" disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </article>

        <article className="card">
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
        </article>
      </section>
    </div>
  );
}

export default ProfilePage;
