type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Simple in-memory rate limiter.
 * Returns null if the request is allowed, or a 429 response if it should
 * be blocked. Keys by IP by default.
 *
 * @param key        Unique identifier (typically an IP)
 * @param limit      Max requests allowed in the window
 * @param windowMs   Window length in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { statusCode: number; headers: Record<string, string>; body: string } | null {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return {
      statusCode: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(retryAfter),
      },
      body: JSON.stringify({
        error: `Too many requests. Try again in ${retryAfter} seconds.`,
      }),
    };
  }
  return null;
}

/** Extract the client IP from a Netlify Function event. */
export function getClientIp(headers: Record<string, string | undefined>): string {
  return (
    headers["x-nf-client-connection-ip"] ||
    headers["x-forwarded-for"]?.split(",")[0].trim() ||
    "unknown"
  );
}