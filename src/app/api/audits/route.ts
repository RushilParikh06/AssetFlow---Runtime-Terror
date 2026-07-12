import { NextRequest, NextResponse } from "next/server"
import { AuditService } from "@/services/audit.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"

export async function GET(req: NextRequest) {
  // Gated to Admin, Auditor, and Asset Manager
  const rbac = await checkRole([Role.ADMIN, Role.AUDITOR, Role.ASSET_MANAGER])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const cycles = await AuditService.getAuditCycles()
    return NextResponse.json(cycles)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  // Creating audit cycles is restricted to Admin only
  const rbac = await checkRole([Role.ADMIN])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const body = await req.json()
    const { name, description, startDate, endDate, assetIds } = body

    if (!name || !startDate || !endDate || !assetIds || !Array.isArray(assetIds)) {
      return NextResponse.json(
        { error: "name, startDate, endDate, and assetIds (array) are required fields" },
        { status: 400 }
      )
    }

    const audit = await AuditService.createAuditCycle({
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      assetIds
    })

    return NextResponse.json(audit, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 }
    )
  }
}
export const runtime = "nodejs"
