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
          <div className="court-diagram">
            <div className="court-line baseline top" />
            <div className="court-line baseline bot" />
            <div className="court-line sideline left" />
            <div className="court-line sideline right" />
            <div className="court-line center-h" />
            <div className="court-line service-left"  />
            <div className="court-line service-right" />
            <div className="court-line center-v-top"  />
            <div className="court-net" />
            <div className="ball" />
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
          padding: 80px 24px;
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

        /* Court diagram */
        .hero-visual {
          position: absolute; right: 8%; top: 50%;
          transform: translateY(-50%);
          display: flex; align-items: center; justify-content: center;
          opacity: 0.15;
        }
        .court-diagram {
          width: 280px; height: 360px; position: relative;
          border: 2px solid var(--emerald-600);
          animation: courtFloat 6s ease-in-out infinite;
        }
        @keyframes courtFloat {
          0%, 100% { transform: translateY(0) rotate(-8deg); }
          50%       { transform: translateY(-16px) rotate(-8deg); }
        }
        .court-line {
          position: absolute; background: var(--emerald-600);
        }
        .baseline { height: 2px; left: 0; right: 0; }
        .baseline.top { top: 30px; }
        .baseline.bot { bottom: 30px; }
        .sideline { width: 2px; top: 30px; bottom: 30px; }
        .sideline.left  { left: 40px; }
        .sideline.right { right: 40px; }
        .center-h { height: 2px; left: 0; right: 0; top: 50%; }
        .service-left  { height: 2px; left: 40px; right: 50%; top: 35%; }
        .service-right { height: 2px; left: 50%; right: 40px; bottom: 35%; }
        .center-v-top { width: 2px; left: 50%; top: 30px; bottom: 50%; }
        .court-net {
          position: absolute; left: 0; right: 0; top: calc(50% - 4px);
          height: 8px; background: repeating-linear-gradient(
            90deg, var(--emerald-400) 0, var(--emerald-400) 4px, transparent 4px, transparent 8px
          );
        }
        .ball {
          position: absolute; width: 16px; height: 16px;
          background: #c8f500; border-radius: 50%;
          top: 38%; left: 35%;
          animation: ballMove 3s ease-in-out infinite;
          box-shadow: 0 0 8px rgba(200,245,0,0.6);
        }
        @keyframes ballMove {
          0%   { top: 38%; left: 35%; }
          50%  { top: 58%; left: 62%; }
          100% { top: 38%; left: 35%; }
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
