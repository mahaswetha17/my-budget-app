import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CATEGORY_ICONS = {
  Groceries: '🛒', Medical: '💊', Utilities: '💡', Transport: '🚌',
  Entertainment: '🎬', Education: '📚', Clothing: '👕', Salary: '💼',
  Pension: '🏛️', Business: '🏢', 'Rent Received': '🏠',
  'Other Income': '💰', Other: '📝'
};

export { CATEGORY_ICONS };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* Top mini header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: '600', color: 'var(--primary)', fontSize: '18px' }}>
          💰 MyFinance
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            {user?.name?.split(' ')[0]}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: 'var(--bg-subtle)', border: 'none', padding: '6px 14px',
              borderRadius: '20px', cursor: 'pointer', fontSize: '13px',
              fontWeight: '700', color: 'var(--text-secondary)'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Page content */}
      <Outlet />

      {/* Bottom navigation - large, accessible tabs */}
      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="nav-icon">🏠</span>
          Home
        </NavLink>
        <NavLink to="/add" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="nav-icon">➕</span>
          Add
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="nav-icon">📊</span>
          Reports
        </NavLink>
      </nav>
    </div>
  );
}
