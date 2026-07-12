import { NextRequest, NextResponse } from "next/server"
import { MaintenanceService } from "@/services/maintenance.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import prisma from "@/lib/db"
import { Role } from "@prisma/client"

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
      return NextResponse.json({ error: "Maintenance request not found" }, { status: 404 })
    }

    // Limit standard employee from viewing requests they didn't raise
    if (rbac.user.role === Role.EMPLOYEE && request.requestedById !== rbac.user.employeeId) {
      return NextResponse.json({ error: "Forbidden: You cannot view this maintenance request" }, { status: 403 })
    }

    return NextResponse.json(request)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Gated to Admin and Asset Manager
  const rbac = await checkRole([Role.ADMIN, Role.ASSET_MANAGER])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { actualCost, notes } = body

    const resolved = await MaintenanceService.resolveRequest(id, {
      actualCost: actualCost ? parseFloat(actualCost) : undefined,
      notes
    })

    return NextResponse.json(resolved)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 }
    )
  }
}
export const runtime = "nodejs"
