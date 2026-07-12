import { NextRequest } from "next/server"
import { AuditService } from "@/services/audit.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role, VerificationStatus } from "@prisma/client"
import { apiSuccess, apiServerError, apiValidationError } from "@/lib/api-response"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rbac = await checkRole([Role.ADMIN, Role.AUDITOR])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { assetId, status, notes } = body

    if (!assetId || !status || !Object.values(VerificationStatus).includes(status as VerificationStatus)) {
      return apiValidationError("assetId and a valid status (VERIFIED, MISSING, DAMAGED) are required")
    }

    if (!rbac.user.employeeId) {
      return apiValidationError("Your user account is not linked to an employee profile")
    }

    const updatedItem = await AuditService.verifyAsset({
      auditId: id,
      assetId,
      status: status as VerificationStatus,
      verifiedById: rbac.user.employeeId,
      notes
    })

    return apiSuccess(updatedItem, 200, "Asset verified successfully")
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}
export const runtime = "nodejs"
