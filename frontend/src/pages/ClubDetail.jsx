import { addHours, format, startOfHour } from "date-fns";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { bookingApi, clubApi } from "../api";
import { useAuthStore } from "../store/authStore";

const surfaceLabel = {
  clay: "Глина 🟫",
  hard: "Хард 🔵",
  grass: "Трава 🟢",
  indoor: "Критий 🏠",
};

export default function ClubDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    clubApi
      .get(id)
      .then((r) => setClub(r.data))
      .catch(() => toast.error("Клуб не знайдено"))
      .finally(() => setLoading(false));
  }, [id]);

  const openBooking = (court) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setSelectedCourt(court);
    setShowModal(true);
  };

  if (loading)
    return (
      <div className="page-wrapper">
        <div className="loading-center">
          <div className="spinner" />
        </div>
      </div>
    );
  if (!club)
    return (
      <div className="page-wrapper">
        <p>Клуб не знайдено</p>
      </div>
    );

  const courts = club.courts?.filter((c) => c.is_active) || [];

  return (
    <div className="page-wrapper">
      {/* Hero banner */}
      <div className="club-hero">
        {club.image_url ? (
          <img src={club.image_url} alt={club.name} className="club-hero-img" />
        ) : (
          <div className="club-hero-placeholder">🎾</div>
        )}
        <div className="club-hero-overlay" />
        <div className="club-hero-content">
          <button
            className="btn btn-ghost btn-sm back-btn"
            onClick={() => navigate("/clubs")}
          >
            ← Назад
          </button>
          <h1 className="club-hero-title">{club.name}</h1>
          <p className="club-hero-addr">📍 {club.address}</p>
        </div>
      </div>

      {/* Info */}
      <div className="club-info-row">
        {club.description && (
          <p className="club-full-desc">{club.description}</p>
        )}
        <div className="club-contacts">
          {club.phone && <span>📞 {club.phone}</span>}
          {club.email && <span>✉️ {club.email}</span>}
        </div>
      </div>

      {/* Courts */}
      <h2 className="courts-heading">Корти</h2>
      {!club.is_active && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: "var(--radius-sm)",
            padding: "12px 16px",
            marginBottom: 20,
            color: "#991b1b",
            fontSize: 14,
          }}
        >
          ⚠️ Цей клуб наразі неактивний. Бронювання тимчасово недоступне.
        </div>
      )}
      {courts.length === 0 ? (
        <div className="empty-state">
          <p>Кортів поки немає</p>
        </div>
      ) : (
        <div className="courts-grid">
          {courts.map((court) => (
            <div key={court.id} className="court-card card">
              <div className="court-card-body">
                <div>
                  <h3 className="court-name">{court.name}</h3>
                  <p className="court-surface">{surfaceLabel[court.surface]}</p>
                  {court.is_indoor && (
                    <span className="badge badge-emerald mt-2">Критий</span>
                  )}
                </div>
                <div className="court-price-block">
                  <span className="court-price">{court.price_per_hour}</span>
                  <span className="court-price-unit">грн/год</span>
                </div>
              </div>
              <button
                className="btn btn-primary w-full"
                style={{
                  borderRadius: "0 0 12px 12px",
                  margin: 0,
                  justifyContent: "center",
                }}
                onClick={() => openBooking(court)}
                disabled={!club.is_active}
              >
                Забронювати
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedCourt && (
        <BookingModal
          court={selectedCourt}
          clubId={club.id}
          onClose={() => setShowModal(false)}
          onDone={() => {
            setShowModal(false);
            navigate("/bookings");
          }}
        />
      )}

      <style>{`
        .club-hero { position:relative; height:320px; border-radius:var(--radius); overflow:hidden; margin-bottom:32px; }
        .club-hero-img { width:100%; height:100%; object-fit:cover; }
        .club-hero-placeholder { width:100%; height:100%; background:var(--emerald-50); display:flex; align-items:center; justify-content:center; font-size:64px; }
        .club-hero-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(2,44,34,0.7) 0%,transparent 50%); }
        .club-hero-content { position:absolute; bottom:28px; left:28px; right:28px; }
        .back-btn { color:rgba(255,255,255,0.8); margin-bottom:8px; }
        .back-btn:hover { color:white; background:rgba(255,255,255,0.1); }
        .club-hero-title { font-family:'Cormorant Garamond',serif; font-size:42px; font-weight:300; color:white; }
        .club-hero-addr { color:rgba(255,255,255,0.7); font-size:14px; margin-top:4px; }
        .club-info-row { display:flex; flex-wrap:wrap; gap:24px; margin-bottom:40px; align-items:flex-start; }
        .club-full-desc { color:var(--gray-600); line-height:1.7; max-width:600px; }
        .club-contacts { display:flex; flex-direction:column; gap:8px; font-size:14px; color:var(--gray-600); }
        .courts-heading { font-family:'Cormorant Garamond',serif; font-size:32px; color:var(--emerald-900); margin-bottom:20px; }
        .courts-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:20px; }
        .court-card { display:flex; flex-direction:column; }
        .court-card-body { padding:24px; display:flex; justify-content:space-between; align-items:flex-start; flex:1; }
        .court-name { font-family:'Cormorant Garamond',serif; font-size:22px; color:var(--emerald-900); }
        .court-surface { font-size:14px; color:var(--gray-600); margin-top:4px; }
        .court-price-block { text-align:right; }
        .court-price { display:block; font-size:28px; font-weight:300; color:var(--emerald-800); font-family:'Cormorant Garamond',serif; }
        .court-price-unit { font-size:12px; color:var(--gray-400); }
      `}</style>
    </div>
  );
}

function BookingModal({ court, clubId, onClose, onDone }) {
  const now = startOfHour(addHours(new Date(), 1));
  const [startTime, setStartTime] = useState(format(now, "yyyy-MM-dd'T'HH:mm"));
  const [endTime, setEndTime] = useState(
    format(addHours(now, 1), "yyyy-MM-dd'T'HH:mm")
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const hours = (new Date(endTime) - new Date(startTime)) / 3600000;
  const total = Math.max(0, hours * court.price_per_hour);

  const submit = async () => {
    if (hours < 1) {
      toast.error("Мінімум 1 година");
      return;
    }
    if (new Date(startTime) <= new Date()) {
      toast.error("Час бронювання має бути у майбутньому");
      return;
    }
    setLoading(true);
    try {
      await bookingApi.create({
        court_id: court.id,
        club_id: clubId,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        notes,
      });
      toast.success("Бронювання підтверджено! Підтвердження на email 🎾");
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Помилка бронювання");
    } finally {
      setLoading(false);
    }
  };

  const minDate = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Бронювання · {court.name}</h2>
        <div className="form-group">
          <label className="label">Початок</label>
          <input
            className="input-field"
            type="datetime-local"
            value={startTime}
            min={minDate}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="label">Кінець</label>
          <input
            className="input-field"
            type="datetime-local"
            value={endTime}
            min={startTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="label">Нотатки (необов'язково)</label>
          <input
            className="input-field"
            type="text"
            placeholder="Наприклад: парна гра"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        {hours > 0 && (
          <div className="booking-total">
            <span>
              {hours.toFixed(1)} год × {court.price_per_hour} грн
            </span>
            <span className="booking-total-price">{total.toFixed(0)} грн</span>
          </div>
        )}
        <div
          className="booking-notice"
          style={{
            background: "#fef3c7",
            border: "1px solid #fbbf24",
            borderRadius: "var(--radius-sm)",
            padding: "12px 16px",
            marginBottom: "16px",
            fontSize: "13px",
            color: "#92400e",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "16px" }}>ℹ️</span>
          <span>
            Для підтвердження бронювання потрібно оплатити не пізніше ніж за 24
            години до початку
          </span>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            className="btn btn-outline w-full"
            style={{ justifyContent: "center" }}
            onClick={onClose}
          >
            Скасувати
          </button>
          <button
            className="btn btn-primary w-full"
            style={{ justifyContent: "center" }}
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Бронюємо..." : "Підтвердити"}
          </button>
        </div>
        <style>{`
          .booking-total { display:flex; justify-content:space-between; align-items:center; background:var(--emerald-50); border-radius:var(--radius-sm); padding:12px 16px; font-size:14px; color:var(--gray-600); }
          .booking-total-price { font-family:'Cormorant Garamond',serif; font-size:24px; color:var(--emerald-800); font-weight:500; }
        `}</style>
      </div>
    </div>
  );
}
