import { NextRequest } from "next/server"
import { AllocationService } from "@/services/allocation.service"
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
    const overdueOnly = searchParams.get("overdue") === "true"

    const { items, total } = await AllocationService.getActiveAllocations({ overdueOnly, skip, take })
    return apiPaginated(items, total, page, pageSize)
  } catch (error: any) {
    return apiServerError(error.message || "Internal Server Error")
  }
}

export async function POST(req: NextRequest) {
  const rbac = await checkRole([Role.ADMIN, Role.ASSET_MANAGER])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const body = await req.json()
    const { assetId, assignedToId, departmentId, expectedReturnDate, notes, conditionBefore } = body

    if (!assetId || !conditionBefore) {
      return apiValidationError("assetId and conditionBefore are required fields")
    }

    const allocation = await AllocationService.allocateAsset({
      assetId,
      assignedToId,
      departmentId,
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
      notes,
      conditionBefore
    })

    return apiCreated(allocation, "Asset allocated successfully")
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}
export const runtime = "nodejs"
