import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'

export default function Home() {
  const heroRef = useRef(null)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const onMove = (e) => {
      const { left, top, width, height } = el.getBoundingClientRect()
      const x = ((e.clientX - left) / width  - 0.5) * 20
      const y = ((e.clientY - top)  / height - 0.5) * 20
      el.style.setProperty('--rx', `${y}deg`)
      el.style.setProperty('--ry', `${x}deg`)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb orb1" />
          <div className="hero-orb orb2" />
          <div className="hero-grid" />
        </div>
        <div className="hero-content" ref={heroRef}>
          <span className="hero-eyebrow">Смарагдовий Корт · Львів</span>
          <h1 className="hero-title">
            Де пристрасть<br/>зустрічає<br/><em>досконалість</em>
          </h1>
          <p className="hero-sub">
            Три клуби, сім кортів, турніри та тренування —<br/>
            все, що потрібно для вашої гри.
          </p>
          <div className="hero-actions">
            <Link to="/clubs"  className="btn btn-primary">Обрати клуб</Link>
            <Link to="/events" className="btn btn-outline">Переглянути події</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="photo-stack">

            {/* Фото ззаду зліва */}
            <div className="photo-card photo-back-left">
              <img src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&q=80" alt="" />
            </div>

            {/* Фото ззаду справа */}
            <div className="photo-card photo-back-right">
              <img src="https://images.unsplash.com/photo-1632755898125-36cd72575dde?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="" />
            </div>

            {/* Головне фото спереду */}
            <div className="photo-card photo-front">
              <img src="/hero-court.jpg" alt="Tennis Court" />
              <div className="photo-front-badge">
                <span>🎾</span>
                <span>Смарагдовий Корт · Львів</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-bar">
        {[
          { num: '3',   label: 'Клуби' },
          { num: '7',   label: 'Кортів' },
          { num: '4+',  label: 'Турніри щомісяця' },
          { num: '24/7',label: 'Підтримка' },
        ].map(({ num, label }) => (
          <div key={label} className="stat-item">
            <span className="stat-num">{num}</span>
            <span className="stat-label">{label}</span>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="features">
        <div className="features-inner">
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 48 }}>
            Чому Tennis Club?
          </h2>
          <div className="features-grid">
            {[
              { icon: '🎾', title: 'Корти будь-якого покриття', text: 'Глина, хард, трава та закриті корти для цілорічної гри в будь-яку погоду.' },
              { icon: '📅', title: 'Зручне бронювання', text: 'Обирайте клуб, корт і час — підтвердження приходить одразу на email.' },
              { icon: '🏆', title: 'Турніри та події', text: 'Від відкритих тренувань до офіційних турнірів — знайди своій рівень.' },
              { icon: '👥', title: 'Для всіх рівнів', text: 'Починаючи з першого удару і до змагань — є місце для кожного гравця.' },
            ].map(({ icon, title, text }) => (
              <div key={title} className="feature-card card">
                <div className="feature-icon">{icon}</div>
                <h3 className="feature-title">{title}</h3>
                <p className="feature-text">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2>Готові грати?</h2>
          <p>Реєструйтесь безкоштовно і забронюйте перший корт вже сьогодні.</p>
          <Link to="/register" className="btn btn-primary" style={{ fontSize: 16, padding: '16px 36px' }}>
            Приєднатися
          </Link>
        </div>
      </section>

      <style>{`
        .home { overflow-x: hidden; }

        /* Hero */
        .hero {
          position: relative; min-height: calc(100vh - 64px);
          display: flex; align-items: center; overflow: hidden;
          padding: 100px max(32px, 6vw) 100px max(48px, 8vw);
        }
        .hero-bg { position: absolute; inset: 0; pointer-events: none; }
        .hero-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); opacity: 0.35;
        }
        .orb1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #10b981, transparent 70%);
          top: -200px; right: -100px;
          animation: drift 8s ease-in-out infinite alternate;
        }
        .orb2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #6ee7b7, transparent 70%);
          bottom: -100px; left: 20%;
          animation: drift 12s ease-in-out infinite alternate-reverse;
        }
        @keyframes drift {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(20px, -20px) scale(1.05); }
        }
        .hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .hero-content {
          position: relative; z-index: 1; max-width: 560px;
          transform: perspective(600px) rotateX(var(--rx,0)) rotateY(var(--ry,0));
          transition: transform 0.1s ease;
        }
        .hero-eyebrow {
          display: inline-block; font-size: 11px;
          letter-spacing: 3px; text-transform: uppercase;
          color: var(--emerald-600); margin-bottom: 20px;
          border: 1px solid var(--emerald-200);
          padding: 6px 14px; border-radius: 99px;
          background: var(--emerald-50);
        }
        .hero-title {
          font-size: clamp(48px, 7vw, 88px);
          font-weight: 300; line-height: 1.0;
          color: var(--emerald-950); margin-bottom: 24px;
        }
        .hero-title em {
          font-style: italic; color: var(--emerald-700);
        }
        .hero-sub {
          font-size: 17px; color: var(--gray-600);
          line-height: 1.7; margin-bottom: 40px;
        }
        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }

        /* Hero photo stack */
        .hero-visual {
          position: absolute; right: calc(4% + 70px); top: 50%;
          transform: translateY(-50%);
          width: min(460px, 38vw);
          height: 560px;
        }
        .photo-stack { position: relative; width: 100%; height: 100%; }

        .photo-card {
          position: absolute;
          background: white;
          padding: 8px 8px 36px;
          border-radius: 3px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.12);
        }
        .photo-card img {
          display: block; object-fit: cover;
          border-radius: 1px;
        }

        /* Фото ззаду зліва */
        .photo-back-left {
          top: -30px; left: -50px;
          transform: rotate(6deg);
          z-index: 1;
          animation: floatA 8s ease-in-out infinite;
        }
        .photo-back-left img { width: 260px; height: 340px; }

        /* Фото ззаду справа */
        .photo-back-right {
          bottom: -20px; right: -50px;
          transform: rotate(-5deg);
          z-index: 2;
          animation: floatB 9s ease-in-out infinite;
        }
        .photo-back-right img { width: 240px; height: 310px; }

        /* Головне фото */
        .photo-front {
          top: 50%; left: 50%;
          transform: translate(-44%, -50%) rotate(-2.5deg);
          z-index: 3;
          animation: floatC 7s ease-in-out infinite;
          overflow: hidden;
          padding-bottom: 44px;
        }
        .photo-front img { width: 300px; height: 390px; }

        .photo-front-badge {
          position: absolute; bottom: 8px; left: 8px; right: 8px;
          display: flex; align-items: center; gap: 6px;
          font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase;
          color: #555; justify-content: center;
        }

        @keyframes floatA {
          0%, 100% { transform: rotate(6deg) translateY(0); }
          50%       { transform: rotate(6deg) translateY(-8px); }
        }
        @keyframes floatB {
          0%, 100% { transform: rotate(-5deg) translateY(0); }
          50%       { transform: rotate(-5deg) translateY(-6px); }
        }
        @keyframes floatC {
          0%, 100% { transform: translate(-44%, -50%) rotate(-2.5deg) translateY(0); }
          50%       { transform: translate(-44%, -50%) rotate(-2.5deg) translateY(-10px); }
        }

        /* Stats */
        .stats-bar {
          display: flex; justify-content: center; gap: 0;
          background: var(--emerald-900); padding: 40px 24px;
        }
        .stat-item {
          display: flex; flex-direction: column; align-items: center;
          padding: 0 48px; border-right: 1px solid rgba(255,255,255,0.12);
        }
        .stat-item:last-child { border-right: none; }
        .stat-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 48px; font-weight: 300; color: var(--emerald-300);
          line-height: 1;
        }
        .stat-label { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-top: 6px; }

        /* Features */
        .features { padding: 100px 24px; background: var(--gray-50); }
        .features-inner { max-width: 1100px; margin: 0 auto; }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 24px;
        }
        .feature-card { padding: 36px 28px; }
        .feature-icon { font-size: 32px; margin-bottom: 16px; }
        .feature-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; color: var(--emerald-900); margin-bottom: 10px;
        }
        .feature-text { font-size: 14px; color: var(--gray-600); line-height: 1.65; }

        /* CTA */
        .cta-section {
          padding: 100px 24px;
          background: linear-gradient(135deg, var(--emerald-950) 0%, var(--emerald-800) 100%);
          text-align: center;
        }
        .cta-inner { max-width: 560px; margin: 0 auto; }
        .cta-inner h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 52px; font-weight: 300; color: white; margin-bottom: 16px;
        }
        .cta-inner p { color: rgba(255,255,255,0.7); font-size: 16px; margin-bottom: 40px; }

        @media (max-width: 768px) {
          .hero { padding: 60px 24px; min-height: auto; }
          .hero-visual { display: none; }
          .stats-bar { flex-wrap: wrap; gap: 24px; }
          .stat-item { border: none; padding: 0 24px; }
        }
      `}</style>
    </div>
  )
}
