import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // role is always client for public registration - admin sets roles
      await authApi.register({ email: form.email, password: form.password })
      setDone(true)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Помилка реєстрації')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>📧</div>
        <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: 32, color: 'var(--emerald-900)', marginBottom: 12 }}>
          Перевірте пошту
        </h2>
        <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: 24 }}>
          Ми надіслали лист на <strong>{form.email}</strong>.<br/>
          Якщо це були не ви — скористайтеся посиланням у листі щоб скасувати реєстрацію.
        </p>
        <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>
          Акаунт буде активовано після підтвердження адміністратором.
        </p>
        <button className="btn btn-outline w-full mt-4" style={{ justifyContent:'center' }} onClick={() => navigate('/login')}>
          Повернутись до входу
        </button>
      </div>
      <style>{STYLES}</style>
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">🎾</span>
          <h1>Реєстрація</h1>
          <p>Приєднайтесь до Tennis Club</p>
        </div>
        <form onSubmit={handle}>
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input-field" type="email" placeholder="your@email.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="label">Пароль</label>
            <div className="pw-wrap">
              <input className="input-field" type={showPw ? 'text' : 'password'}
                placeholder="мінімум 6 символів"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required minLength={6}
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className="register-note">
            ℹ️ Роль клієнта призначається автоматично. Адміністратор може змінити роль після активації акаунту.
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading}
            style={{ justifyContent: 'center' }}>
            {loading ? 'Реєструємо...' : 'Зареєструватись'}
          </button>
        </form>
        <p className="auth-footer">
          Вже є акаунт? <Link to="/login">Увійти</Link>
        </p>
      </div>
      <style>{STYLES}</style>
    </div>
  )
}

const STYLES = `
  .auth-page { min-height:calc(100vh - 64px); display:flex; align-items:center; justify-content:center; padding:40px 24px; background:linear-gradient(160deg,var(--emerald-50) 0%,white 60%); }
  .auth-card { background:white; border-radius:var(--radius); border:1px solid var(--emerald-100); padding:48px 40px; width:100%; max-width:420px; box-shadow:var(--shadow-lg); }
  .auth-header { text-align:center; margin-bottom:36px; }
  .auth-logo { font-size:40px; display:block; margin-bottom:12px; }
  .auth-header h1 { font-family:'Cormorant Garamond',serif; font-size:36px; font-weight:400; color:var(--emerald-900); margin-bottom:6px; }
  .auth-header p { color:var(--gray-400); font-size:14px; }
  .auth-footer { text-align:center; margin-top:24px; font-size:14px; color:var(--gray-600); }
  .auth-footer a { color:var(--emerald-700); font-weight:500; }
  .pw-wrap { position:relative; }
  .pw-wrap .input-field { padding-right: 44px; }
  .pw-toggle { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:16px; padding:2px; line-height:1; }
  .register-note { font-size:12px; color:var(--gray-400); background:var(--emerald-50); border-radius:var(--radius-sm); padding:10px 12px; margin-bottom:20px; line-height:1.5; }
`
