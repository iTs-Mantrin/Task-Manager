import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const settingsLinks = [
  { to: '/settings/profile', label: 'Profile' },
  { to: '/settings/sessions', label: 'Sessions' },
  { to: '/settings/history', label: 'Log history' },
];

function SettingsLayout() {
  const { isAdmin } = useAuth();

  return (
    <div className="page-stack settings-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Account</p>
          <h2>Settings</h2>
          <p>
            Manage your account details, sessions, and activity history.
            {isAdmin ? ' Admins can also review member activity.' : ''}
          </p>
        </div>
      </section>

      <section className="card settings-subnav-card">
        <nav className="settings-subnav" aria-label="Settings sections">
          {settingsLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'settings-subnav-link active' : 'settings-subnav-link')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </section>

      <Outlet />
    </div>
  );
}

export default SettingsLayout;
