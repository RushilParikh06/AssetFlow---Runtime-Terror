import { NextRequest, NextResponse } from "next/server"
import { AllocationService } from "@/services/allocation.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"

export async function POST(
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
    const { conditionAfter, notes } = body

    if (!conditionAfter) {
      return NextResponse.json(
        { error: "conditionAfter is a required field" },
        { status: 400 }
      )
    }

    const closedAllocation = await AllocationService.returnAsset({
      allocationId: id,
      conditionAfter,
      notes
    })

    return NextResponse.json({
      success: true,
      message: "Asset returned successfully",
      allocation: closedAllocation
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 }
    )
  }
}
export const runtime = "nodejs"
