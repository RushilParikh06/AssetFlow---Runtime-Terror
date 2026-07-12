import { NextRequest } from "next/server"
import { AuditService } from "@/services/audit.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"
import { apiSuccess, apiNotFound, apiServerError } from "@/lib/api-response"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rbac = await checkRole([Role.ADMIN, Role.AUDITOR, Role.ASSET_MANAGER])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const { id } = await params
    const details = await AuditService.getAuditDetails(id)
    if (!details) {
      return apiNotFound("Audit cycle")
    }
    return apiSuccess(details)
  } catch (error: any) {
    return apiServerError(error.message || "Internal Server Error")
  }
}
export const runtime = "nodejs"
