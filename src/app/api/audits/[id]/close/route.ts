import { NextRequest } from "next/server"
import { AuditService } from "@/services/audit.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"
import { apiSuccess, apiServerError } from "@/lib/api-response"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rbac = await checkRole([Role.ADMIN])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const { id } = await params
    const closedAudit = await AuditService.closeAuditCycle(id)
    return apiSuccess(closedAudit, 200, "Audit cycle closed successfully and statuses committed")
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}
export const runtime = "nodejs"
