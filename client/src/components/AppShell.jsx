import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', shortLabel: 'D' },
  { to: '/teams', label: 'Teams', shortLabel: 'T' },
  { to: '/projects', label: 'Projects', shortLabel: 'P' },
  { to: '/tasks', label: 'Tasks', shortLabel: 'K' },
  { to: '/profile', label: 'Profile', shortLabel: 'U' },
];

function AppShell() {
  const { user, logout, isAdmin } = useAuth();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const items = useMemo(
    () => (isAdmin ? [...navItems, { to: '/members', label: 'Members', shortLabel: 'M' }] : navItems),
    [isAdmin],
  );

  const initials = useMemo(
    () => user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U',
    [user?.name],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMobileNavOpen(false);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  const shellClassName = [
    'app-shell',
    collapsed ? 'sidebar-is-collapsed' : '',
    mobileNavOpen ? 'mobile-nav-open' : '',
  ].filter(Boolean).join(' ');

  const sidebarClassName = [
    'sidebar',
    collapsed ? 'collapsed' : '',
  ].filter(Boolean).join(' ');

  const toggleMobileNav = () => {
    setMobileNavOpen((current) => !current);
  };

  const handleNavAction = () => {
    setMobileNavOpen(false);
  };

  return (
    <div className={shellClassName}>
      <div className="mobile-topbar">
        <button
          type="button"
          className={mobileNavOpen ? 'mobile-menu-button is-open' : 'mobile-menu-button'}
          onClick={toggleMobileNav}
          aria-label={mobileNavOpen ? 'Hide navigation menu' : 'Show navigation menu'}
          aria-expanded={mobileNavOpen}
          aria-controls="primary-navigation"
        >
          <span />
          <span />
          <span />
        </button>
        <div className="mobile-topbar-brand">
          <p className="eyebrow">Team Task Manager</p>
          <strong>Workspace</strong>
        </div>
      </div>

      <button
        type="button"
        className={mobileNavOpen ? 'mobile-nav-backdrop visible' : 'mobile-nav-backdrop'}
        onClick={toggleMobileNav}
        aria-label="Hide navigation menu"
      />

      <aside className={sidebarClassName} id="primary-navigation">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <p className="eyebrow">Team Task Manager</p>
            <h1>Workspace</h1>
            <p className="sidebar-copy">Manage teams, projects, and overdue work from one place.</p>
          </div>
          <button
            type="button"
            className="ghost-button sidebar-toggle"
            onClick={() => setCollapsed((current) => !current)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              onClick={handleNavAction}
            >
              <span className="nav-short-label" aria-hidden="true">{item.shortLabel}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user card muted-card">
          <div className="sidebar-user-summary">
            <div className="user-avatar">{initials}</div>
            <div className="sidebar-user-details">
              <p className="eyebrow">Signed in as</p>
              <strong>{user?.name}</strong>
              <span>{user?.role}</span>
              <span>{user?.email}</span>
            </div>
          </div>
          <button type="button" className="ghost-button" onClick={() => {
            handleNavAction();
            logout();
          }}>
            <span className="nav-label">Logout</span>
            <span className="nav-short-label" aria-hidden="true">↩</span>
          </button>
        </div>
      </aside>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppShell;
