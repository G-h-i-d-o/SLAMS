import { useEffect, useState, FormEvent, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import TurnstileWidget from "../components/ui/TurnstileWidget";
import { LOGOUT_REASON_KEY } from "../components/IdleGuard";

type Reason = "idle" | null;

export default function Login() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const rawFrom = (location.state as { from?: Location })?.from?.pathname;
  const from =
    rawFrom && rawFrom !== "/" && rawFrom !== "/login"
      ? rawFrom
      : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState<Reason>(null);

  const turnstileEnabled = !!import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const onToken = useCallback((t: string) => setToken(t), []);

  // Check for a logout reason left by IdleGuard
  useEffect(() => {
    const r = sessionStorage.getItem(LOGOUT_REASON_KEY);
    if (r === "idle") {
      setReason("idle");
      sessionStorage.removeItem(LOGOUT_REASON_KEY);
    }
  }, []);

  if (user) {
    navigate(from, { replace: true });
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setReason(null);

    if (turnstileEnabled && !token) {
      setError("Please complete the security check.");
      return;
    }

    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-brand">
          <div className="login-brand-mark">SLAMS</div>
        </div>

        <h1>SLA Management System</h1>
        <p>Sign in to continue</p>

        {reason === "idle" && (
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1e40af",
              padding: "10px 12px",
              borderRadius: 9,
              fontSize: 12,
              marginBottom: 14,
              display: "flex",
              gap: 9,
              alignItems: "flex-start",
              lineHeight: 1.5,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: 1 }}
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>
              You were signed out automatically after a period of inactivity.
              Sign in again to continue.
            </span>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <TurnstileWidget onToken={onToken} />

        <button
          className="btn btn-primary btn-block"
          type="submit"
          disabled={busy || (turnstileEnabled && !token)}
          style={{ padding: 11 }}
        >
          {busy ? "Signing in…" : "Sign In"}
        </button>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 12 }}>
          <Link to="/" style={{ color: "var(--muted)" }}>
            ← Back to home
          </Link>
        </div>
      </form>
    </div>
  );
}