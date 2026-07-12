import { NextRequest, NextResponse } from "next/server"
import { EmployeeService } from "@/services/employee.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"

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

    const employees = await EmployeeService.getEmployees({
      search,
      departmentId,
      status,
      role
    })

    return NextResponse.json(employees)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
export const runtime = "nodejs"
