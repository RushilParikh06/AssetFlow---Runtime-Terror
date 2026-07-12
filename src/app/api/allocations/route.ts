import { NextRequest, NextResponse } from "next/server"
import { AllocationService } from "@/services/allocation.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"

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
    const overdueOnly = searchParams.get("overdue") === "true"

    const allocations = await AllocationService.getActiveAllocations({ overdueOnly })
    return NextResponse.json(allocations)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  // Gated to Admin and Asset Manager
  const rbac = await checkRole([Role.ADMIN, Role.ASSET_MANAGER])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const body = await req.json()
    const { assetId, assignedToId, departmentId, expectedReturnDate, notes, conditionBefore } = body

    if (!assetId || !conditionBefore) {
      return NextResponse.json(
        { error: "assetId and conditionBefore are required fields" },
        { status: 400 }
      )
    }

    const allocation = await AllocationService.allocateAsset({
      assetId,
      assignedToId,
      departmentId,
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
      notes,
      conditionBefore
    })

    return NextResponse.json(allocation, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 } // This will return 400 for business logic violations (e.g. already allocated)
    )
  }
}
export const runtime = "nodejs"
