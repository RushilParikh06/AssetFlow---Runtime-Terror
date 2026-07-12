import { NextRequest, NextResponse } from "next/server"
import { DepartmentService } from "@/services/department.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"

export async function GET(req: NextRequest) {
  // Allow all logged-in roles to query departments
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
    const statusParam = searchParams.get("status")
    
    let status: boolean | undefined = undefined
    if (statusParam === "true" || statusParam === "active") {
      status = true
    } else if (statusParam === "false" || statusParam === "inactive") {
      status = false
    }

    const departments = await DepartmentService.getAllDepartments({ status })
    return NextResponse.json(departments)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  // Gated strictly to Admin
  const rbac = await checkRole([Role.ADMIN])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const body = await req.json()
    const { name, code, description, parentDepartmentId, departmentHeadId } = body
    
    if (!name || !code) {
      return NextResponse.json(
        { error: "Name and Code are required fields" },
        { status: 400 }
      )
    }

    const department = await DepartmentService.createDepartment({
      name,
      code,
      description,
      parentDepartmentId,
      departmentHeadId
    })
    
    return NextResponse.json(department, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 }
    )
  }
}
export const runtime = "nodejs"
