import { useState, useEffect } from 'react'
import { eventApi } from '../api'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'

const typeLabel = { tournament: '🏆 Турнір', training: '🎯 Тренування', open_play: '🎾 Відкрита гра', other: '📌 Інше' }
const typeBadge = { tournament: 'badge-amber', training: 'badge-emerald', open_play: 'badge-gray', other: 'badge-gray' }

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const { user, canManage } = useAuthStore()
  const navigate = useNavigate()

  const load = () => {
    eventApi.list()
      .then(r => setEvents(r.data))
      .catch(() => toast.error('Не вдалося завантажити події'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleRegister = async (event) => {
    if (!user) { navigate('/login'); return }
    try {
      await eventApi.register(event.id)
      toast.success('Ви зареєстровані на подію!')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Помилка реєстрації')
    }
  }

  const handleUnregister = async (event) => {
    try {
      await eventApi.unregister(event.id)
      toast.success('Реєстрацію скасовано')
      load()
    } catch {
      toast.error('Помилка')
    }
  }

  const types = ['all', ...new Set(events.map(e => e.event_type))]
  const filtered = filter === 'all' ? events : events.filter(e => e.event_type === filter)

  if (loading) return (
    <div className="page-wrapper"><div className="loading-center"><div className="spinner" /></div></div>
  )

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <span className="page-eyebrow">Розклад</span>
          <h1 className="section-title">Події та турніри</h1>
        </div>
        {canManage() && (
          <button className="btn btn-primary" onClick={() => navigate('/admin')}>
            + Додати подію
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs mb-6">
        {types.map(t => (
          <button
            key={t}
            className={`filter-tab ${filter === t ? 'active' : ''}`}
            onClick={() => setFilter(t)}
          >
            {t === 'all' ? 'Всі' : typeLabel[t]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><p>Подій не знайдено</p></div>
      ) : (
        <div className="events-grid">
          {filtered.map(event => (
            <EventCard
              key={event.id}
              event={event}
              user={user}
              onRegister={() => handleRegister(event)}
              onUnregister={() => handleUnregister(event)}
            />
          ))}
        </div>
      )}

      <style>{`
        .page-eyebrow { display:inline-block; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:var(--emerald-600); margin-bottom:12px; }
        .filter-tabs { display:flex; gap:8px; flex-wrap:wrap; }
        .filter-tab {
          padding:8px 18px; border-radius:99px; font-size:13px;
          border:1.5px solid var(--gray-200); color:var(--gray-600);
          background:white; transition:all var(--transition); cursor:pointer;
        }
        .filter-tab:hover { border-color:var(--emerald-300); color:var(--emerald-700); }
        .filter-tab.active { background:var(--emerald-800); color:white; border-color:var(--emerald-800); }
        .events-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:24px; }
      `}</style>
    </div>
  )
}

function EventCard({ event, user, onRegister, onUnregister }) {
  const isFull = event.max_participants && event.participant_count >= event.max_participants
  const start = new Date(event.start_time)

  return (
    <div className="event-card card">
      {event.image_url && (
        <div className="event-img-wrap">
          <img src={event.image_url} alt={event.title} className="event-img" />
          <div className="event-img-overlay" />
          <span className={`badge ${typeBadge[event.event_type]} event-type-badge`}>
            {typeLabel[event.event_type]}
          </span>
        </div>
      )}
      <div className="event-body">
        {!event.image_url && (
          <span className={`badge ${typeBadge[event.event_type]} mb-2`}>
            {typeLabel[event.event_type]}
          </span>
        )}
        <h3 className="event-title">{event.title}</h3>
        {event.description && <p className="event-desc">{event.description}</p>}

        <div className="event-meta">
          <div className="event-meta-item">
            <span className="event-meta-icon">📅</span>
            <span>{format(start, 'd MMMM, HH:mm', { locale: uk })}</span>
          </div>
          {event.max_participants && (
            <div className="event-meta-item">
              <span className="event-meta-icon">👥</span>
              <span>{event.participant_count}/{event.max_participants} учасників</span>
            </div>
          )}
          {event.price > 0 && (
            <div className="event-meta-item">
              <span className="event-meta-icon">💰</span>
              <span>{event.price} грн</span>
            </div>
          )}
          {event.price === 0 && (
            <div className="event-meta-item">
              <span className="event-meta-icon">🎁</span>
              <span>Безкоштовно</span>
            </div>
          )}
        </div>

        {isFull ? (
          <div className="badge badge-red w-full" style={{ justifyContent:'center', padding:'10px' }}>
            Місця закінчились
          </div>
        ) : user ? (
          <button className="btn btn-primary w-full" onClick={onRegister}>
            Зареєструватись
          </button>
        ) : (
          <button className="btn btn-outline w-full" onClick={onRegister}>
            Увійти для реєстрації
          </button>
        )}
      </div>

      <style>{`
        .event-card { display:flex; flex-direction:column; }
        .event-img-wrap { position:relative; height:180px; overflow:hidden; flex-shrink:0; }
        .event-img { width:100%; height:100%; object-fit:cover; transition:transform 0.4s ease; }
        .event-card:hover .event-img { transform:scale(1.04); }
        .event-img-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(2,44,34,0.5) 0%,transparent 50%); }
        .event-type-badge { position:absolute; top:12px; left:12px; }
        .event-body { padding:24px; display:flex; flex-direction:column; gap:12px; flex:1; }
        .event-title { font-family:'Cormorant Garamond',serif; font-size:22px; color:var(--emerald-900); }
        .event-desc { font-size:13px; color:var(--gray-600); line-height:1.55; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .event-meta { display:flex; flex-direction:column; gap:6px; }
        .event-meta-item { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--gray-600); }
        .event-meta-icon { font-size:14px; }
      `}</style>
    </div>
  )
}
