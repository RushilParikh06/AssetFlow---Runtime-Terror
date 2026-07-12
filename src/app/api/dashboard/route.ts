import { NextRequest } from "next/server"
import prisma from "@/lib/db"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role, AssetStatus, AllocationStatus, AuditStatus, BookingStatus, MaintenanceStatus } from "@prisma/client"
import { apiSuccess, apiServerError } from "@/lib/api-response"

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
    const totalAssets = await prisma.asset.count()
    const availableAssets = await prisma.asset.count({ where: { status: AssetStatus.AVAILABLE } })
    const allocatedAssets = await prisma.asset.count({ where: { status: AssetStatus.ALLOCATED } })
    const maintenanceAssets = await prisma.asset.count({ where: { status: AssetStatus.UNDER_MAINTENANCE } })
    
    const activeBookings = await prisma.booking.count({
      where: {
        OR: [
          { status: BookingStatus.ONGOING },
          { status: BookingStatus.UPCOMING }
        ]
      }
    })
    
    const overdueAssets = await prisma.allocation.count({
      where: {
        status: AllocationStatus.ACTIVE,
        expectedReturnDate: { lt: new Date() }
      }
    })

    const activeAudits = await prisma.audit.count({
      where: { status: AuditStatus.ACTIVE }
    })

    // Sum of maintenance costs
    const maintenanceCostAggregate = await prisma.maintenanceRequest.aggregate({
      where: { status: MaintenanceStatus.RESOLVED },
      _sum: { actualCost: true }
    })
    const maintenanceCost = maintenanceCostAggregate._sum.actualCost || 0

    // Fetch department wise asset counts
    const departments = await prisma.department.findMany({
      include: {
        allocations: {
          where: { status: AllocationStatus.ACTIVE }
        }
      }
    })
    const departmentWiseAssets = departments.map((d) => ({
      name: d.name,
      code: d.code,
      allocatedCount: d.allocations.length
    }))

    // Fetch asset distribution by status
    const statuses = Object.values(AssetStatus)
    const assetDistribution = await Promise.all(
      statuses.map(async (status) => {
        const count = await prisma.asset.count({ where: { status } })
        return { status, count }
      })
    )

    // Fetch category wise asset counts
    const categories = await prisma.assetCategory.findMany({
      include: {
        _count: {
          select: { assets: true }
        }
      }
    })
    const categoryWiseAssets = categories.map((c) => ({
      name: c.name,
      count: c._count.assets
    }))

    return apiSuccess({
      kpis: {
        totalAssets,
        availableAssets,
        allocatedAssets,
        maintenanceAssets,
        activeBookings,
        overdueAssets,
        activeAudits,
        maintenanceCost
      },
      charts: {
        departmentWiseAssets,
        assetDistribution,
        categoryWiseAssets
      }
    })
  } catch (error: any) {
    return apiServerError(error.message || "Internal Server Error")
  }
}
export const runtime = "nodejs"
