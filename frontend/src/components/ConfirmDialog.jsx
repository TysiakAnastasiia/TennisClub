import { createPortal } from 'react-dom'

export default function ConfirmDialog({ title, message, confirmLabel = 'Підтвердити', confirmClass = 'btn-danger', onConfirm, onCancel }) {
  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal confirm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="confirm-icon">⚠️</div>
        <h3 className="confirm-title">{title}</h3>
        {message && <p className="confirm-msg">{message}</p>}
        <div className="flex gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onCancel}>Скасувати</button>
          <button className={`btn ${confirmClass}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
      <style>{`
        .confirm-modal { text-align: center; padding: 40px 36px; }
        .confirm-icon { font-size: 40px; margin-bottom: 12px; }
        .confirm-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; color: var(--emerald-900); margin-bottom: 8px; }
        .confirm-msg { font-size: 14px; color: var(--gray-600); line-height: 1.6; }
      `}</style>
    </div>,
    document.body
  )
}
