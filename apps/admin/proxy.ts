import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default function proxy(request: NextRequest) {
  // Allow static assets without auth
  const { pathname } = request.nextUrl

  // Skip auth for public assets
  if (
    pathname.startsWith("/images/") ||
    pathname.startsWith("/logos/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/sounds/") ||
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
