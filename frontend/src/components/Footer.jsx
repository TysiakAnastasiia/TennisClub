import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">🎾 Tennis Club</span>
          <p className="footer-tagline">Смарагдовий Корт · Львів</p>
          <p className="footer-desc">
            Три клуби, сім кортів — місце, де пристрасть зустрічає досконалість.
          </p>
        </div>

        <div className="footer-links-group">
          <h4>Навігація</h4>
          <Link to="/clubs">Клуби</Link>
          <Link to="/events">Події</Link>
          <Link to="/bookings">Бронювання</Link>
          <Link to="/profile">Профіль</Link>
        </div>

        <div className="footer-links-group">
          <h4>Інформація</h4>
          <span>пн–пт: 07:00–22:00</span>
          <span>сб–нд: 08:00–21:00</span>
          <span>📞 +380 32 123-45-67</span>
          <span>✉️ info@tennis.lviv.ua</span>
        </div>

        <div className="footer-links-group">
          <h4>Адреса</h4>
          <span>📍 вул. Зелена, 12</span>
          <span>Львів, Україна</span>
          <div className="footer-socials">
            <a href="#" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="#" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Tennis Club · Смарагдовий Корт. Всі права захищені.</span>
      </div>

      <style>{`
        .footer {
          background: var(--emerald-950);
          color: rgba(255,255,255,0.7);
          margin-top: auto;
        }
        .footer-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 64px 24px 48px;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 48px;
        }
        .footer-brand { }
        .footer-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; color: white; font-weight: 500;
          display: block; margin-bottom: 6px;
        }
        .footer-tagline {
          font-size: 11px; letter-spacing: 3px; text-transform: uppercase;
          color: var(--emerald-400); margin-bottom: 16px;
        }
        .footer-desc { font-size: 13px; line-height: 1.7; max-width: 260px; }
        .footer-links-group {
          display: flex; flex-direction: column; gap: 10px;
        }
        .footer-links-group h4 {
          font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
          color: var(--emerald-400); margin-bottom: 4px; font-weight: 500;
        }
        .footer-links-group a, .footer-links-group span {
          font-size: 13px; color: rgba(255,255,255,0.6);
          transition: color var(--transition);
        }
        .footer-links-group a:hover { color: var(--emerald-300); }
        .footer-socials {
          display: flex; gap: 12px; margin-top: 8px;
        }
        .footer-socials a {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.6);
          transition: all var(--transition);
        }
        .footer-socials a:hover {
          border-color: var(--emerald-400);
          color: var(--emerald-400);
          background: rgba(16,185,129,0.1);
        }
        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.08);
          padding: 20px 24px;
          text-align: center; font-size: 12px;
          max-width: 1200px; margin: 0 auto;
        }
        @media (max-width: 768px) {
          .footer-inner { grid-template-columns: 1fr 1fr; gap: 32px; }
          .footer-brand { grid-column: 1 / -1; }
        }
        @media (max-width: 480px) {
          .footer-inner { grid-template-columns: 1fr; }
        }
      `}</style>
    </footer>
  )
}
