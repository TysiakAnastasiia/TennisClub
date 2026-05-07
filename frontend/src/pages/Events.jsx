import { useState, useEffect } from 'react'
import { eventApi } from '../api'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import ConfirmDialog from '../components/ConfirmDialog'

const typeLabel = { tournament: '🏆 Турнір', training: '🎯 Тренування', open_play: '🎾 Відкрита гра', other: '📌 Інше' }
const typeBadge = { tournament: 'badge-amber', training: 'badge-emerald', open_play: 'badge-gray', other: 'badge-gray' }

export default function Events() {
  const [events, setEvents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const [selected, setSelected]   = useState(null) // event detail modal
  const { user, canManage }       = useAuthStore()
  const navigate                  = useNavigate()

  const [myEvents, setMyEvents] = useState([])

  const load = () => {
    eventApi.list()
      .then(r => setEvents(r.data))
      .catch(() => toast.error('Не вдалося завантажити події'))
      .finally(() => setLoading(false))
  }

  const loadMyEvents = () => {
    if (user) {
      eventApi.myRegistrations()
        .then(r => setMyEvents(r.data))
        .catch(() => {})
    }
  }

  useEffect(() => { load(); loadMyEvents() }, [])

  const handleRegister = async (event) => {
    if (!user) { navigate('/login'); return }
    try {
      await eventApi.register(event.id)
      toast.success('Ви зареєстровані! Підтвердження надіслано на email 📧')
      setSelected(null)
      load()
      loadMyEvents()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Помилка реєстрації')
    }
  }

  const types = ['all', ...new Set(events.map(e => e.event_type))]
  const filtered = filter === 'all' ? events : events.filter(e => e.event_type === filter)

  if (loading) return <div className="page-wrapper"><div className="loading-center"><div className="spinner" /></div></div>

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <span className="page-eyebrow">Розклад</span>
          <h1 className="section-title">Події та турніри</h1>
        </div>
        {canManage() && (
          <button className="btn btn-primary" onClick={() => navigate('/admin?tab=events')}>
            + Додати подію
          </button>
        )}
      </div>

      <div className="filter-tabs mb-6">
        {types.map(t => (
          <button key={t} className={`filter-tab ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
            {t === 'all' ? 'Всі' : typeLabel[t]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><p>Подій не знайдено</p></div>
      ) : (
        <div className="events-grid">
          {filtered.map(event => (
            <EventCard key={event.id} event={event} user={user}
              onClick={() => setSelected(event)}
              onRegister={() => handleRegister(event)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <EventDetailModal
          event={selected}
          user={user}
          isRegistered={myEvents.some(r => r.event_id === selected.id)}
          onClose={() => setSelected(null)}
          onRegister={() => handleRegister(selected)}
          onUnregister={async () => {
            try {
              await eventApi.unregister(selected.id)
              toast.success('Реєстрацію скасовано')
              setSelected(null)
              load()
              loadMyEvents()
            } catch { toast.error('Помилка') }
          }}
        />
      )}

      <style>{`
        .page-eyebrow { display:inline-block; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:var(--emerald-600); margin-bottom:12px; }
        .filter-tabs { display:flex; gap:8px; flex-wrap:wrap; }
        .filter-tab { padding:8px 18px; border-radius:99px; font-size:13px; border:1.5px solid var(--gray-200); color:var(--gray-600); background:white; transition:all var(--transition); cursor:pointer; }
        .filter-tab:hover { border-color:var(--emerald-300); color:var(--emerald-700); }
        .filter-tab.active { background:var(--emerald-800); color:white; border-color:var(--emerald-800); }
        .events-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:24px; }
      `}</style>
    </div>
  )
}

function EventCard({ event, user, onClick, onRegister }) {
  const isFull = event.max_participants && event.participant_count >= event.max_participants
  const start  = new Date(event.start_time)

  return (
    <div className="event-card card" style={{ cursor: 'pointer' }} onClick={onClick}>
      {event.image_url && (
        <div className="event-img-wrap">
          <img src={event.image_url} alt={event.title} className="event-img" />
          <div className="event-img-overlay" />
          <span className={`badge ${typeBadge[event.event_type]} event-type-badge`}>{typeLabel[event.event_type]}</span>
        </div>
      )}
      <div className="event-body">
        {!event.image_url && <span className={`badge ${typeBadge[event.event_type]} mb-2`}>{typeLabel[event.event_type]}</span>}
        <h3 className="event-title">{event.title}</h3>
        {event.description && <p className="event-desc">{event.description}</p>}
        <div className="event-meta">
          <div className="event-meta-item">📅 {format(start, 'd MMMM, HH:mm', { locale: uk })}</div>
          {event.max_participants && (
            <div className="event-meta-item">👥 {event.participant_count}/{event.max_participants} учасників</div>
          )}
          <div className="event-meta-item">{event.price > 0 ? `💰 ${event.price} грн` : '🎁 Безкоштовно'}</div>
        </div>
        <button className="btn btn-outline w-full mt-2" style={{ justifyContent:'center' }}
          onClick={e => { e.stopPropagation(); onClick() }}>
          Детальніше →
        </button>
      </div>
      <style>{`
        .event-card { display:flex; flex-direction:column; }
        .event-img-wrap { position:relative; height:180px; overflow:hidden; flex-shrink:0; }
        .event-img { width:100%; height:100%; object-fit:cover; transition:transform 0.4s ease; }
        .event-card:hover .event-img { transform:scale(1.04); }
        .event-img-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(2,44,34,0.5) 0%,transparent 50%); }
        .event-type-badge { position:absolute; top:12px; left:12px; }
        .event-body { padding:24px; display:flex; flex-direction:column; gap:10px; flex:1; }
        .event-title { font-family:'Cormorant Garamond',serif; font-size:22px; color:var(--emerald-900); }
        .event-desc { font-size:13px; color:var(--gray-600); line-height:1.55; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .event-meta { display:flex; flex-direction:column; gap:5px; }
        .event-meta-item { font-size:13px; color:var(--gray-600); }
      `}</style>
    </div>
  )
}

function EventDetailModal({ event, user, isRegistered, onClose, onRegister, onUnregister }) {
  const [confirmUnreg, setConfirmUnreg] = useState(false)
  const isFull = event.max_participants && event.participant_count >= event.max_participants
  const start  = new Date(event.start_time)
  const end    = new Date(event.end_time)
  const duration = Math.round((end - start) / 3600000 * 10) / 10

  return (
    <div className="modal-overlay" onClick={onClose}>
      {confirmUnreg && (
        <ConfirmDialog
          title="Скасувати реєстрацію?"
          message="Ви впевнені що хочете відмінити участь у події?"
          confirmLabel="Скасувати участь"
          confirmClass="btn-danger"
          onConfirm={() => { setConfirmUnreg(false); onUnregister() }}
          onCancel={() => setConfirmUnreg(false)}
        />
      )}
      <div className="modal event-detail-modal" onClick={e => e.stopPropagation()}>
        {event.image_url && (
          <div className="edm-img-wrap">
            <img src={event.image_url} alt={event.title} className="edm-img" />
            <div className="edm-img-overlay" />
            <span className={`badge ${typeBadge[event.event_type]} edm-type-badge`}>{typeLabel[event.event_type]}</span>
          </div>
        )}
        <div className="edm-body">
          <h2 className="edm-title">{event.title}</h2>
          {event.description && <p className="edm-desc">{event.description}</p>}

          <div className="edm-grid">
            <div className="edm-info-item">
              <span className="edm-info-label">📅 Дата початку</span>
              <span>{format(start, 'd MMMM yyyy, HH:mm', { locale: uk })}</span>
            </div>
            <div className="edm-info-item">
              <span className="edm-info-label">🏁 Дата закінчення</span>
              <span>{format(end, 'd MMMM yyyy, HH:mm', { locale: uk })}</span>
            </div>
            <div className="edm-info-item">
              <span className="edm-info-label">⏱️ Тривалість</span>
              <span>{duration} год</span>
            </div>
            {event.max_participants && (
              <div className="edm-info-item">
                <span className="edm-info-label">👥 Учасники</span>
                <span>{event.participant_count} / {event.max_participants} місць</span>
              </div>
            )}
            <div className="edm-info-item">
              <span className="edm-info-label">💰 Вартість</span>
              <span>{event.price > 0 ? `${event.price} грн` : 'Безкоштовно 🎁'}</span>
            </div>
          </div>

          {event.max_participants && (
            <div className="edm-progress-wrap">
              <div className="edm-progress-bar">
                <div className="edm-progress-fill"
                  style={{ width: `${Math.min(100, (event.participant_count / event.max_participants) * 100)}%` }} />
              </div>
              <span className="edm-progress-label">
                {event.max_participants - event.participant_count > 0
                  ? `Залишилось ${event.max_participants - event.participant_count} місць`
                  : 'Місця закінчились'}
              </span>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button className="btn btn-outline" onClick={onClose}>Закрити</button>
            {isFull ? (
              <button className="btn btn-danger" disabled>Місця закінчились</button>
            ) : user ? (
              <>
                {!isRegistered
                  ? <button className="btn btn-primary" style={{ flex: 1, justifyContent:'center' }} onClick={onRegister}>
                      Зареєструватись
                    </button>
                  : <button className="btn btn-danger" style={{ flex: 1, justifyContent:'center' }} onClick={() => setConfirmUnreg(true)}>
                      Скасувати участь
                    </button>
                }
              </>
            ) : (
              <a href="/login" className="btn btn-primary" style={{ flex:1, justifyContent:'center' }}>
                Увійти для реєстрації
              </a>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .event-detail-modal { max-width: 560px; padding: 0; overflow: hidden; max-height: 90vh; display: flex; flex-direction: column; }
        .edm-img-wrap { position:relative; height:220px; overflow:hidden; flex-shrink: 0; }
        .edm-img { width:100%; height:100%; object-fit:cover; }
        .edm-img-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(2,44,34,0.4),transparent 50%); }
        .edm-type-badge { position:absolute; top:16px; left:16px; }
        .edm-body { padding: 32px; overflow-y: auto; flex: 1; }
        .edm-title { font-family:'Cormorant Garamond',serif; font-size:30px; color:var(--emerald-900); margin-bottom:12px; }
        .edm-desc { font-size:14px; color:var(--gray-600); line-height:1.7; margin-bottom:20px; }
        .edm-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
        .edm-info-item { background:var(--emerald-50); border-radius:var(--radius-sm); padding:12px 14px; display:flex; flex-direction:column; gap:4px; }
        .edm-info-label { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--emerald-600); }
        .edm-info-item span:last-child { font-size:14px; color:var(--gray-800); font-weight:500; }
        .edm-progress-wrap { margin-bottom:8px; }
        .edm-progress-bar { height:6px; background:var(--gray-200); border-radius:99px; overflow:hidden; margin-bottom:6px; }
        .edm-progress-fill { height:100%; background:var(--emerald-500); border-radius:99px; transition:width 0.5s ease; }
        .edm-progress-label { font-size:12px; color:var(--gray-400); }
      `}</style>
    </div>
  )
}
