import { NextRequest, NextResponse } from "next/server"
import { MaintenanceService } from "@/services/maintenance.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Status workflow actions are restricted to Admin and Asset Manager
  const rbac = await checkRole([Role.ADMIN, Role.ASSET_MANAGER])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { action, technicianId, notes } = body

    if (!action) {
      return NextResponse.json({ error: "action is required in request body" }, { status: 400 })
    }

    let result
    switch (action.toUpperCase()) {
      case "APPROVE":
        result = await MaintenanceService.approveRequest(id)
        break
      case "ASSIGN_TECHNICIAN":
        if (!technicianId) {
          return NextResponse.json({ error: "technicianId is required for assignment" }, { status: 400 })
        }
        result = await MaintenanceService.assignTechnician(id, technicianId)
        break
      case "START":
        result = await MaintenanceService.startMaintenance(id)
        break
      case "REJECT":
        result = await MaintenanceService.rejectRequest(id, notes)
        break
      default:
        return NextResponse.json(
          { error: "Invalid action. Supported actions: APPROVE, ASSIGN_TECHNICIAN, START, REJECT" },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, request: result })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 }
    )
  }
}
export const runtime = "nodejs"
