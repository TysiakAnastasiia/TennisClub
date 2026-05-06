import { useState, useEffect } from 'react'
import { userApi } from '../api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, logout } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    userApi.me()
      .then(r => { setProfile(r.data); setForm(r.data) })
      .catch(() => toast.error('Не вдалося завантажити профіль'))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await userApi.update({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        bio: form.bio,
      })
      setProfile(data)
      setEditing(false)
      toast.success('Профіль оновлено')
    } catch {
      toast.error('Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  const roleLabel = { admin: '👑 Адміністратор', staff: '🔧 Працівник', client: '🎾 Клієнт' }

  if (loading) return (
    <div className="page-wrapper"><div className="loading-center"><div className="spinner" /></div></div>
  )

  return (
    <div className="page-wrapper" style={{ maxWidth: 680 }}>
      <div className="mb-8">
        <span className="page-eyebrow">Особистий кабінет</span>
        <h1 className="section-title">Профіль</h1>
      </div>

      <div className="profile-card card">
        {/* Avatar + role */}
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="profile-name">
              {profile?.first_name || profile?.last_name
                ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                : 'Без імені'}
            </div>
            <div className="profile-email">{user?.email}</div>
            <span className="badge badge-emerald mt-2">{roleLabel[user?.role]}</span>
          </div>
        </div>

        <div className="divider" />

        {editing ? (
          <div className="profile-form">
            <div className="grid-2-sm">
              <div className="form-group">
                <label className="label">Ім'я</label>
                <input
                  className="input-field"
                  value={form.first_name || ''}
                  onChange={e => setForm({ ...form, first_name: e.target.value })}
                  placeholder="Олена"
                />
              </div>
              <div className="form-group">
                <label className="label">Прізвище</label>
                <input
                  className="input-field"
                  value={form.last_name || ''}
                  onChange={e => setForm({ ...form, last_name: e.target.value })}
                  placeholder="Коваленко"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Телефон</label>
              <input
                className="input-field"
                value={form.phone || ''}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+380 00 000-00-00"
              />
            </div>
            <div className="form-group">
              <label className="label">Про себе</label>
              <textarea
                className="input-field"
                rows={3}
                value={form.bio || ''}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                placeholder="Граю теніс з 2018 року..."
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="flex gap-3">
              <button className="btn btn-outline" onClick={() => setEditing(false)}>Скасувати</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Зберігаємо...' : 'Зберегти'}
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-info">
            {[
              { label: 'Ім\'я', value: [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—' },
              { label: 'Телефон', value: profile?.phone || '—' },
              { label: 'Про себе', value: profile?.bio || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="profile-field">
                <span className="profile-field-label">{label}</span>
                <span className="profile-field-value">{value}</span>
              </div>
            ))}
            <button className="btn btn-outline mt-4" onClick={() => setEditing(true)}>
              Редагувати профіль
            </button>
          </div>
        )}
      </div>

      <button
        className="btn btn-ghost mt-6"
        style={{ color: '#dc2626' }}
        onClick={logout}
      >
        Вийти з акаунту
      </button>

      <style>{`
        .page-eyebrow { display:inline-block; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:var(--emerald-600); margin-bottom:12px; }
        .profile-card { padding: 36px; }
        .profile-header { display:flex; align-items:center; gap:24px; margin-bottom:24px; }
        .profile-avatar {
          width:80px; height:80px; border-radius:50%;
          background:linear-gradient(135deg, var(--emerald-700), var(--emerald-500));
          color:white; font-size:32px; font-family:'Cormorant Garamond',serif;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .profile-name { font-family:'Cormorant Garamond',serif; font-size:26px; color:var(--emerald-900); }
        .profile-email { font-size:14px; color:var(--gray-400); margin-top:2px; }
        .profile-form { }
        .grid-2-sm { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .profile-info { display:flex; flex-direction:column; gap:0; }
        .profile-field {
          display:flex; justify-content:space-between; align-items:flex-start;
          padding:14px 0; border-bottom:1px solid var(--gray-100);
        }
        .profile-field:last-of-type { border-bottom:none; }
        .profile-field-label { font-size:12px; letter-spacing:1px; text-transform:uppercase; color:var(--gray-400); }
        .profile-field-value { font-size:14px; color:var(--gray-800); text-align:right; max-width:60%; }
      `}</style>
    </div>
  )
}
