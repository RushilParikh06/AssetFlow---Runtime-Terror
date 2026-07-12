import { NextRequest } from "next/server"
import { MaintenanceService } from "@/services/maintenance.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role, MaintenancePriority, MaintenanceStatus } from "@prisma/client"
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
    const assetId = searchParams.get("assetId") || undefined
    const statusParam = searchParams.get("status") as MaintenanceStatus | null
    const status = statusParam && Object.values(MaintenanceStatus).includes(statusParam) ? statusParam : undefined
    
    const priorityParam = searchParams.get("priority") as MaintenancePriority | null
    const priority = priorityParam && Object.values(MaintenancePriority).includes(priorityParam) ? priorityParam : undefined
    
    const requestedById = searchParams.get("requestedById") || undefined
    const technicianId = searchParams.get("technicianId") || undefined

    const filters: any = { assetId, status, priority, requestedById, technicianId, skip, take }

    // Gated visibility: standard employees only see requests they raised or are assigned to
    if (rbac.user.role === Role.EMPLOYEE) {
      filters.requestedById = rbac.user.employeeId!
    }

    const { items, total } = await MaintenanceService.getRequests(filters)
    return apiPaginated(items, total, page, pageSize)
  } catch (error: any) {
    return apiServerError(error.message || "Internal Server Error")
  }
}

export async function POST(req: NextRequest) {
  const rbac = await checkRole([
    Role.ADMIN,
    Role.ASSET_MANAGER,
    Role.DEPARTMENT_HEAD,
    Role.EMPLOYEE
  ])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const body = await req.json()
    const { assetId, issueDescription, priority, estimatedCost } = body

    if (!assetId || !issueDescription || !priority) {
      return apiValidationError("assetId, issueDescription, and priority are required")
    }

    if (!rbac.user.employeeId) {
      return apiValidationError("Your user account is not linked to an employee profile")
    }

    const request = await MaintenanceService.raiseRequest({
      assetId,
      issueDescription,
      priority: priority as MaintenancePriority,
      requestedById: rbac.user.employeeId,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null
    })

    return apiCreated(request, "Maintenance request raised successfully")
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}
export const runtime = "nodejs"
