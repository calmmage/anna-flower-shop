import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if the request is for an admin page (except the login page)
  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/admin$") &&
    !request.nextUrl.pathname === "/admin"
  ) {
    // Check if the user is authenticated
    const authCookie = request.cookies.get("admin-auth")

    if (!authCookie) {
      // Redirect to the login page if not authenticated
      return NextResponse.redirect(new URL("/admin", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/admin/:path*",
}

