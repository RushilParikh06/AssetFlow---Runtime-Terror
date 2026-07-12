import { NextRequest } from "next/server"
import { MaintenanceService } from "@/services/maintenance.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"
import { apiSuccess, apiServerError, apiValidationError } from "@/lib/api-response"

async function handleStatusChange(
  req: NextRequest,
  id: string
) {
  const rbac = await checkRole([Role.ADMIN, Role.ASSET_MANAGER])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const body = await req.json()
    const { action, technicianId, notes } = body

    if (!action) {
      return apiValidationError("action is required in request body", "action")
    }

    let result
    switch (action.toUpperCase()) {
      case "APPROVE":
        result = await MaintenanceService.approveRequest(id)
        break
      case "ASSIGN_TECHNICIAN":
        if (!technicianId) {
          return apiValidationError("technicianId is required for assignment", "technicianId")
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
        return apiValidationError("Invalid action. Supported actions: APPROVE, ASSIGN_TECHNICIAN, START, REJECT")
    }

    return apiSuccess(result, 200, `Maintenance status updated: ${action}`)
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handleStatusChange(req, id)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handleStatusChange(req, id)
}
export const runtime = "nodejs"
