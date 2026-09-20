/** Simple in-memory IP rate limiter for guest AI / public endpoints (cPanel-safe). */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function checkIpRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true };
}

export function getClientIp(headerBag: Headers | null | undefined): string {
  if (!headerBag) return "unknown";
  return (
    headerBag.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerBag.get("x-real-ip") ||
    "unknown"
  );
}
