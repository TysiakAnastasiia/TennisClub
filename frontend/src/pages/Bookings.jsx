import { useState, useEffect } from 'react'
import { bookingApi, eventApi } from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import ConfirmDialog from '../components/ConfirmDialog'
import PaymentModal from '../components/PaymentModal'

const statusLabel = { confirmed: 'Підтверджено', pending: 'Очікує', cancelled: 'Скасовано' }
const statusBadge = { confirmed: 'badge-emerald', pending: 'badge-amber', cancelled: 'badge-red' }

export default function Bookings() {
  const [bookings, setBookings]         = useState([])
  const [myEvents, setMyEvents]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [tab, setTab]                   = useState('bookings')
  const [confirmCancel, setConfirmCancel] = useState(null) // booking id
  const [payBooking, setPayBooking]     = useState(null)

  const load = async () => {
    const [bRes, eRes] = await Promise.all([
      bookingApi.list().catch(() => ({ data: [] })),
      eventApi.myRegistrations().catch(() => ({ data: [] })),
    ])
    setBookings(bRes.data)
    setMyEvents(eRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const doCancel = async () => {
    try {
      await bookingApi.cancel(confirmCancel)
      toast.success('Бронювання скасовано')
      setConfirmCancel(null)
      load()
    } catch {
      toast.error('Помилка скасування')
      setConfirmCancel(null)
    }
  }

  if (loading) return (
    <div className="page-wrapper"><div className="loading-center"><div className="spinner" /></div></div>
  )

  const active    = bookings.filter(b => b.status !== 'cancelled')
  const cancelled = bookings.filter(b => b.status === 'cancelled')

  return (
    <div className="page-wrapper">
      {confirmCancel && (
        <ConfirmDialog
          title="Скасувати бронювання?"
          message="Якщо бронювання оплачено — кошти будуть повернуті. Цю дію не можна скасувати."
          confirmLabel="Так, скасувати"
          confirmClass="btn-danger"
          onConfirm={doCancel}
          onCancel={() => setConfirmCancel(null)}
        />
      )}
      {payBooking && (
        <PaymentModal
          booking={payBooking}
          onClose={() => setPayBooking(null)}
          onPaid={() => { setPayBooking(null); load() }}
        />
      )}

      <div className="mb-8">
        <span className="page-eyebrow">Мій розклад</span>
        <h1 className="section-title">Мої бронювання та події</h1>
      </div>

      {/* Tabs */}
      <div className="bk-tabs mb-6">
        <button className={`bk-tab ${tab === 'bookings' ? 'active' : ''}`} onClick={() => setTab('bookings')}>
          📅 Бронювання кортів {active.length > 0 && <span className="bk-tab-count">{active.length}</span>}
        </button>
        <button className={`bk-tab ${tab === 'events' ? 'active' : ''}`} onClick={() => setTab('events')}>
          🏆 Мої події {myEvents.length > 0 && <span className="bk-tab-count">{myEvents.length}</span>}
        </button>
      </div>

      {tab === 'bookings' && (
        bookings.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
            <p>У вас ще немає бронювань</p>
            <a href="/clubs" className="btn btn-primary mt-4" style={{ display:'inline-flex', justifyContent:'center' }}>Знайти корт</a>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <h2 className="bk-section-h">Активні</h2>
                <div className="bookings-list">
                  {active.map(b => (
                    <BookingRow key={b.id} booking={b}
                      onCancel={() => setConfirmCancel(b.id)}
                      onPay={() => setPayBooking(b)}
                    />
                  ))}
                </div>
              </>
            )}
            {cancelled.length > 0 && (
              <>
                <h2 className="bk-section-h mt-6" style={{ opacity: 0.5 }}>Скасовані</h2>
                <div className="bookings-list" style={{ opacity: 0.6 }}>
                  {cancelled.map(b => <BookingRow key={b.id} booking={b} />)}
                </div>
              </>
            )}
          </>
        )
      )}

      {tab === 'events' && (
        myEvents.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
            <p>Ви ще не зареєстровані на жодну подію</p>
            <a href="/events" className="btn btn-primary mt-4" style={{ display:'inline-flex', justifyContent:'center' }}>Переглянути події</a>
          </div>
        ) : (
          <div className="bookings-list">
            {myEvents.map(reg => <EventRegRow key={reg.id} reg={reg} onUnregister={load} />)}
          </div>
        )
      )}

      <style>{`
        .page-eyebrow { display:inline-block; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:var(--emerald-600); margin-bottom:12px; }
        .bk-tabs { display:flex; gap:4px; border-bottom:1px solid var(--gray-200); }
        .bk-tab { display:flex; align-items:center; gap:8px; padding:12px 20px; font-size:14px; color:var(--gray-500); border-bottom:2px solid transparent; transition:all var(--transition); cursor:pointer; background:none; border-top:none; border-left:none; border-right:none; font-family:inherit; }
        .bk-tab:hover { color:var(--emerald-700); }
        .bk-tab.active { color:var(--emerald-800); border-bottom-color:var(--emerald-700); font-weight:500; }
        .bk-tab-count { background:var(--emerald-100); color:var(--emerald-800); border-radius:99px; padding:2px 8px; font-size:11px; font-weight:600; }
        .bk-section-h { font-family:'Cormorant Garamond',serif; font-size:24px; color:var(--emerald-900); margin-bottom:16px; }
        .bookings-list { display:flex; flex-direction:column; gap:12px; }
      `}</style>
    </div>
  )
}

function BookingRow({ booking, onCancel, onPay }) {
  const start = new Date(booking.start_time)
  const end   = new Date(booking.end_time)
  const hours = (end - start) / 3600000
  const isPast = end < new Date()

  return (
    <div className="booking-row card" style={{ overflow:'visible' }}>
      <div className="booking-row-inner">
        <div className="booking-date-block">
          <span className="booking-day">{format(start, 'd', { locale: uk })}</span>
          <span className="booking-month">{format(start, 'MMM', { locale: uk })}</span>
        </div>
        <div className="booking-info">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="booking-court">Корт #{booking.court_id}</span>
            <span className={`badge ${statusBadge[booking.status]}`}>{statusLabel[booking.status]}</span>
            {booking.is_paid && <span className="badge badge-emerald">💳 Оплачено</span>}
            {!booking.is_paid && booking.status !== 'cancelled' && <span className="badge badge-amber">Не оплачено</span>}
            {isPast && <span className="badge badge-gray">Минуле</span>}
          </div>
          <div className="booking-time">⏰ {format(start, 'HH:mm')} – {format(end, 'HH:mm')} · {hours}год</div>
          {booking.notes && <div className="booking-notes">💬 {booking.notes}</div>}
        </div>
        <div className="booking-price-block">
          <span className="booking-price">{booking.total_price}</span>
          <span className="booking-price-unit">грн</span>
          <div className="flex gap-2" style={{ marginTop: 8 }}>
            {!booking.is_paid && booking.status !== 'cancelled' && !isPast && onPay && (
              <button className="btn btn-primary btn-sm" onClick={() => onPay(booking)}>Оплатити</button>
            )}
            {onCancel && booking.status !== 'cancelled' && !isPast && (
              <button className="btn btn-ghost btn-sm" style={{ color:'#dc2626' }} onClick={onCancel}>Скасувати</button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .booking-row { border-radius:var(--radius); }
        .booking-row-inner { display:flex; align-items:center; gap:20px; padding:20px 24px; flex-wrap:wrap; }
        .booking-date-block { display:flex; flex-direction:column; align-items:center; background:var(--emerald-50); border-radius:var(--radius-sm); padding:10px 16px; min-width:60px; flex-shrink:0; }
        .booking-day { font-family:'Cormorant Garamond',serif; font-size:32px; color:var(--emerald-800); line-height:1; }
        .booking-month { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--emerald-600); }
        .booking-info { flex:1; min-width:200px; }
        .booking-court { font-weight:500; color:var(--gray-800); }
        .booking-time { font-size:13px; color:var(--gray-600); }
        .booking-notes { font-size:12px; color:var(--gray-400); margin-top:4px; }
        .booking-price-block { display:flex; flex-direction:column; align-items:flex-end; gap:2px; }
        .booking-price { font-family:'Cormorant Garamond',serif; font-size:28px; color:var(--emerald-800); line-height:1; }
        .booking-price-unit { font-size:11px; color:var(--gray-400); }
      `}</style>
    </div>
  )
}

function EventRegRow({ reg, onUnregister }) {
  const [confirm, setConfirm] = useState(false)
  // eventApi imported at top

  const doUnregister = async () => {
    try {
      await eventApi.unregister(reg.event_id)
      toast.success('Реєстрацію скасовано')
      setConfirm(false)
      onUnregister()
    } catch {
      toast.error('Помилка')
      setConfirm(false)
    }
  }

  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      {confirm && (
        <ConfirmDialog
          title="Скасувати реєстрацію на подію?"
          message="Ви впевнені що хочете скасувати участь?"
          confirmLabel="Скасувати участь"
          confirmClass="btn-danger"
          onConfirm={doUnregister}
          onCancel={() => setConfirm(false)}
        />
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-medium" style={{ marginBottom: 4 }}>
            🏆 Подія #{reg.event_id}
          </div>
          <div className="text-sm text-muted">
            Зареєстровано: {format(new Date(reg.registered_at), 'd MMM yyyy, HH:mm', { locale: uk })}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ color:'#dc2626' }} onClick={() => setConfirm(true)}>
          Скасувати участь
        </button>
      </div>
    </div>
  )
}
