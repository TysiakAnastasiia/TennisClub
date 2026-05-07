import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.login(form);
      login(data.access_token, data.role, form.email);
      toast.success("Ласкаво просимо!");
      setTimeout(() => navigate("/"), 300);
    } catch (err) {
      const msg = err.response?.data?.detail || "Невірний email або пароль";
      setError(msg);
      return false; // Запобігає перезавантаженню
    } finally {
      setLoading(false);
    }
    return false; // Додатковий захист
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">🎾</span>
          <h1>Увійти</h1>
          <p>Ласкаво просимо назад</p>
        </div>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <form onSubmit={handle} noValidate>
          <div className="form-group">
            <label className="label">Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                setError("");
              }}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Пароль</label>
            <div className="pw-wrap">
              <input
                className="input-field"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  setError("");
                }}
                required
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          <button
            className="btn btn-primary w-full"
            type="submit"
            disabled={loading}
            style={{ justifyContent: "center" }}
          >
            {loading ? "Входимо..." : "Увійти"}
          </button>
        </form>

        <p className="auth-footer">
          Немає акаунту? <Link to="/register">Зареєструватись</Link>
        </p>
        <div className="auth-hint">
          <p className="text-xs text-muted" style={{ marginBottom: 6 }}>
            Тестові акаунти:
          </p>
          <p className="text-xs text-muted">👑 admin@tennis.com / Admin123!</p>
          <p className="text-xs text-muted">🔧 staff@tennis.com / Staff123!</p>
          <p className="text-xs text-muted">
            🎾 client@tennis.com / Client123!
          </p>
        </div>
      </div>

      <style>{`
        .auth-page { min-height:calc(100vh - 64px); display:flex; align-items:center; justify-content:center; padding:40px 24px; background:linear-gradient(160deg,var(--emerald-50) 0%,white 60%); }
        .auth-card { background:white; border-radius:var(--radius); border:1px solid var(--emerald-100); padding:48px 40px; width:100%; max-width:420px; box-shadow:var(--shadow-lg); }
        .auth-header { text-align:center; margin-bottom:24px; }
        .auth-logo { font-size:40px; display:block; margin-bottom:12px; }
        .auth-header h1 { font-family:'Cormorant Garamond',serif; font-size:36px; font-weight:400; color:var(--emerald-900); margin-bottom:6px; }
        .auth-header p { color:var(--gray-400); font-size:14px; }
        .auth-error { background:#fee2e2; border:1px solid #fca5a5; border-radius:var(--radius-sm); padding:12px 16px; font-size:13px; color:#991b1b; margin-bottom:20px; }
        .auth-footer { text-align:center; margin-top:24px; font-size:14px; color:var(--gray-600); }
        .auth-footer a { color:var(--emerald-700); font-weight:500; }
        .auth-hint { margin-top:20px; padding:14px; background:var(--emerald-50); border-radius:var(--radius-sm); border:1px solid var(--emerald-100); }
        .pw-wrap { position:relative; }
        .pw-wrap .input-field { padding-right: 44px; }
        .pw-toggle { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:16px; padding:2px; line-height:1; }
      `}</style>
    </div>
  );
}
