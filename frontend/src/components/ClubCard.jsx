import { useState } from "react";
import toast from "react-hot-toast";
import { clubApi } from "../api";

const surfaceLabel = {
  clay: "Глина",
  hard: "Хард",
  grass: "Трава",
  indoor: "Критий",
};
const surfaceColor = {
  clay: "#b45309",
  hard: "#1d4ed8",
  grass: "#15803d",
  indoor: "#7c3aed",
};

export default function ClubCard({ club }) {
  const [showPayment, setShowPayment] = useState(false);
  const [editing, setEditing] = useState(false);
  const [card, setCard] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  // Test cards for clubs
  const testCards = [
    {
      number: "4242 4242 4242 4242",
      expiry: "12/28",
      cvv: "123",
      name: "TEST CARD 1",
    },
    {
      number: "5555 5555 5555 4444",
      expiry: "09/27",
      cvv: "456",
      name: "TEST CARD 2",
    },
    {
      number: "3782 822463 10005",
      expiry: "06/29",
      cvv: "789",
      name: "TEST CARD 3",
    },
  ];

  const fillWithTestData = (cardIndex) => {
    const testCard = testCards[cardIndex];
    if (testCard) {
      setCard(testCard);
      toast.success(`Заповнено тестовими даними картки ${cardIndex + 1}`);
    }
  };

  const formatCard = (val) =>
    val
      .replace(/\D/g, "")
      .replace(/(.{4})/g, "$1 ")
      .trim()
      .slice(0, 19);
  const formatExpiry = (val) => {
    const v = val.replace(/\D/g, "");
    return v.length >= 2 ? v.slice(0, 2) + "/" + v.slice(2, 4) : v;
  };

  const handleCardPayment = async () => {
    if (card.number.replace(/\s/g, "").length < 16) {
      toast.error("Введіть номер картки");
      return;
    }
    if (card.expiry.length < 5) {
      toast.error("Введіть термін дії");
      return;
    }
    if (card.cvv.length < 3) {
      toast.error("Введіть CVV");
      return;
    }
    if (!card.name) {
      toast.error("Введіть ім'я власника");
      return;
    }

    try {
      await clubApi.payMembership(club.id, {
        card_number: card.number,
        card_expiry: card.expiry,
        card_cvv: card.cvv,
        card_name: card.name,
      });
      toast.success("Оплату клубної картки підтверджено! 🎾");
      setShowPayment(false);
      setEditing(false);
      setCard({ number: "", expiry: "", cvv: "", name: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Помилка оплати");
    }
  };

  const activeCourts = club.courts?.filter((c) => c.is_active) || [];
  const surfaces = [...new Set(activeCourts.map((c) => c.surface))];
  const minPrice = activeCourts.length
    ? Math.min(...activeCourts.map((c) => c.price_per_hour))
    : null;

  return (
    <div className="club-card card">
      <div className="club-img-wrap">
        {club.image_url ? (
          <img src={club.image_url} alt={club.name} className="club-img" />
        ) : (
          <div className="club-img-placeholder">🎾</div>
        )}
        <div className="club-img-overlay" />
        {minPrice && (
          <div className="club-price-badge">від {minPrice} грн/год</div>
        )}
      </div>
      <div className="club-body">
        <h3 className="club-name">{club.name}</h3>
        <p className="club-address">📍 {club.address}</p>
        {club.description && <p className="club-desc">{club.description}</p>}

        {/* Club membership info */}
        <div className="club-info">
          <div className="info-row">
            <span className="info-label">📞 Телефон:</span>
            <span className="info-value">
              {club.phone || "+380 44 123 456"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">📅 Дата реєстрації:</span>
            <span className="info-value">
              {club.registration_date || "15.01.2020"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">💳 Картка клубу:</span>
            <span className="info-value">
              {club.has_membership_card ? (
                <span className="card-display">
                  <span className="card-number">•••• ••• •••</span>
                  <span className="card-info">
                    <span className="card-name">
                      {club.card_name || "MEMBERSHIP"}
                    </span>
                    <span className="card-expiry">
                      {club.card_expiry || "12/28"}
                    </span>
                    <span className="card-cvv">CVV</span>
                  </span>
                </span>
              ) : (
                <div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setEditing(true)}
                  >
                    Оформити картку
                  </button>
                  <div className="test-cards">
                    <span className="test-label">Тестові картки:</span>
                    {testCards.map((testCard, index) => (
                      <button
                        key={index}
                        className="test-card-btn"
                        onClick={() => fillWithTestData(index)}
                        title={`Картка ${index + 1}: ${testCard.name}`}
                      >
                        🎾 {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </span>
          </div>
        </div>

        {/* Court info */}
        <div className="club-meta">
          <span className="club-courts-count">
            {activeCourts.length} кортів
          </span>
          <div className="surface-tags">
            {surfaces.map((s) => (
              <span
                key={s}
                className="surface-tag"
                style={{
                  background: surfaceColor[s] + "18",
                  color: surfaceColor[s],
                }}
              >
                {surfaceLabel[s]}
              </span>
            ))}
          </div>
        </div>

        {/* Payment form */}
        {editing && !club.has_membership_card && (
          <div className="payment-form">
            <h4>Оформлення клубної картки</h4>
            <div className="form-group">
              <label className="label">Номер картки</label>
              <input
                className="input-field"
                placeholder="0000 0000 0000 0000"
                value={card.number}
                onChange={(e) =>
                  setCard({ ...card, number: formatCard(e.target.value) })
                }
                maxLength={19}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div className="form-group">
                <label className="label">Термін дії</label>
                <input
                  className="input-field"
                  placeholder="ММ/РР"
                  value={card.expiry}
                  onChange={(e) =>
                    setCard({ ...card, expiry: formatExpiry(e.target.value) })
                  }
                  maxLength={5}
                />
              </div>
              <div className="form-group">
                <label className="label">CVV</label>
                <input
                  className="input-field"
                  placeholder="•••"
                  type="password"
                  value={card.cvv}
                  onChange={(e) =>
                    setCard({
                      ...card,
                      cvv: e.target.value.replace(/\D/g, "").slice(0, 3),
                    })
                  }
                  maxLength={3}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Ім'я власника</label>
              <input
                className="input-field"
                placeholder="OLENA KOVALENKO"
                value={card.name}
                onChange={(e) =>
                  setCard({ ...card, name: e.target.value.toUpperCase() })
                }
              />
            </div>
            <div className="flex gap-3">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setEditing(false);
                  setCard({ number: "", expiry: "", cvv: "", name: "" });
                }}
              >
                Скасувати
              </button>
              <button className="btn btn-primary" onClick={handleCardPayment}>
                Оплатити 500 грн
              </button>
            </div>
          </div>
        )}

        {/* Payment modal */}
        {showPayment && (
          <div
            className="payment-modal-overlay"
            onClick={() => setShowPayment(false)}
          >
            <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Підтвердження оплати</h3>
              <div className="payment-summary">
                <span>Клубна картка: {club.name}</span>
                <span className="pay-amount">500 грн/рік</span>
              </div>
              <div className="card-visual">
                <div className="card-visual-chip">▬▬</div>
                <div className="card-visual-number">
                  {card.number || "•••• ••• ••• •••"}
                </div>
                <div className="card-visual-bottom">
                  <div>
                    <div className="card-visual-label">Власник</div>
                    <div>{card.name || "ІМ'Я ПРІЗВИЩЕ"}</div>
                  </div>
                  <div>
                    <div className="card-visual-label">Дійсна до</div>
                    <div>{card.expiry || "ММ/РР"}</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  className="btn btn-outline"
                  onClick={() => setShowPayment(false)}
                >
                  Закрити
                </button>
                <button className="btn btn-primary">Підтвердити оплату</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .club-card { display: flex; flex-direction: column; cursor: pointer; }
        .club-img-wrap { position: relative; height: 200px; overflow: hidden; flex-shrink: 0; }
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
        .club-info {
          background: var(--emerald-50);
          border-radius: var(--radius-sm);
          padding: 16px;
          margin-bottom: 12px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .info-label { font-size: 12px; color: var(--gray-600); }
        .info-value { font-size: 13px; color: var(--gray-800); font-weight: 500; }
        .card-display {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--emerald-100);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--emerald-200);
        }
        .card-number { font-family: 'Courier New', monospace; letter-spacing: 2px; font-size: 14px; }
        .card-info { display: flex; flex-direction: column; gap: 2px; }
        .card-name { font-weight: 600; font-size: 12px; color: var(--emerald-700); }
        .card-expiry { font-size: 11px; color: var(--gray-600); }
        .card-cvv { 
          background: var(--emerald-200);
          color: var(--emerald-800);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }
        .payment-form {
          background: var(--emerald-50);
          border-radius: var(--radius-sm);
          padding: 16px;
          margin-bottom: 12px;
        }
        .payment-form h4 { 
          margin: 0 0 16px 0; 
          color: var(--emerald-900); 
          font-size: 18px; 
        }
        .payment-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .payment-modal {
          background: white;
          border-radius: var(--radius-lg);
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: var(--shadow-lg);
        }
        .payment-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--emerald-50);
          border-radius: var(--radius-sm);
          padding: 12px 16px;
          margin-bottom: 20px;
          font-size: 14px;
          color: var(--gray-600);
        }
        .pay-amount { 
          font-family: 'Cormorant Garamond', serif; 
          font-size: 20px; 
          color: var(--emerald-800); 
        }
        .card-visual {
          background: linear-gradient(135deg, var(--emerald-900), var(--emerald-600));
          border-radius: 12px; padding: 24px; margin-bottom: 20px; color: white;
          font-family: 'Courier New', monospace; letter-spacing: 1px;
        }
        .card-visual-chip { font-size: 20px; margin-bottom: 20px; opacity: 0.8; }
        .card-visual-number { font-size: 18px; letter-spacing: 3px; margin-bottom: 20px; min-height: 24px; }
        .card-visual-bottom { display: flex; justify-content: space-between; font-size: 13px; }
        .card-visual-label { font-size: 10px; opacity: 0.7; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
        .test-cards {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .test-label {
          font-size: 11px;
          color: var(--gray-600);
          margin-bottom: 6px;
          display: block;
        }
        .test-card-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: var(--emerald-100);
          border: 1px solid var(--emerald-200);
          border-radius: var(--radius-sm);
          font-size: 11px;
          color: var(--emerald-700);
          cursor: pointer;
          transition: all var(--transition);
        }
        .test-card-btn:hover {
          background: var(--emerald-200);
          border-color: var(--emerald-300);
        }
      `}</style>
    </div>
  );
}
