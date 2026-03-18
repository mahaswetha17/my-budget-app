import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const CATEGORY_ICONS = {
  Groceries: '🛒', Medical: '💊', Utilities: '💡', Transport: '🚌',
  Entertainment: '🎬', Education: '📚', Clothing: '👕', Salary: '💼',
  Pension: '🏛️', Business: '🏢', 'Rent Received': '🏠',
  'Other Income': '💰', Other: '📝'
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* ── TOP HEADER ── */}
      <div style={{
        background: 'white', borderBottom: '1px solid var(--border)',
        padding: '0 16px', height: '60px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        {/* Logo - clicking opens sidebar */}
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <span style={{ fontSize: '22px' }}>💰</span>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: '600',
            color: 'var(--primary)', fontSize: '20px'
          }}>MyFinance</span>
          <span style={{ fontSize: '18px', color: 'var(--text-muted)', marginLeft: '4px' }}>☰</span>
        </button>

        {/* Profile avatar - clicking opens dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'var(--primary)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: '800', fontSize: '14px'
            }}
          >
            {initials}
          </button>

          {/* Profile dropdown */}
          {profileOpen && (
            <>
              <div
                onClick={() => setProfileOpen(false)}
                style={{
                  position: 'fixed', inset: 0, zIndex: 150
                }}
              />
              <div style={{
                position: 'absolute', right: 0, top: '48px',
                background: 'white', borderRadius: '14px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                border: '1px solid var(--border)',
                width: '220px', zIndex: 200, overflow: 'hidden'
              }}>
                {/* Profile info */}
                <div style={{
                  padding: '16px',
                  background: 'var(--primary-light)',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: '800', fontSize: '16px', flexShrink: 0
                    }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>
                        {user?.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {user?.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Budget info */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Monthly Budget</div>
                  <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '16px' }}>
                    {user?.preferredCurrency}{(user?.monthlyBudgetGoal || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Menu items */}
                <div style={{ padding: '8px' }}>
                  <button
                    onClick={() => { navigate('/'); setProfileOpen(false); }}
                    style={{
                      width: '100%', padding: '10px 12px', border: 'none',
                      background: 'none', cursor: 'pointer', textAlign: 'left',
                      borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                      color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                  >
                    🏠 Home
                  </button>
                  <button
                    onClick={() => { navigate('/add'); setProfileOpen(false); }}
                    style={{
                      width: '100%', padding: '10px 12px', border: 'none',
                      background: 'none', cursor: 'pointer', textAlign: 'left',
                      borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                      color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                  >
                    ➕ Add Transaction
                  </button>
                  <button
                    onClick={() => { navigate('/reports'); setProfileOpen(false); }}
                    style={{
                      width: '100%', padding: '10px 12px', border: 'none',
                      background: 'none', cursor: 'pointer', textAlign: 'left',
                      borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                      color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                  >
                    📊 Reports
                  </button>
                </div>

                {/* Logout at bottom */}
                <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%', padding: '10px 12px', border: 'none',
                      background: 'var(--expense-bg)', cursor: 'pointer', textAlign: 'left',
                      borderRadius: '8px', fontSize: '14px', fontWeight: '700',
                      color: 'var(--expense-color)', display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── SIDEBAR OVERLAY ── */}
      {sidebarOpen && (
        <>
          {/* Dark backdrop */}
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 200
            }}
          />

          {/* Sidebar panel */}
          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0,
            width: '280px', background: 'white',
            zIndex: 300, display: 'flex', flexDirection: 'column',
            boxShadow: '4px 0 20px rgba(0,0,0,0.15)'
          }}>
            {/* Sidebar header */}
            <div style={{
              padding: '24px 20px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              color: 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '600' }}>
                  💰 MyFinance
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none',
                    color: 'white', width: '32px', height: '32px',
                    borderRadius: '50%', cursor: 'pointer', fontSize: '18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '800', fontSize: '18px'
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>{user?.name}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>{user?.email}</div>
                </div>
              </div>
            </div>

            {/* Nav links */}
            <div style={{ flex: 1, padding: '16px 12px' }}>
              <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', padding: '8px 12px', marginBottom: '4px' }}>
                MENU
              </p>

              {[
                { to: '/', icon: '🏠', label: 'Home' },
                { to: '/add', icon: '➕', label: 'Add Transaction' },
                { to: '/reports', icon: '📊', label: 'Reports' }
              ].map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setSidebarOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px', borderRadius: '12px',
                    textDecoration: 'none', marginBottom: '4px',
                    fontWeight: '700', fontSize: '16px',
                    background: isActive ? 'var(--primary-light)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    transition: 'all 0.15s'
                  })}
                >
                  <span style={{ fontSize: '24px' }}>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Logout at bottom of sidebar */}
            <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', padding: '14px 16px',
                  background: 'var(--expense-bg)',
                  border: '1px solid #f5c6c5',
                  borderRadius: '12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  fontFamily: 'var(--font-body)', fontWeight: '700',
                  fontSize: '16px', color: 'var(--expense-color)'
                }}
              >
                <span style={{ fontSize: '22px' }}>🚪</span>
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      {/* Page content */}
      <Outlet />
    </div>
  );
}