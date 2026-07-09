// Simple in-memory sliding-window rate limiter. Good enough for a single-instance
// deployment; swap for a shared store (Redis, etc.) if the app ever runs multi-instance.
interface Entry {
  timestamps: number[];
  windowMs: number;
}

const hits = new Map<string, Entry>();
const MAX_ENTRIES_BEFORE_SWEEP = 5000;

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = hits.get(key);
  const timestamps = (existing?.timestamps ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    hits.set(key, { timestamps, windowMs });
    return false;
  }

  timestamps.push(now);
  hits.set(key, { timestamps, windowMs });

  // Bound memory growth: once the map gets large, sweep out entries whose
  // window has fully expired instead of letting stale keys accumulate forever.
  if (hits.size > MAX_ENTRIES_BEFORE_SWEEP) {
    for (const [k, entry] of hits) {
      const fresh = entry.timestamps.filter((t) => now - t < entry.windowMs);
      if (fresh.length === 0) {
        hits.delete(k);
      } else {
        hits.set(k, { timestamps: fresh, windowMs: entry.windowMs });
      }
    }
  }

  return true;
}

export function clientIp(request: Request): string {
  // Trust assumption: these headers are only reliable when a reverse proxy
  // (e.g. Vercel, nginx) sets them and strips any client-supplied value first.
  // Without such a proxy in front of the app, a client can spoof these headers
  // and bypass IP-based rate limiting.
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
