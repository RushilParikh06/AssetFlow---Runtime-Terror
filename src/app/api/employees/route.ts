import { NextRequest } from "next/server"
import { EmployeeService } from "@/services/employee.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"
import { apiPaginated, apiServerError, parsePagination } from "@/lib/api-response"

export async function GET(req: NextRequest) {
  const rbac = await checkRole([
    Role.ADMIN,
    Role.ASSET_MANAGER,
    Role.DEPARTMENT_HEAD,
    Role.EMPLOYEE,
    Role.AUDITOR
  ])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const { page, pageSize, skip, take } = parsePagination(searchParams)
    const search = searchParams.get("search") || undefined
    const departmentId = searchParams.get("departmentId") || undefined
    const roleParam = searchParams.get("role") as Role | null
    const role = roleParam && Object.values(Role).includes(roleParam) ? roleParam : undefined
    
    const statusParam = searchParams.get("status")
    let status: boolean | undefined = undefined
    if (statusParam === "active" || statusParam === "true") {
      status = true
    } else if (statusParam === "inactive" || statusParam === "false") {
      status = false
    }

    const { items, total } = await EmployeeService.getEmployees({
      search,
      departmentId,
      status,
      role,
      skip,
      take
    })

    return apiPaginated(items, total, page, pageSize)
  } catch (error: any) {
    return apiServerError(error.message || "Internal Server Error")
  }
}
export const runtime = "nodejs"
