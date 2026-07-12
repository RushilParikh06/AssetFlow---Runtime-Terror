import { NextRequest } from "next/server"
import { DepartmentService } from "@/services/department.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"
import { apiSuccess, apiNotFound, apiServerError } from "@/lib/api-response"

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
      return apiNotFound("Department")
    }
    return apiSuccess(department)
  } catch (error: any) {
    return apiServerError(error.message || "Internal Server Error")
  }
}

async function handleUpdate(
  req: NextRequest,
  id: string
) {
  const rbac = await checkRole([Role.ADMIN])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const body = await req.json()
    const updated = await DepartmentService.updateDepartment(id, body)
    return apiSuccess(updated, 200, "Department updated successfully")
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handleUpdate(req, id)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handleUpdate(req, id)
}
export const runtime = "nodejs"
