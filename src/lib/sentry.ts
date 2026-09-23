import * as Sentry from "@sentry/react";

/**
 * Initialise Sentry for the frontend.
 * If VITE_SENTRY_DSN is not set, this is a no-op — no errors are sent.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? "production",
    // Capture 10% of sessions for performance traces.
    tracesSampleRate: 0.1,
    // Don't send PII.
    sendDefaultPii: false,
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      // Browser-extension noise that's not our problem
      "Top-frame denied",
    ],
    beforeSend(event) {
      // Strip user email from breadcrumbs as a belt-and-braces measure.
      if (event.user) {
        delete event.user.email;
      }
      return event;
    },
  });
}