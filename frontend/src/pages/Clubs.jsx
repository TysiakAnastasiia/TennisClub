import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { clubApi } from '../api'
import toast from 'react-hot-toast'

const surfaceLabel = { clay: 'Глина', hard: 'Хард', grass: 'Трава', indoor: 'Критий' }
const surfaceColor = { clay: '#b45309', hard: '#1d4ed8', grass: '#15803d', indoor: '#7c3aed' }

export default function Clubs() {
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    clubApi.list()
      .then(r => setClubs(r.data))
      .catch(() => toast.error('Не вдалося завантажити клуби'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="page-wrapper">
      <div className="loading-center"><div className="spinner" /></div>
    </div>
  )

  return (
    <div className="page-wrapper">
      <div className="mb-8">
        <span className="page-eyebrow">Наші майданчики</span>
        <h1 className="section-title">Тенісні клуби</h1>
        <p style={{ color: 'var(--gray-600)', marginTop: 12, maxWidth: 480 }}>
          Оберіть клуб, перегляньте доступні корти та забронюйте зручний час.
        </p>
      </div>

      {clubs.length === 0 ? (
        <div className="empty-state">
          <p>Клуби не знайдено</p>
        </div>
      ) : (
        <div className="grid-3">
          {clubs.map(club => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}

      <style>{`
        .page-eyebrow {
          display: inline-block; font-size: 11px; letter-spacing: 3px;
          text-transform: uppercase; color: var(--emerald-600);
          margin-bottom: 12px;
        }
      `}</style>
    </div>
  )
}

function ClubCard({ club }) {
  const activeCourts = club.courts?.filter(c => c.is_active) || []
  const surfaces = [...new Set(activeCourts.map(c => c.surface))]
  const minPrice = activeCourts.length ? Math.min(...activeCourts.map(c => c.price_per_hour)) : null

  return (
    <Link to={`/clubs/${club.id}`} className="club-card card">
      <div className="club-img-wrap">
        {club.image_url
          ? <img src={club.image_url} alt={club.name} className="club-img" />
          : <div className="club-img-placeholder">🎾</div>
        }
        <div className="club-img-overlay" />
        {minPrice && (
          <div className="club-price-badge">від {minPrice} грн/год</div>
        )}
      </div>
      <div className="club-body">
        <h3 className="club-name">{club.name}</h3>
        <p className="club-address">📍 {club.address}</p>
        {club.description && (
          <p className="club-desc">{club.description}</p>
        )}
        <div className="club-meta">
          <span className="club-courts-count">{activeCourts.length} кортів</span>
          <div className="surface-tags">
            {surfaces.map(s => (
              <span
                key={s}
                className="surface-tag"
                style={{ background: surfaceColor[s] + '18', color: surfaceColor[s] }}
              >
                {surfaceLabel[s]}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .club-card { display: flex; flex-direction: column; cursor: pointer; }
        .club-img-wrap {
          position: relative; height: 200px; overflow: hidden; flex-shrink: 0;
        }
        .club-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
        .club-card:hover .club-img { transform: scale(1.05); }
        .club-img-placeholder {
          width: 100%; height: 100%; background: var(--emerald-50);
          display: flex; align-items: center; justify-content: center; font-size: 48px;
        }
        .club-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(2,44,34,0.4) 0%, transparent 50%);
        }
        .club-price-badge {
          position: absolute; bottom: 12px; left: 12px;
          background: var(--emerald-800); color: white;
          font-size: 12px; padding: 4px 12px; border-radius: 99px;
          font-weight: 500;
        }
        .club-body { padding: 20px; display: flex; flex-direction: column; gap: 8px; }
        .club-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; color: var(--emerald-900);
        }
        .club-address { font-size: 13px; color: var(--gray-400); }
        .club-desc {
          font-size: 13px; color: var(--gray-600); line-height: 1.55;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .club-meta {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 8px; flex-wrap: wrap; gap: 8px;
        }
        .club-courts-count { font-size: 12px; color: var(--gray-400); }
        .surface-tags { display: flex; gap: 6px; flex-wrap: wrap; }
        .surface-tag {
          font-size: 11px; padding: 2px 8px; border-radius: 99px; font-weight: 500;
        }
      `}</style>
    </Link>
  )
}
