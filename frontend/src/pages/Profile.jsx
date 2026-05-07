import { useState, useEffect, useRef } from 'react'
import { userApi, clubApi } from '../api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Profile() {
  const { user, logout } = useAuthStore()
  const [profile, setProfile]       = useState(null)
  const [memberships, setMemberships] = useState([])
  const [clubs, setClubs]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [editing, setEditing]       = useState(false)
  const [form, setForm]             = useState({})
  const [saving, setSaving]         = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(null)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const fileRef = useRef(null)

  const load = async () => {
    const [pRes, mRes, cRes] = await Promise.all([
      userApi.me(),
      userApi.getMembership(),
      clubApi.list(),
    ])
    setProfile(pRes.data)
    setForm(pRes.data)
    setMemberships(mRes.data)
    setClubs(cRes.data.filter(c => c.is_active))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await userApi.update({
        first_name: form.first_name,
        last_name:  form.last_name,
        phone:      form.phone,
        bio:        form.bio,
        avatar_url: form.avatar_url,
      })
      setProfile(data)
      setEditing(false)
      toast.success('Профіль оновлено')
    } catch {
      toast.error('Помилка збереження')
    } finally { setSaving(false) }
  }

  // Simulate avatar upload: convert to base64 data URL (in real app — S3)
  const handleAvatar = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Файл занадто великий (макс 5MB)'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setForm(f => ({ ...f, avatar_url: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const joinClub = async (club) => {
    try {
      await userApi.joinClub(club.id, { club_name: club.name })
      toast.success(`Ви стали учасником «${club.name}»! 🎾`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Помилка')
    }
  }

  const leaveClub = async () => {
    try {
      await userApi.leaveClub(confirmLeave.club_id)
      toast.success('Ви покинули клуб')
      setConfirmLeave(null)
      load()
    } catch { toast.error('Помилка') }
  }

  const roleLabel = { admin: '👑 Адміністратор', staff: '🔧 Працівник', client: '🎾 Клієнт' }

  if (loading) return (
    <div className="page-wrapper"><div className="loading-center"><div className="spinner" /></div></div>
  )

  const memberClubIds = new Set(memberships.map(m => m.club_id))
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Без імені'

  return (
    <div className="page-wrapper" style={{ maxWidth: 720 }}>
      {confirmLeave && (
        <ConfirmDialog
          title="Покинути клуб?"
          message={`Ви хочете відмовитись від членства в «${confirmLeave.club_name}»?`}
          confirmLabel="Покинути"
          confirmClass="btn-danger"
          onConfirm={leaveClub}
          onCancel={() => setConfirmLeave(null)}
        />
      )}
      {confirmLogout && (
        <ConfirmDialog
          title="Вийти з акаунту?"
          message="Ви впевнені що хочете вийти?"
          confirmLabel="Вийти"
          confirmClass="btn-danger"
          onConfirm={() => { logout(); window.location.href = '/' }}
          onCancel={() => setConfirmLogout(false)}
        />
      )}

      <div className="mb-8">
        <span className="page-eyebrow">Особистий кабінет</span>
        <h1 className="section-title">Профіль</h1>
      </div>

      {/* Profile card */}
      <div className="profile-card card mb-6">
        <div className="profile-header">
          {/* Avatar */}
          <div className="avatar-wrap">
            {(editing ? form.avatar_url : profile?.avatar_url)
              ? <img src={editing ? form.avatar_url : profile.avatar_url} alt="avatar" className="profile-avatar-img" />
              : <div className="profile-avatar-placeholder">{user?.email?.[0]?.toUpperCase()}</div>
            }
            {editing && (
              <>
                <button className="avatar-edit-btn" onClick={() => fileRef.current?.click()}>
                  📷
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatar} />
              </>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div className="profile-name">{displayName}</div>
            <div className="profile-email">{user?.email}</div>
            <span className="badge badge-emerald mt-2">{roleLabel[user?.role]}</span>

            {/* Memberships shown under name */}
            {memberships.length > 0 && (
              <div className="membership-tags">
                {memberships.map(m => (
                  <div key={m.id} className="membership-tag">
                    🎾 {m.club_name}
                    <span className="membership-date">з {new Date(m.joined_at).toLocaleDateString('uk-UA', { day:'numeric', month:'long', year:'numeric' })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="divider" />

        {editing ? (
          <div className="profile-form">
            <div className="grid-2-sm">
              <div className="form-group">
                <label className="label">Ім'я</label>
                <input className="input-field" value={form.first_name || ''} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="Олена" />
              </div>
              <div className="form-group">
                <label className="label">Прізвище</label>
                <input className="input-field" value={form.last_name || ''} onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="Коваленко" />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Телефон</label>
              <input className="input-field" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+380 00 000-00-00" />
            </div>
            <div className="form-group">
              <label className="label">Про себе</label>
              <textarea className="input-field" rows={3} value={form.bio || ''} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Граю теніс з 2018 року..." style={{ resize:'vertical' }} />
            </div>
            <div className="form-group">
              <label className="label">URL аватара (або завантажте фото вище)</label>
              <input className="input-field" value={form.avatar_url || ''} onChange={e => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex gap-3">
              <button className="btn btn-outline" onClick={() => { setEditing(false); setForm(profile) }}>Скасувати</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Зберігаємо...' : 'Зберегти'}</button>
            </div>
          </div>
        ) : (
          <div className="profile-info">
            {[
              { label: "Ім'я", value: displayName },
              { label: 'Телефон', value: profile?.phone || '—' },
              { label: 'Про себе', value: profile?.bio || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="profile-field">
                <span className="profile-field-label">{label}</span>
                <span className="profile-field-value">{value}</span>
              </div>
            ))}
            <button className="btn btn-outline mt-4" onClick={() => setEditing(true)}>Редагувати профіль</button>
          </div>
        )}
      </div>

      {/* Club membership */}
      <div className="card mb-6" style={{ padding: 28 }}>
        <h3 className="membership-heading">Членство в клубах</h3>
        {memberships.length > 0 && (
          <div className="membership-list mb-4">
            {memberships.map(m => (
              <div key={m.id} className="membership-row">
                <div>
                  <div className="font-medium">🎾 {m.club_name}</div>
                  <div className="text-sm text-muted">
                    Учасник з {new Date(m.joined_at).toLocaleDateString('uk-UA', { day:'numeric', month:'long', year:'numeric' })}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ color:'#dc2626' }} onClick={() => setConfirmLeave(m)}>
                  Покинути
                </button>
              </div>
            ))}
          </div>
        )}

        <h4 className="available-clubs-h">Доступні клуби</h4>
        <div className="available-clubs">
          {clubs.filter(c => !memberClubIds.has(c.id)).map(club => (
            <div key={club.id} className="available-club-row">
              <div>
                <div className="font-medium">{club.name}</div>
                <div className="text-sm text-muted">{club.address}</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => joinClub(club)}>
                Стати учасником
              </button>
            </div>
          ))}
          {clubs.filter(c => !memberClubIds.has(c.id)).length === 0 && (
            <p className="text-sm text-muted">Ви є учасником усіх доступних клубів!</p>
          )}
        </div>
      </div>

      <button className="btn btn-ghost" style={{ color:'#dc2626' }} onClick={() => setConfirmLogout(true)}>
        Вийти з акаунту
      </button>

      <style>{`
        .page-eyebrow { display:inline-block; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:var(--emerald-600); margin-bottom:12px; }
        .profile-card { padding:36px; }
        .profile-header { display:flex; align-items:flex-start; gap:24px; margin-bottom:24px; }
        .avatar-wrap { position:relative; flex-shrink:0; }
        .profile-avatar-img { width:88px; height:88px; border-radius:50%; object-fit:cover; border:3px solid var(--emerald-100); }
        .profile-avatar-placeholder { width:88px; height:88px; border-radius:50%; background:linear-gradient(135deg,var(--emerald-700),var(--emerald-500)); color:white; font-size:36px; font-family:'Cormorant Garamond',serif; display:flex; align-items:center; justify-content:center; }
        .avatar-edit-btn { position:absolute; bottom:0; right:0; width:28px; height:28px; border-radius:50%; background:var(--emerald-800); color:white; border:2px solid white; display:flex; align-items:center; justify-content:center; font-size:13px; cursor:pointer; transition:background var(--transition); }
        .avatar-edit-btn:hover { background:var(--emerald-700); }
        .profile-name { font-family:'Cormorant Garamond',serif; font-size:26px; color:var(--emerald-900); }
        .profile-email { font-size:14px; color:var(--gray-400); margin-top:2px; }
        .membership-tags { display:flex; flex-direction:column; gap:4px; margin-top:10px; }
        .membership-tag { display:inline-flex; align-items:center; gap:8px; font-size:12px; color:var(--emerald-800); background:var(--emerald-50); border:1px solid var(--emerald-200); border-radius:99px; padding:4px 12px; width:fit-content; }
        .membership-date { font-size:11px; color:var(--emerald-600); }
        .grid-2-sm { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .profile-info { display:flex; flex-direction:column; }
        .profile-field { display:flex; justify-content:space-between; align-items:flex-start; padding:14px 0; border-bottom:1px solid var(--gray-100); }
        .profile-field:last-of-type { border-bottom:none; }
        .profile-field-label { font-size:12px; letter-spacing:1px; text-transform:uppercase; color:var(--gray-400); }
        .profile-field-value { font-size:14px; color:var(--gray-800); text-align:right; max-width:60%; }
        .membership-heading { font-family:'Cormorant Garamond',serif; font-size:24px; color:var(--emerald-900); margin-bottom:16px; }
        .membership-list { display:flex; flex-direction:column; gap:10px; }
        .membership-row { display:flex; align-items:center; justify-content:space-between; padding:14px; background:var(--emerald-50); border-radius:var(--radius-sm); border:1px solid var(--emerald-100); }
        .available-clubs-h { font-size:13px; text-transform:uppercase; letter-spacing:1.5px; color:var(--gray-400); margin-bottom:12px; margin-top:20px; }
        .available-clubs { display:flex; flex-direction:column; gap:10px; }
        .available-club-row { display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--gray-100); }
        .available-club-row:last-child { border-bottom:none; }
      `}</style>
    </div>
  )
}
