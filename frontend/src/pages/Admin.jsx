import { useState, useEffect } from 'react'
import { authApi, clubApi, eventApi } from '../api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const TABS = ['Користувачі', 'Клуби', 'Корти', 'Події']

export default function Admin() {
  const [tab, setTab] = useState(0)
  const { isAdmin } = useAuthStore()

  return (
    <div className="page-wrapper">
      <div className="mb-8">
        <span className="page-eyebrow">Управління</span>
        <h1 className="section-title">Панель адміністратора</h1>
      </div>

      <div className="admin-tabs">
        {TABS.map((t, i) => (
          (i === 0 && !isAdmin()) ? null : (
            <button
              key={t}
              className={`admin-tab ${tab === i ? 'active' : ''}`}
              onClick={() => setTab(i)}
            >
              {t}
            </button>
          )
        ))}
      </div>

      <div className="admin-content">
        {tab === 0 && isAdmin() && <UsersTab />}
        {tab === 1 && <ClubsTab />}
        {tab === 2 && <CourtsTab />}
        {tab === 3 && <EventsTab />}
      </div>

      <style>{`
        .page-eyebrow { display:inline-block; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:var(--emerald-600); margin-bottom:12px; }
        .admin-tabs { display:flex; gap:4px; border-bottom:1px solid var(--gray-200); margin-bottom:32px; }
        .admin-tab {
          padding:12px 20px; font-size:14px; color:var(--gray-500);
          border-bottom:2px solid transparent; transition:all var(--transition);
          cursor:pointer; background:none; border-top:none; border-left:none; border-right:none;
          font-family:inherit;
        }
        .admin-tab:hover { color:var(--emerald-700); }
        .admin-tab.active { color:var(--emerald-800); border-bottom-color:var(--emerald-700); font-weight:500; }
        .admin-content { }
      `}</style>
    </div>
  )
}

/* ── Users Tab ── */
function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => authApi.listUsers()
    .then(r => setUsers(r.data))
    .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const activate = async (id) => {
    await authApi.activate(id)
    toast.success('Користувача активовано')
    load()
  }

  const roleLabel = { admin: '👑 Адмін', staff: '🔧 Персонал', client: '🎾 Клієнт' }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <h2 className="tab-heading">Користувачі ({users.length})</h2>
      <div className="data-table">
        <div className="table-header">
          <span>Email</span><span>Роль</span><span>Статус</span><span>Дія</span>
        </div>
        {users.map(u => (
          <div key={u.id} className="table-row">
            <span className="table-email">{u.email}</span>
            <span className="badge badge-gray">{roleLabel[u.role]}</span>
            <span className={`badge ${u.is_active ? 'badge-emerald' : 'badge-amber'}`}>
              {u.is_active ? 'Активний' : 'Очікує'}
            </span>
            {!u.is_active && (
              <button className="btn btn-primary btn-sm" onClick={() => activate(u.id)}>
                Активувати
              </button>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .tab-heading { font-family:'Cormorant Garamond',serif; font-size:26px; color:var(--emerald-900); margin-bottom:20px; }
        .data-table { border:1px solid var(--gray-200); border-radius:var(--radius); overflow:hidden; }
        .table-header { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:16px; padding:12px 20px; background:var(--emerald-50); font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--gray-400); }
        .table-row { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:16px; padding:14px 20px; border-top:1px solid var(--gray-100); align-items:center; font-size:14px; }
        .table-row:hover { background:var(--gray-50); }
        .table-email { color:var(--gray-800); font-size:13px; word-break:break-all; }
      `}</style>
    </div>
  )
}

/* ── Clubs Tab ── */
function ClubsTab() {
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', description: '', phone: '', email: '', image_url: '' })
  const [saving, setSaving] = useState(false)

  const load = () => clubApi.list().then(r => setClubs(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const create = async () => {
    setSaving(true)
    try {
      await clubApi.create(form)
      toast.success('Клуб створено')
      setShowForm(false)
      setForm({ name: '', address: '', description: '', phone: '', email: '', image_url: '' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Помилка')
    } finally {
      setSaving(false)
    }
  }

  const del = async (id) => {
    if (!confirm('Деактивувати клуб?')) return
    await clubApi.delete(id)
    toast.success('Клуб деактивовано')
    load()
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="tab-heading">Клуби ({clubs.length})</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Скасувати' : '+ Новий клуб'}
        </button>
      </div>

      {showForm && (
        <div className="admin-form card mb-6">
          <h3 className="admin-form-title">Новий клуб</h3>
          {[
            { key: 'name', label: "Назва", placeholder: "Tennis Club Захід" },
            { key: 'address', label: "Адреса", placeholder: "вул. Зелена, 1, Львів" },
            { key: 'description', label: "Опис", placeholder: "Опис клубу..." },
            { key: 'phone', label: "Телефон", placeholder: "+380 32 000-00-00" },
            { key: 'email', label: "Email", placeholder: "club@tennis.ua" },
            { key: 'image_url', label: "URL зображення", placeholder: "https://..." },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="form-group">
              <label className="label">{label}</label>
              <input className="input-field" placeholder={placeholder}
                value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
          <button className="btn btn-primary" onClick={create} disabled={saving || !form.name || !form.address}>
            {saving ? 'Створюємо...' : 'Створити клуб'}
          </button>
        </div>
      )}

      <div className="admin-cards">
        {clubs.map(club => (
          <div key={club.id} className="admin-club-row card">
            <div style={{ padding: '16px 20px' }} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{club.name}</div>
                <div className="text-sm text-muted">{club.address} · {club.courts?.length || 0} кортів</div>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ color: '#dc2626' }} onClick={() => del(club.id)}>
                Деактивувати
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .tab-heading { font-family:'Cormorant Garamond',serif; font-size:26px; color:var(--emerald-900); margin-bottom:0; }
        .admin-form { padding:28px; }
        .admin-form-title { font-family:'Cormorant Garamond',serif; font-size:22px; color:var(--emerald-900); margin-bottom:20px; }
        .admin-cards { display:flex; flex-direction:column; gap:12px; }
        .admin-club-row { }
      `}</style>
    </div>
  )
}

/* ── Courts Tab ── */
function CourtsTab() {
  const [clubs, setClubs] = useState([])
  const [selectedClub, setSelectedClub] = useState('')
  const [form, setForm] = useState({ name: '', surface: 'clay', is_indoor: false, price_per_hour: 200 })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => clubApi.list().then(r => setClubs(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const addCourt = async () => {
    if (!selectedClub) { toast.error('Оберіть клуб'); return }
    setSaving(true)
    try {
      await clubApi.addCourt(selectedClub, form)
      toast.success('Корт додано')
      setForm({ name: '', surface: 'clay', is_indoor: false, price_per_hour: 200 })
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Помилка')
    } finally {
      setSaving(false)
    }
  }

  const delCourt = async (clubId, courtId) => {
    await clubApi.deleteCourt(clubId, courtId)
    toast.success('Корт деактивовано')
    load()
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <h2 className="tab-heading mb-6">Управління кортами</h2>

      <div className="admin-form card mb-6">
        <h3 className="admin-form-title">Додати корт</h3>
        <div className="form-group">
          <label className="label">Клуб</label>
          <select className="input-field" value={selectedClub} onChange={e => setSelectedClub(e.target.value)}>
            <option value="">Оберіть клуб</option>
            {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Назва корту</label>
          <input className="input-field" placeholder="Корт A1" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid-2-sm" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
          <div>
            <label className="label">Покриття</label>
            <select className="input-field" value={form.surface} onChange={e => setForm({ ...form, surface: e.target.value })}>
              <option value="clay">Глина</option>
              <option value="hard">Хард</option>
              <option value="grass">Трава</option>
              <option value="indoor">Критий</option>
            </select>
          </div>
          <div>
            <label className="label">Ціна (грн/год)</label>
            <input className="input-field" type="number" value={form.price_per_hour}
              onChange={e => setForm({ ...form, price_per_hour: parseFloat(e.target.value) })} />
          </div>
        </div>
        <div className="form-group" style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input type="checkbox" id="indoor" checked={form.is_indoor}
            onChange={e => setForm({ ...form, is_indoor: e.target.checked })} />
          <label htmlFor="indoor" className="label" style={{ margin:0 }}>Критий корт</label>
        </div>
        <button className="btn btn-primary" onClick={addCourt} disabled={saving || !form.name}>
          {saving ? 'Додаємо...' : 'Додати корт'}
        </button>
      </div>

      {clubs.map(club => (
        <div key={club.id} className="mb-6">
          <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:20, color:'var(--emerald-900)', marginBottom:12 }}>
            {club.name}
          </h3>
          <div className="data-table">
            <div className="court-table-header">
              <span>Назва</span><span>Покриття</span><span>Ціна</span><span>Дія</span>
            </div>
            {(club.courts || []).filter(c => c.is_active).map(court => (
              <div key={court.id} className="court-table-row">
                <span>{court.name}</span>
                <span className="text-sm">{court.surface}</span>
                <span>{court.price_per_hour} грн/год</span>
                <button className="btn btn-ghost btn-sm" style={{ color:'#dc2626' }}
                  onClick={() => delCourt(club.id, court.id)}>
                  Видалити
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <style>{`
        .tab-heading { font-family:'Cormorant Garamond',serif; font-size:26px; color:var(--emerald-900); }
        .admin-form { padding:28px; }
        .admin-form-title { font-family:'Cormorant Garamond',serif; font-size:22px; color:var(--emerald-900); margin-bottom:20px; }
        .data-table { border:1px solid var(--gray-200); border-radius:var(--radius); overflow:hidden; }
        .court-table-header { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:16px; padding:12px 20px; background:var(--emerald-50); font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--gray-400); }
        .court-table-row { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:16px; padding:14px 20px; border-top:1px solid var(--gray-100); align-items:center; font-size:14px; }
        .court-table-row:hover { background:var(--gray-50); }
      `}</style>
    </div>
  )
}

/* ── Events Tab ── */
function EventsTab() {
  const [events, setEvents] = useState([])
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', event_type: 'tournament',
    club_id: '', start_time: '', end_time: '',
    max_participants: '', price: 0, image_url: '',
  })

  const load = async () => {
    const [ev, cl] = await Promise.all([eventApi.list(), clubApi.list()])
    setEvents(ev.data)
    setClubs(cl.data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    setSaving(true)
    try {
      await eventApi.create({
        ...form,
        club_id: parseInt(form.club_id),
        max_participants: form.max_participants ? parseInt(form.max_participants) : null,
        price: parseFloat(form.price) || 0,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      })
      toast.success('Подію створено')
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Помилка')
    } finally {
      setSaving(false)
    }
  }

  const del = async (id) => {
    if (!confirm('Видалити подію?')) return
    await eventApi.delete(id)
    toast.success('Подію видалено')
    load()
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="tab-heading">Події ({events.length})</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Скасувати' : '+ Нова подія'}
        </button>
      </div>

      {showForm && (
        <div className="admin-form card mb-6">
          <h3 className="admin-form-title">Нова подія</h3>
          <div className="form-group">
            <label className="label">Назва</label>
            <input className="input-field" placeholder="Літній турнір"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Опис</label>
            <textarea className="input-field" rows={2} placeholder="Опис події..."
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div className="form-group">
              <label className="label">Тип</label>
              <select className="input-field" value={form.event_type}
                onChange={e => setForm({ ...form, event_type: e.target.value })}>
                <option value="tournament">Турнір</option>
                <option value="training">Тренування</option>
                <option value="open_play">Відкрита гра</option>
                <option value="other">Інше</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Клуб</label>
              <select className="input-field" value={form.club_id}
                onChange={e => setForm({ ...form, club_id: e.target.value })}>
                <option value="">Оберіть клуб</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Початок</label>
              <input className="input-field" type="datetime-local"
                value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Кінець</label>
              <input className="input-field" type="datetime-local"
                value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Макс. учасників</label>
              <input className="input-field" type="number" placeholder="32"
                value={form.max_participants} onChange={e => setForm({ ...form, max_participants: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Вартість (грн)</label>
              <input className="input-field" type="number" placeholder="0"
                value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">URL зображення</label>
            <input className="input-field" placeholder="https://..."
              value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={create}
            disabled={saving || !form.title || !form.club_id || !form.start_time || !form.end_time}>
            {saving ? 'Створюємо...' : 'Створити подію'}
          </button>
        </div>
      )}

      <div className="admin-cards">
        {events.map(ev => (
          <div key={ev.id} className="card" style={{ padding:'16px 20px' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{ev.title}</div>
                <div className="text-sm text-muted">
                  {ev.participant_count}/{ev.max_participants || '∞'} учасників · {ev.price > 0 ? `${ev.price} грн` : 'Безкоштовно'}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ color:'#dc2626' }} onClick={() => del(ev.id)}>
                Видалити
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .tab-heading { font-family:'Cormorant Garamond',serif; font-size:26px; color:var(--emerald-900); margin-bottom:0; }
        .admin-form { padding:28px; }
        .admin-form-title { font-family:'Cormorant Garamond',serif; font-size:22px; color:var(--emerald-900); margin-bottom:20px; }
        .admin-cards { display:flex; flex-direction:column; gap:12px; }
      `}</style>
    </div>
  )
}
