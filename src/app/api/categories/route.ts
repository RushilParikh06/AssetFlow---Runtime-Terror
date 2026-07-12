import { NextRequest } from "next/server"
import { CategoryService } from "@/services/category.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"
import { apiPaginated, apiCreated, apiServerError, apiValidationError, parsePagination } from "@/lib/api-response"

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
    const statusParam = searchParams.get("status")
    
    let status: boolean | undefined = undefined
    if (statusParam === "active" || statusParam === "true") {
      status = true
    } else if (statusParam === "inactive" || statusParam === "false") {
      status = false
    }

    const { items, total } = await CategoryService.getAllCategories({ status, skip, take })
    return apiPaginated(items, total, page, pageSize)
  } catch (error: any) {
    return apiServerError(error.message || "Internal Server Error")
  }
}

export async function POST(req: NextRequest) {
  const rbac = await checkRole([Role.ADMIN])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const body = await req.json()
    const { name, description, customFields, status } = body

    if (!name) {
      return apiValidationError("Category Name is required", "name")
    }

    const category = await CategoryService.createCategory({
      name,
      description,
      customFields,
      status
    })

    return apiCreated(category, "Category created successfully")
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}
export const runtime = "nodejs"
