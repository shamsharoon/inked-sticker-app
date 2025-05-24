import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect /app routes
  if (req.nextUrl.pathname.startsWith("/app")) {
    if (!user) {
      return NextResponse.redirect(new URL("/signin", req.url))
    }
  }

  // Redirect authenticated users away from signin
  if (req.nextUrl.pathname === "/signin" && user) {
    return NextResponse.redirect(new URL("/app", req.url))
  }

  return res
}

export const config = {
  matcher: ["/app/:path*", "/signin"],
}
