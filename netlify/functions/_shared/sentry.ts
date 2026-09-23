import * as Sentry from "@sentry/node";

let initialized = false;

function ensureInit() {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    Sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT ?? "production",
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
    });
  }
  initialized = true;
}

/**
 * Wrap a Netlify Function handler so any thrown error is captured by Sentry
 * and the caller receives a structured 500.
 *
 * Usage:
 *   export const handler = withSentry(async (event) => { ... });
 */
export function withSentry<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    ensureInit();
    try {
      return await fn(...args);
    } catch (err) {
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(err, {
          extra: { path: (args[0] as { path?: string })?.path ?? "unknown" },
        });
      }
      console.error("[netlify-function] Unhandled error:", err);
      return {
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ok: false,
          error: err instanceof Error ? err.message : "Internal error",
        }),
      };
    }
  }) as unknown as T;
}