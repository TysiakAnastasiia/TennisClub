import { useState, useEffect } from 'react'
import { bookingApi } from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'

const statusLabel = { confirmed: 'Підтверджено', pending: 'Очікує', cancelled: 'Скасовано' }
const statusBadge = { confirmed: 'badge-emerald', pending: 'badge-amber', cancelled: 'badge-red' }

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    bookingApi.list()
      .then(r => setBookings(r.data))
      .catch(() => toast.error('Не вдалося завантажити бронювання'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const cancel = async (id) => {
    if (!confirm('Скасувати бронювання?')) return
    try {
      await bookingApi.cancel(id)
      toast.success('Бронювання скасовано')
      load()
    } catch {
      toast.error('Помилка скасування')
    }
  }

  if (loading) return (
    <div className="page-wrapper"><div className="loading-center"><div className="spinner" /></div></div>
  )

  const active    = bookings.filter(b => b.status !== 'cancelled')
  const cancelled = bookings.filter(b => b.status === 'cancelled')

  return (
    <div className="page-wrapper">
      <div className="mb-8">
        <span className="page-eyebrow">Мій розклад</span>
        <h1 className="section-title">Бронювання</h1>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <p>У вас ще немає бронювань</p>
          <a href="/clubs" className="btn btn-primary mt-4" style={{ display:'inline-flex' }}>
            Знайти корт
          </a>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <h2 className="bookings-section-heading">Активні</h2>
              <div className="bookings-list">
                {active.map(b => <BookingRow key={b.id} booking={b} onCancel={() => cancel(b.id)} />)}
              </div>
            </>
          )}
          {cancelled.length > 0 && (
            <>
              <h2 className="bookings-section-heading mt-6" style={{ opacity: 0.5 }}>Скасовані</h2>
              <div className="bookings-list" style={{ opacity: 0.6 }}>
                {cancelled.map(b => <BookingRow key={b.id} booking={b} />)}
              </div>
            </>
          )}
        </>
      )}

      <style>{`
        .page-eyebrow { display:inline-block; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:var(--emerald-600); margin-bottom:12px; }
        .bookings-section-heading { font-family:'Cormorant Garamond',serif; font-size:24px; color:var(--emerald-900); margin-bottom:16px; }
        .bookings-list { display:flex; flex-direction:column; gap:12px; }
      `}</style>
    </div>
  )
}

function BookingRow({ booking, onCancel }) {
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
          <div className="flex items-center gap-2 mb-2">
            <span className="booking-court">Корт #{booking.court_id}</span>
            <span className={`badge ${statusBadge[booking.status]}`}>
              {statusLabel[booking.status]}
            </span>
            {isPast && <span className="badge badge-gray">Минуле</span>}
          </div>
          <div className="booking-time">
            ⏰ {format(start, 'HH:mm')} – {format(end, 'HH:mm')} · {hours}год
          </div>
          {booking.notes && (
            <div className="booking-notes">💬 {booking.notes}</div>
          )}
        </div>
        <div className="booking-price-block">
          <span className="booking-price">{booking.total_price}</span>
          <span className="booking-price-unit">грн</span>
          {onCancel && booking.status !== 'cancelled' && !isPast && (
            <button className="btn btn-ghost btn-sm" style={{ color:'#dc2626' }} onClick={onCancel}>
              Скасувати
            </button>
          )}
        </div>
      </div>

      <style>{`
        .booking-row { border-radius:var(--radius); }
        .booking-row-inner { display:flex; align-items:center; gap:20px; padding:20px 24px; }
        .booking-date-block {
          display:flex; flex-direction:column; align-items:center;
          background:var(--emerald-50); border-radius:var(--radius-sm);
          padding:10px 16px; min-width:60px; flex-shrink:0;
        }
        .booking-day { font-family:'Cormorant Garamond',serif; font-size:32px; color:var(--emerald-800); line-height:1; }
        .booking-month { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--emerald-600); }
        .booking-info { flex:1; }
        .booking-court { font-weight:500; color:var(--gray-800); }
        .booking-time { font-size:13px; color:var(--gray-600); }
        .booking-notes { font-size:12px; color:var(--gray-400); margin-top:4px; }
        .booking-price-block { display:flex; flex-direction:column; align-items:flex-end; gap:4px; }
        .booking-price { font-family:'Cormorant Garamond',serif; font-size:28px; color:var(--emerald-800); line-height:1; }
        .booking-price-unit { font-size:11px; color:var(--gray-400); }
      `}</style>
    </div>
  )
}
