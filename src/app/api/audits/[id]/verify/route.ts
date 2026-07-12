import { NextRequest, NextResponse } from "next/server"
import { AuditService } from "@/services/audit.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role, VerificationStatus } from "@prisma/client"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Gated to Admin and Auditor
  const rbac = await checkRole([Role.ADMIN, Role.AUDITOR])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { assetId, status, notes } = body

    if (!assetId || !status || !Object.values(VerificationStatus).includes(status as VerificationStatus)) {
      return NextResponse.json(
        { error: "assetId and a valid status (VERIFIED, MISSING, DAMAGED) are required" },
        { status: 400 }
      )
    }

    if (!rbac.user.employeeId) {
      return NextResponse.json({ error: "Your user account is not linked to an employee profile" }, { status: 400 })
    }

    const updatedItem = await AuditService.verifyAsset({
      auditId: id,
      assetId,
      status: status as VerificationStatus,
      verifiedById: rbac.user.employeeId,
      notes
    })

    return NextResponse.json({ success: true, auditItem: updatedItem })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 }
    )
  }
}
export const runtime = "nodejs"
