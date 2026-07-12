import { NextRequest, NextResponse } from "next/server"
import { DepartmentService } from "@/services/department.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    const department = await DepartmentService.getDepartmentById(id)
    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }
    return NextResponse.json(department)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Gated to Admin only
  const rbac = await checkRole([Role.ADMIN])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const { id } = await params
    const body = await req.json()
    const updated = await DepartmentService.updateDepartment(id, body)
    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 }
    )
  }
}
export const runtime = "nodejs"
