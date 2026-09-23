import { useState, FormEvent, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import TurnstileWidget from "../components/ui/TurnstileWidget";

export default function Login() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: Location })?.from?.pathname ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const turnstileEnabled = !!import.meta.env.VITE_TURNSTILE_SITE_KEY;

  const onToken = useCallback((t: string) => setToken(t), []);

  if (user) {
    navigate(from, { replace: true });
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // If Turnstile is enabled but no token arrived, block the submit
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
        <h1>SLA Management Systems</h1>
        <p>Sign in to continue</p>

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
      </form>
    </div>
  );
}