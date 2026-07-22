import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60_000;
const MAX_API_REQUESTS = 100;

function rateLimitCheck(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_API_REQUESTS;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (pathname.startsWith("/api/")) {
    if (!rateLimitCheck(ip)) {
      return NextResponse.json({ error: "Trop de requêtes. Réessayez dans un instant." }, {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  if (pathname.startsWith("/admin") && !pathname.includes("/login")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
