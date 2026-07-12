import { NextRequest } from "next/server"
import { AuditService } from "@/services/audit.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"
import { apiPaginated, apiCreated, apiServerError, apiValidationError, parsePagination } from "@/lib/api-response"

export async function GET(req: NextRequest) {
  const rbac = await checkRole([Role.ADMIN, Role.AUDITOR, Role.ASSET_MANAGER])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const { page, pageSize, skip, take } = parsePagination(searchParams)

    const { items, total } = await AuditService.getAuditCycles({ skip, take })
    return apiPaginated(items, total, page, pageSize)
  } catch (error: any) {
    return apiServerError(error.message || "Internal Server Error")
  }
}

export async function POST(req: NextRequest) {
  const rbac = await checkRole([Role.ADMIN])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const body = await req.json()
    const { name, description, startDate, endDate, assetIds } = body

    if (!name || !startDate || !endDate || !assetIds || !Array.isArray(assetIds)) {
      return apiValidationError("name, startDate, endDate, and assetIds (array) are required fields")
    }

    const audit = await AuditService.createAuditCycle({
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      assetIds
    })

    return apiCreated(audit, "Audit cycle created successfully")
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}
export const runtime = "nodejs"
