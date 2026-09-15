import { useState, FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // If already signed in, redirect
  if (user) {
    navigate(from, { replace: true });
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
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

        <button className="btn btn-primary btn-block" type="submit" disabled={busy} style={{ padding: 11 }}>
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}