import { NextRequest, NextResponse } from "next/server"
import { AuditService } from "@/services/audit.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Gated to Admin, Auditor, and Asset Manager
  const rbac = await checkRole([Role.ADMIN, Role.AUDITOR, Role.ASSET_MANAGER])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const { id } = await params
    const details = await AuditService.getAuditDetails(id)
    if (!details) {
      return NextResponse.json({ error: "Audit cycle not found" }, { status: 404 })
    }
    return NextResponse.json(details)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
export const runtime = "nodejs"
