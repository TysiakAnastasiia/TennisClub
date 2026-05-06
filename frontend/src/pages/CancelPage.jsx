import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'

export default function CancelPage() {
  const { token } = useParams()
  const [status, setStatus] = useState('loading') // loading | success | error

  useEffect(() => {
    api.get(`/auth/cancel/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <div className="loading-center"><div className="spinner" /></div>
            <p style={{ color: 'var(--gray-400)', marginTop: 16 }}>Скасовуємо реєстрацію...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: 32, color: 'var(--emerald-900)', marginBottom: 12 }}>
              Реєстрацію скасовано
            </h2>
            <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: 24 }}>
              Ваш акаунт було успішно видалено. Якщо це сталося помилково — зареєструйтесь знову.
            </p>
            <Link to="/register" className="btn btn-primary">Зареєструватись знову</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 20 }}>❌</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: 32, color: 'var(--emerald-900)', marginBottom: 12 }}>
              Посилання недійсне
            </h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: 24 }}>
              Можливо, реєстрацію вже скасовано або посилання застаріло.
            </p>
            <Link to="/" className="btn btn-outline">На головну</Link>
          </>
        )}
      </div>

      <style>{`
        .auth-page { min-height:calc(100vh - 64px); display:flex; align-items:center; justify-content:center; padding:40px 24px; background:linear-gradient(160deg,var(--emerald-50) 0%,white 60%); }
        .auth-card { background:white; border-radius:var(--radius); border:1px solid var(--emerald-100); padding:48px 40px; width:100%; max-width:420px; box-shadow:var(--shadow-lg); }
      `}</style>
    </div>
  )
}
