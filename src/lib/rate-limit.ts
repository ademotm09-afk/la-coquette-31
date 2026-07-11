const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

export function rateLimit(identifier: string, limit = MAX_REQUESTS, windowMs = WINDOW_MS): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: limit - entry.count };
}

export function getRateLimitHeaders(identifier: string): Record<string, string> {
  const entry = rateLimitMap.get(identifier);
  const remaining = entry ? Math.max(0, MAX_REQUESTS - entry.count) : MAX_REQUESTS;
  const resetSeconds = entry ? Math.ceil((entry.resetTime - Date.now()) / 1000) : 60;
  return {
    "X-RateLimit-Limit": String(MAX_REQUESTS),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(resetSeconds),
  };
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, "").replace(/javascript:/gi, "").replace(/on\w+\s*=/gi, "").trim();
}
