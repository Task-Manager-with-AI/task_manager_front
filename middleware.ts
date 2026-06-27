import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = ["/login", "/register", "/verify-email"]

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1]
    const json = Buffer.from(base64, "base64url").toString("utf-8")
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(process.env.COOKIE_NAME ?? "access_token")

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // Guard: admin routes require SUPER_ADMIN role
  if (pathname.startsWith("/admin")) {
    if (!token) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = "/login"
      loginUrl.searchParams.set("from", pathname)
      return NextResponse.redirect(loginUrl)
    }

    const payload = decodeJwtPayload(token.value)
    if (payload?.roleName !== "SUPER_ADMIN") {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = "/dashboard"
      dashboardUrl.searchParams.delete("from")
      return NextResponse.redirect(dashboardUrl)
    }

    return NextResponse.next()
  }

  if (!token && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token && isPublic) {
    const projectsUrl = request.nextUrl.clone()
    projectsUrl.pathname = "/projects"
    projectsUrl.searchParams.delete("from")
    return NextResponse.redirect(projectsUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|socket\\.io|_next/static|_next/image|favicon.ico|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
