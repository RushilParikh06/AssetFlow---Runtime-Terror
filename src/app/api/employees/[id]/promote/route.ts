import { NextRequest } from "next/server"
import { EmployeeService } from "@/services/employee.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"
import { apiSuccess, apiServerError, apiValidationError } from "@/lib/api-response"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rbac = await checkRole([Role.ADMIN])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { role } = body

    if (!role || !Object.values(Role).includes(role as Role)) {
      return apiValidationError("A valid role selection is required", "role")
    }

    const updatedUser = await EmployeeService.promoteEmployee(id, role as Role)
    
    return apiSuccess({
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role
    }, 200, `Employee role successfully updated to ${role}`)
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}
export const runtime = "nodejs"
