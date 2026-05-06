import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authApi.login(form)
      login(data.access_token, data.role, form.email)
      toast.success('Ласкаво просимо!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Невірні дані')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">🎾</span>
          <h1>Увійти</h1>
          <p>Ласкаво просимо назад</p>
        </div>
        <form onSubmit={handle}>
          <div className="form-group">
            <label className="label">Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Пароль</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Входимо...' : 'Увійти'}
          </button>
        </form>
        <p className="auth-footer">
          Немає акаунту? <Link to="/register">Зареєструватись</Link>
        </p>
        <div className="auth-hint">
          <p className="text-xs text-muted" style={{ marginBottom: 6 }}>Тестові акаунти:</p>
          <p className="text-xs text-muted">👑 admin@tennis.com / Admin123!</p>
          <p className="text-xs text-muted">🔧 staff@tennis.com / Staff123!</p>
          <p className="text-xs text-muted">🎾 client@tennis.com / Client123!</p>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: calc(100vh - 64px);
          display: flex; align-items: center; justify-content: center;
          padding: 40px 24px;
          background: linear-gradient(160deg, var(--emerald-50) 0%, white 60%);
        }
        .auth-card {
          background: white; border-radius: var(--radius);
          border: 1px solid var(--emerald-100);
          padding: 48px 40px; width: 100%; max-width: 420px;
          box-shadow: var(--shadow-lg);
        }
        .auth-header { text-align: center; margin-bottom: 36px; }
        .auth-logo { font-size: 40px; display: block; margin-bottom: 12px; }
        .auth-header h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px; font-weight: 400;
          color: var(--emerald-900); margin-bottom: 6px;
        }
        .auth-header p { color: var(--gray-400); font-size: 14px; }
        .auth-footer {
          text-align: center; margin-top: 24px;
          font-size: 14px; color: var(--gray-600);
        }
        .auth-footer a { color: var(--emerald-700); font-weight: 500; }
        .auth-hint {
          margin-top: 24px; padding: 16px;
          background: var(--emerald-50); border-radius: var(--radius-sm);
          border: 1px solid var(--emerald-100);
        }
      `}</style>
    </div>
  )
}
