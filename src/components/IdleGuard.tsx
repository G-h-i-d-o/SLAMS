import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useIdleTimeout } from "../hooks/useIdleTimeout";
import IdleWarningModal from "./IdleWarningModal";

/** Total idle time before forced sign-out. */
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/** How long before sign-out to show the warning modal. */
const WARNING_AT_MS = 60 * 1000; // 60 seconds



/** Where the Login page looks for the logout reason. */
export const LOGOUT_REASON_KEY = "slams_logout_reason";

export default function IdleGuard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleIdle = useCallback(async () => {
    // Record the reason before signOut clears the session, so the Login
    // page can show the "you were signed out" notice.
    sessionStorage.setItem(LOGOUT_REASON_KEY, "idle");
    await signOut();
    navigate("/login", { replace: true });
  }, [signOut, navigate]);

  const { warning, extend } = useIdleTimeout({
    idleMs: IDLE_TIMEOUT_MS,
    warnMs: WARNING_AT_MS,
    enabled: !!user,
    onIdle: handleIdle,
  });

  return (
    <IdleWarningModal
      open={warning}
      secondsLeft={Math.round(WARNING_AT_MS / 1000)}
      onStay={extend}
      onLogout={handleIdle}
    />
  );
}