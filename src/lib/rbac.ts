import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

type Role = "ADMIN" | "ASSET_MANAGER" | "DEPARTMENT_HEAD" | "EMPLOYEE" | "AUDITOR"

/**
 * Check if the current session user has one of the allowed roles.
 * Returns { session } on success, or null if unauthorized.
 */
export async function checkRole(allowedRoles: Role[]) {
  const session = await auth()
  if (!session?.user) {
    return null
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role as Role)) {
    return null
  }
  return { session }
}

/**
 * Standard 401/403 response helper for RBAC failures.
 */
export function rbacResponse(isAuthenticated: boolean = false) {
  if (!isAuthenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized — please log in" },
      { status: 401 }
    )
  }
  return NextResponse.json(
    { success: false, error: "Forbidden — insufficient permissions" },
    { status: 403 }
  )
}
