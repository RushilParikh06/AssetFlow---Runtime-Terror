import { NextRequest } from "next/server"
import prisma from "@/lib/db"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"
import { apiPaginated, apiServerError, parsePagination } from "@/lib/api-response"

export async function GET(req: NextRequest) {
  const rbac = await checkRole([Role.ADMIN, Role.ASSET_MANAGER])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const { page, pageSize, skip, take } = parsePagination(searchParams)

    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        include: {
          user: {
            select: { email: true, role: true }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take
      }),
      prisma.activityLog.count()
    ])

    return apiPaginated(items, total, page, pageSize)
  } catch (error: any) {
    return apiServerError(error.message || "Internal Server Error")
  }
}
export const runtime = "nodejs"
