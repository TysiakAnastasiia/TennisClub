import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi, bookingApi, clubApi, eventApi, userApi } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuthStore } from "../store/authStore";

const TABS = [
  { id: "users", label: "👥 Користувачі" },
  { id: "clubs", label: "🏟️ Клуби" },
  { id: "courts", label: "🎾 Корти" },
  { id: "events", label: "🏆 Події" },
];

export default function Admin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();

  // Read ?tab= from URL
  const params = new URLSearchParams(location.search);
  const urlTab = params.get("tab");
  const [tab, setTab] = useState(urlTab || (isAdmin() ? "users" : "clubs"));

  const changeTab = (id) => {
    setTab(id);
    navigate(`/admin?tab=${id}`, { replace: true });
  };

  const visibleTabs = isAdmin() ? TABS : TABS.filter((t) => t.id !== "users");

  return (
    <div className="page-wrapper">
      <div className="mb-8">
        <span className="page-eyebrow">Управління</span>
        <h1 className="section-title">
          {isAdmin() ? "Панель адміністратора" : "Панель працівника"}
        </h1>
      </div>

      <div className="admin-tabs">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            className={`admin-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => changeTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {tab === "users" && isAdmin() && <UsersTab />}
        {tab === "clubs" && <ClubsTab />}
        {tab === "courts" && <CourtsTab />}
        {tab === "events" && <EventsTab />}
      </div>

      <style>{`
        .page-eyebrow { display:inline-block; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:var(--emerald-600); margin-bottom:12px; }
        .admin-tabs { display:flex; gap:4px; border-bottom:1px solid var(--gray-200); margin-bottom:32px; flex-wrap:wrap; }
        .admin-tab { padding:12px 20px; font-size:14px; color:var(--gray-500); border-bottom:2px solid transparent; transition:all var(--transition); cursor:pointer; background:none; border-top:none; border-left:none; border-right:none; font-family:inherit; white-space:nowrap; }
        .admin-tab:hover { color:var(--emerald-700); }
        .admin-tab.active { color:var(--emerald-800); border-bottom-color:var(--emerald-700); font-weight:500; }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────── USERS TAB ─────────────────────────────── */
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null); // { type, user }
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);

  const load = () =>
    authApi
      .listUsers()
      .then((r) => setUsers(r.data))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const doAction = async () => {
    const { type, user } = confirm;
    try {
      if (type === "activate") await authApi.activate(user.id);
      if (type === "deactivate") await authApi.deactivate(user.id);
      toast.success(type === "activate" ? "Активовано" : "Деактивовано");
    } catch {
      toast.error("Помилка");
    }
    setConfirm(null);
    load();
  };

  const roleLabel = {
    admin: "👑 Адмін",
    staff: "🔧 Персонал",
    client: "🎾 Клієнт",
  };

  if (loading)
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );

  return (
    <div>
      {confirm && (
        <ConfirmDialog
          title={
            confirm.type === "activate"
              ? "Активувати користувача?"
              : "Деактивувати користувача?"
          }
          message={`${confirm.user.email}`}
          confirmLabel={
            confirm.type === "activate" ? "Активувати" : "Деактивувати"
          }
          confirmClass={
            confirm.type === "activate" ? "btn-primary" : "btn-danger"
          }
          onConfirm={doAction}
          onCancel={() => setConfirm(null)}
        />
      )}
      {viewUser && (
        <UserViewModal user={viewUser} onClose={() => setViewUser(null)} />
      )}
      {editUser && (
        <UserEditModal
          user={editUser}
          onClose={() => {
            setEditUser(null);
            load();
          }}
        />
      )}

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="tab-heading">Користувачі ({users.length})</h2>
        <div className="search-wrap">
          <input
            className="input-field"
            placeholder="🔍 Пошук за email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
          />
        </div>
      </div>

      <div className="data-table">
        <div className="users-header">
          <span>Email</span>
          <span>Роль</span>
          <span>Статус</span>
          <span>Дії</span>
        </div>
        {filtered.length === 0 && (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              color: "var(--gray-400)",
            }}
          >
            Нічого не знайдено
          </div>
        )}
        {filtered.map((u) => (
          <div key={u.id} className="users-row">
            <span className="table-email">{u.email}</span>
            <span
              className={`badge ${u.role === "admin" ? "badge-amber" : u.role === "staff" ? "badge-emerald" : "badge-gray"}`}
            >
              {roleLabel[u.role]}
            </span>
            <span
              className={`badge ${u.is_active ? "badge-emerald" : "badge-red"}`}
            >
              {u.is_active ? "Активний" : "Неактивний"}
            </span>
            <div className="flex gap-2 flex-wrap">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setViewUser(u)}
              >
                Профіль
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setEditUser(u)}
              >
                Редагувати
              </button>
              {u.is_active ? (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: "#dc2626" }}
                  onClick={() => setConfirm({ type: "deactivate", user: u })}
                >
                  Деактив.
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setConfirm({ type: "activate", user: u })}
                >
                  Активувати
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .tab-heading { font-family:'Cormorant Garamond',serif; font-size:26px; color:var(--emerald-900); margin-bottom:0; }
        .data-table { border:1px solid var(--gray-200); border-radius:var(--radius); overflow:hidden; }
        .users-header { display:grid; grid-template-columns:2.5fr 1fr 1fr 2fr; gap:12px; padding:12px 20px; background:var(--emerald-50); font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--gray-400); }
        .users-row { display:grid; grid-template-columns:2.5fr 1fr 1fr 2fr; gap:12px; padding:14px 20px; border-top:1px solid var(--gray-100); align-items:center; font-size:14px; }
        .users-row:hover { background:var(--gray-50); }
        .table-email { color:var(--gray-800); font-size:13px; word-break:break-all; }
      `}</style>
    </div>
  );
}

function UserViewModal({ user, onClose }) {
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      userApi.getById(user.id).catch(() => ({ data: null })),
      bookingApi.list().catch(() => ({ data: [] })),
      // can't filter by user on backend without admin endpoint, filter client-side
    ]).then(([pRes, bRes]) => {
      setProfile(pRes.data);
      setBookings(bRes.data.filter((b) => b.user_id === user.id));
      setLoading(false);
    });
  }, [user.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 580, maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">Профіль користувача</h2>
        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div className="uv-header">
              <div className="uv-avatar">{user.email[0].toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 500 }}>
                  {profile?.first_name || ""} {profile?.last_name || ""}
                </div>
                <div className="text-sm text-muted">{user.email}</div>
                <div className="text-sm text-muted">
                  {profile?.phone || "—"}
                </div>
              </div>
            </div>
            {profile?.bio && <p className="uv-bio">{profile.bio}</p>}

            <h4 className="uv-section">Бронювання ({bookings.length})</h4>
            {bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="uv-row">
                <span>Корт #{b.court_id}</span>
                <span className="text-sm text-muted">
                  {format(new Date(b.start_time), "d MMM yyyy", { locale: uk })}
                </span>
                <span
                  className={`badge ${b.status === "confirmed" ? "badge-emerald" : b.status === "cancelled" ? "badge-red" : "badge-amber"}`}
                >
                  {b.status}
                </span>
                <span
                  style={{
                    fontFamily: "Cormorant Garamond",
                    serif,
                    fontSize: 18,
                  }}
                >
                  {b.total_price} грн
                </span>
              </div>
            ))}
            {bookings.length === 0 && (
              <p className="text-sm text-muted">Немає бронювань</p>
            )}

            <div className="flex justify-between mt-4">
              <button className="btn btn-outline" onClick={onClose}>
                Закрити
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .uv-header { display:flex; gap:16px; align-items:center; margin-bottom:20px; }
        .uv-avatar { width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg,var(--emerald-700),var(--emerald-500)); color:white; font-size:22px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .uv-bio { font-size:13px; color:var(--gray-600); background:var(--emerald-50); padding:12px; border-radius:var(--radius-sm); margin-bottom:16px; }
        .uv-section { font-family:'Cormorant Garamond',serif; font-size:20px; color:var(--emerald-900); margin:16px 0 10px; }
        .uv-row { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:8px; padding:10px 0; border-bottom:1px solid var(--gray-100); align-items:center; font-size:13px; }
      `}</style>
    </div>
  );
}

function UserEditModal({ user, onClose }) {
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await authApi.updateRole(user.id, role);
      toast.success("Роль оновлено");
      onClose();
    } catch {
      toast.error("Помилка");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 400 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">Редагувати: {user.email}</h2>
        <div className="form-group">
          <label className="label">Роль</label>
          <select
            className="input-field"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="client">🎾 Клієнт</option>
            <option value="staff">🔧 Персонал</option>
            <option value="admin">👑 Адміністратор</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-outline" onClick={onClose}>
            Скасувати
          </button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "Зберігаємо..." : "Зберегти"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── CLUBS TAB ─────────────────────────────── */
function ClubsTab() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editClub, setEditClub] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const emptyForm = {
    name: "",
    address: "",
    description: "",
    phone: "",
    email: "",
    image_url: "",
  };
  const [form, setForm] = useState(emptyForm);

  const load = () =>
    clubApi
      .list()
      .then((r) => setClubs(r.data))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditClub(null);
    setShowForm(true);
  };
  const openEdit = (club) => {
    setForm({
      name: club.name,
      address: club.address,
      description: club.description || "",
      phone: club.phone || "",
      email: club.email || "",
      image_url: club.image_url || "",
    });
    setEditClub(club);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.address) {
      toast.error("Назва і адреса обовʼязкові");
      return;
    }
    setSaving(true);
    try {
      if (editClub) {
        await clubApi.update(editClub.id, form);
        toast.success("Клуб оновлено");
      } else {
        await clubApi.create(form);
        toast.success("Клуб створено");
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Помилка");
    } finally {
      setSaving(false);
    }
  };

  const doDeactivate = async () => {
    try {
      await clubApi.deactivate(confirm.id);
      toast.success("Клуб деактивовано");
    } catch {
      toast.error("Помилка");
    }
    setConfirm(null);
    load();
  };

  if (loading)
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );

  return (
    <div>
      {confirm && (
        <ConfirmDialog
          title="Деактивувати клуб?"
          message={`«${confirm.name}» стане неактивним. Існуючі бронювання залишаться.`}
          confirmLabel="Деактивувати"
          confirmClass="btn-danger"
          onConfirm={doDeactivate}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="tab-heading">Клуби ({clubs.length})</h2>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          + Новий клуб
        </button>
      </div>

      {showForm && (
        <div className="admin-form card mb-6">
          <h3 className="admin-form-title">
            {editClub ? "Редагувати клуб" : "Новий клуб"}
          </h3>
          {[
            ["name", "Назва", "Tennis Club Захід"],
            ["address", "Адреса", "вул. Зелена, 1, Львів"],
            ["description", "Опис", "Опис клубу..."],
            ["phone", "Телефон", "+380 32 000-00-00"],
            ["email", "Email", "club@tennis.ua"],
            ["image_url", "URL зображення", "https://..."],
          ].map(([key, label, ph]) => (
            <div key={key} className="form-group">
              <label className="label">{label}</label>
              <input
                className="input-field"
                placeholder={ph}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="flex gap-3">
            <button
              className="btn btn-outline"
              onClick={() => setShowForm(false)}
            >
              Скасувати
            </button>
            <button
              className="btn btn-primary"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Зберігаємо..." : editClub ? "Оновити" : "Створити"}
            </button>
          </div>
        </div>
      )}

      <div className="admin-cards">
        {clubs.map((club) => (
          <div
            key={club.id}
            className={`card admin-club-row ${!club.is_active ? "inactive-club" : ""}`}
          >
            <div className="club-row-content">
              {club.image_url && (
                <img
                  src={club.image_url}
                  alt={club.name}
                  className="club-row-img"
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{club.name}</span>
                  {!club.is_active && (
                    <span className="badge badge-red">Неактивний</span>
                  )}
                </div>
                <div className="text-sm text-muted">
                  {club.address} ·{" "}
                  {club.courts?.filter((c) => c.is_active).length || 0} активних
                  кортів
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => openEdit(club)}
                >
                  Редагувати
                </button>
                {club.is_active && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: "#dc2626" }}
                    onClick={() => setConfirm(club)}
                  >
                    Деакт.
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .tab-heading { font-family:'Cormorant Garamond',serif; font-size:26px; color:var(--emerald-900); margin-bottom:0; }
        .admin-form { padding:28px; }
        .admin-form-title { font-family:'Cormorant Garamond',serif; font-size:22px; color:var(--emerald-900); margin-bottom:20px; }
        .admin-cards { display:flex; flex-direction:column; gap:12px; }
        .admin-club-row { }
        .inactive-club { opacity:0.55; filter:grayscale(0.4); }
        .club-row-content { display:flex; align-items:center; gap:16px; padding:16px 20px; }
        .club-row-img { width:60px; height:60px; object-fit:cover; border-radius:var(--radius-sm); flex-shrink:0; }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────── COURTS TAB ─────────────────────────────── */
function CourtsTab() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState("");
  const [editCourt, setEditCourt] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const emptyForm = {
    name: "",
    surface: "clay",
    is_indoor: false,
    price_per_hour: 200,
  };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () =>
    clubApi
      .list()
      .then((r) => setClubs(r.data))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setEditCourt(null);
    setShowForm(true);
  };
  const openEdit = (clubId, court) => {
    setEditCourt(court);
    setSelectedClub(String(clubId));
    setForm({
      name: court.name,
      surface: court.surface,
      is_indoor: court.is_indoor,
      price_per_hour: court.price_per_hour,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!selectedClub) {
      toast.error("Оберіть клуб");
      return;
    }
    if (!form.name) {
      toast.error("Введіть назву");
      return;
    }
    setSaving(true);
    try {
      if (editCourt) {
        await clubApi.updateCourt(selectedClub, editCourt.id, form);
        toast.success("Корт оновлено");
      } else {
        await clubApi.addCourt(selectedClub, form);
        toast.success("Корт додано");
      }
      setShowForm(false);
      setEditCourt(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Помилка");
    } finally {
      setSaving(false);
    }
  };

  const doDeactivate = async () => {
    try {
      await clubApi.deleteCourt(confirm.clubId, confirm.court.id);
      toast.success("Корт деактивовано");
    } catch {
      toast.error("Помилка");
    }
    setConfirm(null);
    load();
  };

  if (loading)
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );

  return (
    <div>
      {confirm && (
        <ConfirmDialog
          title="Деактивувати корт?"
          message={`«${confirm.court.name}» стане недоступним для бронювання.`}
          confirmLabel="Деактивувати"
          confirmClass="btn-danger"
          onConfirm={doDeactivate}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="tab-heading">Управління кортами</h2>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          + Додати корт
        </button>
      </div>

      {showForm && (
        <div className="admin-form card mb-6">
          <h3 className="admin-form-title">
            {editCourt ? "Редагувати корт" : "Новий корт"}
          </h3>
          <div className="form-group">
            <label className="label">Клуб</label>
            <select
              className="input-field"
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              disabled={!!editCourt}
            >
              <option value="">Оберіть клуб</option>
              {clubs
                .filter((c) => c.is_active)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Назва корту</label>
            <input
              className="input-field"
              placeholder="Корт A1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div>
              <label className="label">Покриття</label>
              <select
                className="input-field"
                value={form.surface}
                onChange={(e) => setForm({ ...form, surface: e.target.value })}
              >
                <option value="clay">Глина</option>
                <option value="hard">Хард</option>
                <option value="grass">Трава</option>
                <option value="indoor">Критий</option>
              </select>
            </div>
            <div>
              <label className="label">Ціна (грн/год)</label>
              <input
                className="input-field"
                type="number"
                value={form.price_per_hour}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price_per_hour: parseFloat(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <div
            className="form-group"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <input
              type="checkbox"
              id="indoor-chk"
              checked={form.is_indoor}
              onChange={(e) =>
                setForm({ ...form, is_indoor: e.target.checked })
              }
            />
            <label htmlFor="indoor-chk" className="label" style={{ margin: 0 }}>
              Критий корт
            </label>
          </div>
          <div className="flex gap-3">
            <button
              className="btn btn-outline"
              onClick={() => {
                setShowForm(false);
                setEditCourt(null);
              }}
            >
              Скасувати
            </button>
            <button
              className="btn btn-primary"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Зберігаємо..." : editCourt ? "Оновити" : "Додати"}
            </button>
          </div>
        </div>
      )}

      {clubs.map((club) => {
        const activeCourts = (club.courts || []).filter((c) => c.is_active);
        if (activeCourts.length === 0) return null;
        return (
          <div key={club.id} className="mb-6">
            <h3 className="courts-club-name">{club.name}</h3>
            <div className="data-table">
              <div className="court-th">
                <span>Назва</span>
                <span>Покриття</span>
                <span>Ціна</span>
                <span>Дії</span>
              </div>
              {activeCourts.map((court) => (
                <div key={court.id} className="court-tr">
                  <span className="font-medium">{court.name}</span>
                  <span className="text-sm">
                    {court.surface}
                    {court.is_indoor ? " 🏠" : ""}
                  </span>
                  <span>{court.price_per_hour} грн/год</span>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => openEdit(club.id, court)}
                    >
                      Редагувати
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: "#dc2626" }}
                      onClick={() => setConfirm({ clubId: club.id, court })}
                    >
                      Деакт.
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <style>{`
        .tab-heading { font-family:'Cormorant Garamond',serif; font-size:26px; color:var(--emerald-900); margin-bottom:0; }
        .admin-form { padding:28px; }
        .admin-form-title { font-family:'Cormorant Garamond',serif; font-size:22px; color:var(--emerald-900); margin-bottom:20px; }
        .courts-club-name { font-family:'Cormorant Garamond',serif; font-size:20px; color:var(--emerald-900); margin-bottom:10px; }
        .data-table { border:1px solid var(--gray-200); border-radius:var(--radius); overflow:hidden; }
        .court-th { display:grid; grid-template-columns:2fr 1fr 1fr 2fr; gap:12px; padding:12px 20px; background:var(--emerald-50); font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--gray-400); }
        .court-tr { display:grid; grid-template-columns:2fr 1fr 1fr 2fr; gap:12px; padding:14px 20px; border-top:1px solid var(--gray-100); align-items:center; font-size:14px; }
        .court-tr:hover { background:var(--gray-50); }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────── EVENTS TAB ─────────────────────────────── */
function EventsTab() {
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "tournament",
    club_id: "",
    start_time: "",
    end_time: "",
    max_participants: "",
    price: 0,
    image_url: "",
  });

  const load = async () => {
    const [ev, cl] = await Promise.all([eventApi.list(), clubApi.list()]);
    setEvents(ev.data);
    setClubs(cl.data);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.title || !form.club_id || !form.start_time || !form.end_time) {
      toast.error("Заповніть всі обов'язкові поля");
      return;
    }
    setSaving(true);
    try {
      await eventApi.create({
        ...form,
        club_id: parseInt(form.club_id),
        max_participants: form.max_participants
          ? parseInt(form.max_participants)
          : null,
        price: parseFloat(form.price) || 0,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      });
      toast.success("Подію створено");
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Помилка");
    } finally {
      setSaving(false);
    }
  };

  const doDeactivate = async () => {
    try {
      await eventApi.deactivate(confirm.id);
      toast.success("Подію деактивовано");
    } catch {
      toast.error("Помилка");
    }
    setConfirm(null);
    load();
  };

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.start_time) - new Date(b.start_time)
  );

  if (loading)
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );

  const typeLabel = {
    tournament: "🏆 Турнір",
    training: "🎯 Тренування",
    open_play: "🎾 Відкрита гра",
    other: "📌 Інше",
  };

  return (
    <div>
      {confirm && (
        <ConfirmDialog
          title="Деактивувати подію?"
          message={`«${confirm.title}» стане невидимою для користувачів.`}
          confirmLabel="Деактивувати"
          confirmClass="btn-danger"
          onConfirm={doDeactivate}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="tab-heading">Події ({events.length})</h2>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "✕ Скасувати" : "+ Нова подія"}
        </button>
      </div>

      {showForm && (
        <div className="admin-form card mb-6">
          <h3 className="admin-form-title">Нова подія</h3>
          <div className="form-group">
            <label className="label">Назва *</label>
            <input
              className="input-field"
              placeholder="Літній турнір"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="label">Опис</label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Опис події..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              style={{ resize: "vertical" }}
            />
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div className="form-group">
              <label className="label">Тип</label>
              <select
                className="input-field"
                value={form.event_type}
                onChange={(e) =>
                  setForm({ ...form, event_type: e.target.value })
                }
              >
                <option value="tournament">🏆 Турнір</option>
                <option value="training">🎯 Тренування</option>
                <option value="open_play">🎾 Відкрита гра</option>
                <option value="other">📌 Інше</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Клуб *</label>
              <select
                className="input-field"
                value={form.club_id}
                onChange={(e) => setForm({ ...form, club_id: e.target.value })}
              >
                <option value="">Оберіть клуб</option>
                {clubs
                  .filter((c) => c.is_active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Початок *</label>
              <input
                className="input-field"
                type="datetime-local"
                value={form.start_time}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) =>
                  setForm({ ...form, start_time: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="label">Кінець *</label>
              <input
                className="input-field"
                type="datetime-local"
                value={form.end_time}
                min={form.start_time || new Date().toISOString().slice(0, 16)}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">Макс. учасників</label>
              <input
                className="input-field"
                type="number"
                placeholder="32"
                value={form.max_participants}
                onChange={(e) =>
                  setForm({ ...form, max_participants: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="label">Вартість (грн)</label>
              <input
                className="input-field"
                type="number"
                placeholder="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="label">URL зображення</label>
            <input
              className="input-field"
              placeholder="https://..."
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={create}
            disabled={saving}
          >
            {saving ? "Створюємо..." : "Створити подію"}
          </button>
        </div>
      )}

      <div className="admin-cards">
        {sortedEvents.map((ev) => (
          <div key={ev.id} className="card" style={{ padding: "16px 20px" }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {ev.image_url && (
                  <img
                    src={ev.image_url}
                    alt=""
                    style={{
                      width: 48,
                      height: 48,
                      objectFit: "cover",
                      borderRadius: 8,
                      flexShrink: 0,
                    }}
                  />
                )}
                <div>
                  <div className="font-medium">{ev.title}</div>
                  <div className="text-sm text-muted">
                    {typeLabel[ev.event_type]} ·{" "}
                    {format(new Date(ev.start_time), "d MMM yyyy, HH:mm", {
                      locale: uk,
                    })}
                  </div>
                  <div className="text-sm text-muted">
                    👥 {ev.participant_count}/{ev.max_participants || "∞"} ·{" "}
                    {ev.price > 0 ? `${ev.price} грн` : "Безкоштовно"}
                  </div>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: "#dc2626" }}
                onClick={() => setConfirm(ev)}
              >
                Деактивувати
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .tab-heading { font-family:'Cormorant Garamond',serif; font-size:26px; color:var(--emerald-900); margin-bottom:0; }
        .admin-form { padding:28px; }
        .admin-form-title { font-family:'Cormorant Garamond',serif; font-size:22px; color:var(--emerald-900); margin-bottom:20px; }
        .admin-cards { display:flex; flex-direction:column; gap:12px; }
      `}</style>
    </div>
  );
}
