import { auth } from "@/lib/auth"
import { Role } from "@prisma/client"
import { apiUnauthorized, apiForbidden } from "@/lib/api-response"

type CheckRoleResult =
  | { authorized: true; user: { id: string; role: Role; employeeId: string | null; employeeName: string | null }; session: any; status: 200; message: "OK" }
  | { authorized: false; user: null; session: null; status: number; message: string }

export async function getSession() {
  return await auth()
}

export async function checkRole(allowedRoles: Role[]): Promise<CheckRoleResult> {
  const session = await getSession()
  if (!session || !session.user) {
    return { authorized: false, status: 401, message: "Unauthorized", user: null, session: null }
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role as Role)) {
    return { authorized: false, status: 403, message: "Forbidden", user: null, session: null }
  }
  
  return { 
    authorized: true, 
    user: {
      id: session.user.id,
      role: session.user.role as Role,
      employeeId: session.user.employeeId,
      employeeName: session.user.employeeName
    },
    session,
    status: 200, 
    message: "OK" 
  }
}

export function rbacResponse(param1: boolean | number, param2?: string) {
  if (typeof param1 === "boolean") {
    const isAuthenticated = param1
    if (!isAuthenticated) {
      return apiUnauthorized("Unauthorized — please log in")
    }
    return apiForbidden("Forbidden — insufficient permissions")
  } else {
    const status = param1
    const message = param2 || "Access denied"
    if (status === 401) {
      return apiUnauthorized(message)
    }
    return apiForbidden(message)
  }
}
