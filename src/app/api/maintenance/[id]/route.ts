import { NextRequest } from "next/server"
import { MaintenanceService } from "@/services/maintenance.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import prisma from "@/lib/db"
import { Role } from "@prisma/client"
import { apiSuccess, apiNotFound, apiForbidden, apiServerError } from "@/lib/api-response"

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
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        asset: { include: { category: true } },
        requestedBy: true,
        technician: true
      }
    })

    if (!request) {
      return apiNotFound("Maintenance request")
    }

    // Limit standard employee from viewing requests they didn't raise
    if (rbac.user.role === Role.EMPLOYEE && request.requestedById !== rbac.user.employeeId) {
      return apiForbidden("You cannot view this maintenance request")
    }

    return apiSuccess(request)
  } catch (error: any) {
    return apiServerError(error.message || "Internal Server Error")
  }
}

async function handleResolve(
  req: NextRequest,
  id: string
) {
  const rbac = await checkRole([Role.ADMIN, Role.ASSET_MANAGER])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const body = await req.json()
    const { actualCost, notes } = body

    const resolved = await MaintenanceService.resolveRequest(id, {
      actualCost: actualCost ? parseFloat(actualCost) : undefined,
      notes
    })

    return apiSuccess(resolved, 200, "Maintenance request resolved successfully")
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handleResolve(req, id)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handleResolve(req, id)
}
export const runtime = "nodejs"
