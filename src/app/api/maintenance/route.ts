import { NextRequest, NextResponse } from "next/server"
import { MaintenanceService } from "@/services/maintenance.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role, MaintenancePriority, MaintenanceStatus } from "@prisma/client"

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
    const assetId = searchParams.get("assetId") || undefined
    const statusParam = searchParams.get("status") as MaintenanceStatus | null
    const status = statusParam && Object.values(MaintenanceStatus).includes(statusParam) ? statusParam : undefined
    
    const priorityParam = searchParams.get("priority") as MaintenancePriority | null
    const priority = priorityParam && Object.values(MaintenancePriority).includes(priorityParam) ? priorityParam : undefined
    
    const requestedById = searchParams.get("requestedById") || undefined
    const technicianId = searchParams.get("technicianId") || undefined

    const filters: any = { assetId, status, priority, requestedById, technicianId }

    // Gated visibility: standard employees only see requests they raised or are assigned to
    if (rbac.user.role === Role.EMPLOYEE) {
      // If employee, force filtering by requestedById or technicianId
      filters.requestedById = rbac.user.employeeId!
    }

    const requests = await MaintenanceService.getRequests(filters)
    return NextResponse.json(requests)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
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
      return NextResponse.json(
        { error: "assetId, issueDescription, and priority are required" },
        { status: 400 }
      )
    }

    if (!rbac.user.employeeId) {
      return NextResponse.json({ error: "Your user account is not linked to an employee profile" }, { status: 400 })
    }

    const request = await MaintenanceService.raiseRequest({
      assetId,
      issueDescription,
      priority: priority as MaintenancePriority,
      requestedById: rbac.user.employeeId,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null
    })

    return NextResponse.json(request, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 }
    )
  }
}
export const runtime = "nodejs"
