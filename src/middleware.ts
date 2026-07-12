import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { Role } from "@prisma/client"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  
  const isAuthRoute = 
    nextUrl.pathname.startsWith("/login") || 
    nextUrl.pathname.startsWith("/signup") || 
    nextUrl.pathname.startsWith("/forgot-password")
    
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")
  // Public assets, manifest, etc.
  const isPublicRoute = nextUrl.pathname === "/" || isApiAuthRoute
  
  if (isApiAuthRoute) {
    return NextResponse.next()
  }
  
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/screen-3", nextUrl))
    }
    return NextResponse.next()
  }
  
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }
  
  // Page-level Role-Based Access Control (RBAC)
  if (isLoggedIn && req.auth?.user) {
    const role = req.auth.user.role
    
    // Organization Setup is Admin only
    if (nextUrl.pathname.startsWith("/organization") && role !== Role.ADMIN) {
      return NextResponse.redirect(new URL("/screen-3", nextUrl))
    }
    
    // Audits page requires ADMIN, AUDITOR, or ASSET_MANAGER
    if (nextUrl.pathname.startsWith("/audits")) {
      const allowed: Role[] = [Role.ADMIN, Role.AUDITOR, Role.ASSET_MANAGER]
      if (!allowed.includes(role as Role)) {
        return NextResponse.redirect(new URL("/screen-3", nextUrl))
      }
    }
  }
  
  return NextResponse.next()
})

// Match all application routes except static files and public assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|icons|.*\\..*).*)",
  ],
}
