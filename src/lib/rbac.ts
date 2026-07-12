import { auth } from "@/lib/auth"
import { Role } from "@prisma/client"
import { apiUnauthorized, apiForbidden } from "@/lib/api-response"

type CheckRoleResult =
  | { authorized: true; user: { id: string; role: Role; employeeId: string | null; employeeName: string | null }; status: 200; message: "OK" }
  | { authorized: false; user: null; status: number; message: string }

export async function getSession() {
  return await auth()
}

export async function checkRole(allowedRoles: Role[]): Promise<CheckRoleResult> {
  const session = await getSession()
  if (!session || !session.user) {
    return { authorized: false, status: 401, message: "Unauthorized", user: null }
  }
  
  if (!allowedRoles.includes(session.user.role)) {
    return { authorized: false, status: 403, message: "Forbidden", user: null }
  }
  
  return { 
    authorized: true, 
    user: {
      id: session.user.id,
      role: session.user.role,
      employeeId: session.user.employeeId,
      employeeName: session.user.employeeName
    }, 
    status: 200, 
    message: "OK" 
  }
}

export function rbacResponse(status: number, message: string) {
  if (status === 401) return apiUnauthorized(message)
  return apiForbidden(message)
}
