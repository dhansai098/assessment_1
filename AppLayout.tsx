import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/employees', label: 'Employees', icon: '👥' },
  { to: '/departments', label: 'Departments', icon: '🏢' },
  { to: '/attendance', label: 'Attendance', icon: '📅' },
  { to: '/reports', label: 'Reports', icon: '📈' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div style={styles.root}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: collapsed ? 72 : 240 }}>
        <div style={styles.sidebarTop}>
          <div style={styles.brand}>
            <span style={styles.brandIcon}>EMS</span>
            {!collapsed && <span style={styles.brandText}>Workforce</span>}
          </div>
          <button style={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              })}
              title={collapsed ? item.label : undefined}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {!collapsed && <span style={styles.navLabel}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={styles.sidebarBottom}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
            {!collapsed && (
              <div>
                <div style={styles.userName}>{user?.username}</div>
                <div style={styles.userRole}>{user?.role}</div>
              </div>
            )}
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout} title="Logout">
            🚪
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { display: 'flex', minHeight: '100vh', background: '#f1f5f9' },
  sidebar: {
    background: 'linear-gradient(180deg, #1a1f5e 0%, #2d3a8c 100%)',
    display: 'flex', flexDirection: 'column',
    position: 'sticky', top: 0, height: '100vh',
    transition: 'width 0.25s ease', flexShrink: 0, zIndex: 100,
  },
  sidebarTop: {
    padding: '20px 16px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  brandIcon: {
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 8, padding: '4px 8px',
    color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: 1,
  },
  brandText: { color: '#fff', fontWeight: 700, fontSize: 16 },
  collapseBtn: {
    background: 'rgba(255,255,255,0.1)', border: 'none',
    color: '#fff', borderRadius: 6, width: 28, height: 28,
    cursor: 'pointer', fontSize: 14, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  nav: { padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 12px', borderRadius: 10,
    color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
    fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
  },
  navItemActive: {
    background: 'rgba(255,255,255,0.15)', color: '#fff',
  },
  navIcon: { fontSize: 18, flexShrink: 0 },
  navLabel: {},
  sidebarBottom: {
    padding: '16px 12px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    color: '#fff', fontWeight: 700, fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  userName: { color: '#fff', fontSize: 13, fontWeight: 600 },
  userRole: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  logoutBtn: {
    background: 'none', border: 'none',
    cursor: 'pointer', fontSize: 18, padding: 4,
  },
  main: { flex: 1, overflow: 'auto', padding: 28 },
};
