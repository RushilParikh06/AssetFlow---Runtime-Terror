import { NextRequest } from "next/server"
import { AssetService } from "@/services/asset.service"
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
    const asset = await AssetService.getAssetById(id)
    if (!asset) {
      return apiNotFound("Asset")
    }

    // Extract history-related relations into a unified timeline
    const history = {
      allocations: asset.allocations,
      maintenanceRequests: asset.maintenanceRequests,
      bookings: asset.bookings,
    }

    return apiSuccess(history)
  } catch (error: any) {
    return apiServerError(error.message || "Internal Server Error")
  }
}
export const runtime = "nodejs"
