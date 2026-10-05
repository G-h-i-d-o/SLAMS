import { useCallback, useEffect, useRef, useState } from "react";

const ACTIVITY_KEY = "slams_last_activity";
const THROTTLE_MS = 2000;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "wheel",
  "touchstart",
  "focus",
];

type Options = {
  /** Total idle time before forced logout, in ms. */
  idleMs: number;
  /** How long before logout to show the warning, in ms. */
  warnMs: number;
  /** When false, the timer is disabled (used when signed out). */
  enabled: boolean;
  /** Called when the idle time elapses. */
  onIdle: () => void;
};

export function useIdleTimeout({
  idleMs,
  warnMs,
  enabled,
  onIdle,
}: Options) {
  const [warning, setWarning] = useState(false);
  const lastWriteRef = useRef(0);
  const idleTimerRef = useRef<number | null>(null);
  const warnTimerRef = useRef<number | null>(null);
  const onIdleRef = useRef(onIdle);

  // Always call the latest onIdle without restarting the effect
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (warnTimerRef.current !== null) {
      window.clearTimeout(warnTimerRef.current);
      warnTimerRef.current = null;
    }
  }, []);

  const scheduleTimers = useCallback(() => {
    clearTimers();

    const now = Date.now();
    const stored = Number(localStorage.getItem(ACTIVITY_KEY) ?? 0);
    const last = stored > 0 && stored <= now ? stored : now;
    const elapsed = now - last;
    const remaining = Math.max(0, idleMs - elapsed);

    if (remaining <= 0) {
      setWarning(false);
      onIdleRef.current();
      return;
    }

    if (remaining <= warnMs) {
      setWarning(true);
    } else {
      warnTimerRef.current = window.setTimeout(() => {
        setWarning(true);
      }, remaining - warnMs);
    }

    idleTimerRef.current = window.setTimeout(() => {
      setWarning(false);
      onIdleRef.current();
    }, remaining);
  }, [idleMs, warnMs, clearTimers]);

  const touch = useCallback(() => {
    const now = Date.now();
    if (now - lastWriteRef.current < THROTTLE_MS) return;
    lastWriteRef.current = now;
    localStorage.setItem(ACTIVITY_KEY, String(now));
    setWarning(false);
    scheduleTimers();
  }, [scheduleTimers]);

  const extend = useCallback(() => {
    lastWriteRef.current = Date.now();
    localStorage.setItem(ACTIVITY_KEY, String(lastWriteRef.current));
    setWarning(false);
    scheduleTimers();
  }, [scheduleTimers]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      setWarning(false);
      return;
    }

    // Seed on mount so the first window starts now
    lastWriteRef.current = Date.now();
    localStorage.setItem(ACTIVITY_KEY, String(lastWriteRef.current));
    scheduleTimers();

    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, touch, { passive: true })
    );

    // Cross-tab sync — another tab updated the timestamp
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVITY_KEY && e.newValue) {
        setWarning(false);
        scheduleTimers();
      }
    };
    window.addEventListener("storage", onStorage);

    // Background tabs get their timers throttled by the browser.
    // Re-check the elapsed time whenever the tab becomes visible again.
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        scheduleTimers();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      ACTIVITY_EVENTS.forEach((ev) =>
        window.removeEventListener(ev, touch)
      );
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimers();
    };
  }, [enabled, touch, scheduleTimers, clearTimers]);

  return { warning, extend };
}