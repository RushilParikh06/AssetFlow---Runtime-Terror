import { NextRequest } from "next/server"
import { CategoryService } from "@/services/category.service"
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
    const category = await CategoryService.getCategoryById(id)
    if (!category) {
      return apiNotFound("Category")
    }
    return apiSuccess(category)
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
    const updated = await CategoryService.updateCategory(id, body)
    return apiSuccess(updated, 200, "Category updated successfully")
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
