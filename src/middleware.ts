import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import Credentials from "next-auth/providers/credentials"

// Lightweight edge-safe Auth.js config — no Prisma, no bcrypt
// Only reads the JWT token to check if the user is logged in and their role
const { auth } = NextAuth({
  providers: [Credentials({})],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.employeeId = (user as any).employeeId
        token.employeeName = (user as any).employeeName
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
        ;(session.user as any).employeeId = token.employeeId
        ;(session.user as any).employeeName = token.employeeName
      }
      return session
    },
  },
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
})

const Role = {
  ADMIN: "ADMIN",
  AUDITOR: "AUDITOR",
  ASSET_MANAGER: "ASSET_MANAGER",
  EMPLOYEE: "EMPLOYEE",
  DEPARTMENT_HEAD: "DEPARTMENT_HEAD",
} as const

type RoleValue = (typeof Role)[keyof typeof Role]

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isAuthRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/signup") ||
    nextUrl.pathname.startsWith("/forgot-password")

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")
  const isPublicRoute = nextUrl.pathname === "/" || isApiAuthRoute

  if (isApiAuthRoute) return NextResponse.next()

  if (isAuthRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/screen-3", nextUrl))
    return NextResponse.next()
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  if (isLoggedIn && req.auth?.user) {
    const role = (req.auth.user as any).role as RoleValue

    if (nextUrl.pathname.startsWith("/organization") && role !== Role.ADMIN) {
      return NextResponse.redirect(new URL("/screen-3", nextUrl))
    }

    if (nextUrl.pathname.startsWith("/audits")) {
      const allowed: RoleValue[] = [Role.ADMIN, Role.AUDITOR, Role.ASSET_MANAGER]
      if (!allowed.includes(role)) {
        return NextResponse.redirect(new URL("/screen-3", nextUrl))
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|icons|.*\\..*).*)"  ],
}
