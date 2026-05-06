import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useState } from 'react'

const navLinks = [
  { to: '/clubs',    label: 'Клуби' },
  { to: '/events',   label: 'Події' },
  { to: '/bookings', label: 'Бронювання', auth: true },
]

export default function Navbar() {
  const { user, logout, canManage } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🎾</span>
          <span className="logo-text">Tennis Club</span>
        </Link>

        <div className="navbar-links">
          {navLinks.map(({ to, label, auth }) => {
            if (auth && !user) return null
            return (
              <Link
                key={to}
                to={to}
                className={`nav-link ${location.pathname.startsWith(to) ? 'active' : ''}`}
              >
                {label}
              </Link>
            )
          })}
          {canManage() && (
            <Link
              to="/admin"
              className={`nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
            >
              Панель
            </Link>
          )}
        </div>

        <div className="navbar-actions">
          {user ? (
            <>
              <Link to="/profile" className="nav-avatar" title={user.email}>
                {user.email[0].toUpperCase()}
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">Вийти</button>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn btn-ghost btn-sm">Увійти</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Реєстрація</Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        .navbar {
          position: sticky; top: 0; z-index: 50;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--emerald-100);
        }
        .navbar-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 0 24px; height: 64px;
          display: flex; align-items: center; gap: 32px;
        }
        .navbar-logo {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; color: var(--emerald-900);
          font-weight: 600; letter-spacing: 0.5px;
          flex-shrink: 0;
        }
        .logo-icon { font-size: 22px; }
        .navbar-links {
          display: flex; align-items: center; gap: 4px; flex: 1;
        }
        .nav-link {
          padding: 6px 14px; border-radius: 6px;
          font-size: 14px; color: var(--gray-600);
          transition: all var(--transition);
          position: relative;
        }
        .nav-link:hover { color: var(--emerald-700); background: var(--emerald-50); }
        .nav-link.active { color: var(--emerald-800); background: var(--emerald-50); font-weight: 500; }
        .navbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .nav-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: var(--emerald-800); color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 600;
          transition: opacity var(--transition);
        }
        .nav-avatar:hover { opacity: 0.85; }
      `}</style>
    </nav>
  )
}
