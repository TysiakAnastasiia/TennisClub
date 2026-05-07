import { useState } from 'react'
import { bookingApi } from '../api'
import toast from 'react-hot-toast'

export default function PaymentModal({ booking, onClose, onPaid }) {
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('form') // form | processing | done

  const formatCard = (val) => val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19)
  const formatExpiry = (val) => {
    const v = val.replace(/\D/g, '')
    return v.length >= 2 ? v.slice(0, 2) + '/' + v.slice(2, 4) : v
  }

  const pay = async () => {
    if (card.number.replace(/\s/g, '').length < 16) { toast.error('Введіть номер картки'); return }
    if (card.expiry.length < 5) { toast.error('Введіть термін дії'); return }
    if (card.cvv.length < 3) { toast.error('Введіть CVV'); return }
    if (!card.name) { toast.error('Введіть ім\'я власника'); return }

    setStep('processing')
    setLoading(true)

    // Simulate bank processing delay
    await new Promise(r => setTimeout(r, 2000))

    try {
      await bookingApi.pay(booking.id, { card_last4: card.number.slice(-4) })
      setStep('done')
      toast.success('Оплату підтверджено! 💳')
      setTimeout(() => { onPaid(); onClose() }, 1500)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Помилка оплати')
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal pay-modal" onClick={e => e.stopPropagation()}>
        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 20px' }} />
            <p style={{ color: 'var(--gray-600)' }}>Обробляємо платіж...</p>
          </div>
        )}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: 28, color: 'var(--emerald-900)' }}>Оплачено!</h3>
          </div>
        )}
        {step === 'form' && (
          <>
            <h2 className="modal-title">💳 Оплата бронювання</h2>
            <div className="pay-summary">
              <span>Бронювання #{booking.id}</span>
              <span className="pay-amount">{booking.total_price} грн</span>
            </div>

            {/* Mock card UI */}
            <div className="card-visual">
              <div className="card-visual-chip">▬▬</div>
              <div className="card-visual-number">
                {card.number || '•••• •••• •••• ••••'}
              </div>
              <div className="card-visual-bottom">
                <div>
                  <div className="card-visual-label">Власник</div>
                  <div>{card.name || 'ІМ\'Я ПРІЗВИЩЕ'}</div>
                </div>
                <div>
                  <div className="card-visual-label">Дійсна до</div>
                  <div>{card.expiry || 'ММ/РР'}</div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Номер картки</label>
              <input className="input-field" placeholder="0000 0000 0000 0000"
                value={card.number}
                onChange={e => setCard({ ...card, number: formatCard(e.target.value) })}
                maxLength={19}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="label">Термін дії</label>
                <input className="input-field" placeholder="ММ/РР"
                  value={card.expiry}
                  onChange={e => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                  maxLength={5}
                />
              </div>
              <div className="form-group">
                <label className="label">CVV</label>
                <input className="input-field" placeholder="•••" type="password"
                  value={card.cvv}
                  onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                  maxLength={3}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Ім'я власника</label>
              <input className="input-field" placeholder="OLENA KOVALENKO"
                value={card.name}
                onChange={e => setCard({ ...card, name: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="pay-test-hint">
              🧪 Тестовий режим · Реальних платежів не здійснюється
            </div>
            <div className="flex gap-3">
              <button className="btn btn-outline w-full" onClick={onClose}>Скасувати</button>
              <button className="btn btn-primary w-full" onClick={pay} disabled={loading}>
                Сплатити {booking.total_price} грн
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .pay-modal { max-width: 460px; }
        .pay-summary {
          display: flex; justify-content: space-between; align-items: center;
          background: var(--emerald-50); border-radius: var(--radius-sm);
          padding: 12px 16px; margin-bottom: 20px; font-size: 14px; color: var(--gray-600);
        }
        .pay-amount { font-family: 'Cormorant Garamond', serif; font-size: 24px; color: var(--emerald-800); }
        .card-visual {
          background: linear-gradient(135deg, var(--emerald-900), var(--emerald-600));
          border-radius: 12px; padding: 24px; margin-bottom: 20px; color: white;
          font-family: 'Courier New', monospace; letter-spacing: 1px;
        }
        .card-visual-chip { font-size: 20px; margin-bottom: 20px; opacity: 0.8; }
        .card-visual-number { font-size: 18px; letter-spacing: 3px; margin-bottom: 20px; min-height: 24px; }
        .card-visual-bottom { display: flex; justify-content: space-between; font-size: 13px; }
        .card-visual-label { font-size: 10px; opacity: 0.7; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
        .pay-test-hint {
          font-size: 12px; color: var(--gray-400); text-align: center;
          padding: 8px; background: var(--gray-50); border-radius: var(--radius-sm);
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  )
}
