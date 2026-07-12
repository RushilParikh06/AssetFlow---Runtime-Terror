import { NextRequest } from "next/server"
import { AllocationService } from "@/services/allocation.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"
import { apiSuccess, apiServerError, apiValidationError } from "@/lib/api-response"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rbac = await checkRole([Role.ADMIN, Role.ASSET_MANAGER])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { conditionAfter, notes } = body

    if (!conditionAfter) {
      return apiValidationError("conditionAfter is a required field", "conditionAfter")
    }

    const closedAllocation = await AllocationService.returnAsset({
      allocationId: id,
      conditionAfter,
      notes
    })

    return apiSuccess(closedAllocation, 200, "Asset returned successfully")
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}
export const runtime = "nodejs"
