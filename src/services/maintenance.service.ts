import prisma from "@/lib/db"
import { AssetStatus, MaintenanceStatus, MaintenancePriority } from "@prisma/client"

export class MaintenanceService {
  /**
   * Raise a new maintenance request
   */
  static async raiseRequest(data: {
    assetId: string
    issueDescription: string
    priority: MaintenancePriority
    requestedById: string
    estimatedCost?: number | null
  }) {
    const asset = await prisma.asset.findUnique({
      where: { id: data.assetId }
    })

    if (!asset) {
      throw new Error("Asset not found")
    }

    return await prisma.maintenanceRequest.create({
      data: {
        assetId: data.assetId,
        issueDescription: data.issueDescription,
        priority: data.priority,
        requestedById: data.requestedById,
        estimatedCost: data.estimatedCost || null,
        status: MaintenanceStatus.PENDING
      },
      include: { asset: true, requestedBy: true }
    })
  }

  /**
   * Approve a maintenance request (triggers UNDER_MAINTENANCE asset status)
   */
  static async approveRequest(id: string) {
    return await prisma.$transaction(async (tx) => {
      const request = await tx.maintenanceRequest.findUnique({
        where: { id }
      })

      if (!request) {
        throw new Error("Maintenance request not found")
      }

      if (request.status !== MaintenanceStatus.PENDING) {
        throw new Error("Request has already been processed")
      }

      // Update maintenance status
      const updatedRequest = await tx.maintenanceRequest.update({
        where: { id },
        data: { status: MaintenanceStatus.APPROVED },
        include: { asset: true }
      })

      // Update asset status to UNDER_MAINTENANCE
      await tx.asset.update({
        where: { id: request.assetId },
        data: { status: AssetStatus.UNDER_MAINTENANCE }
      })

      // Log activity
      await tx.activityLog.create({
        data: {
          action: "MAINTENANCE_APPROVE",
          newValue: {
            assetTag: updatedRequest.asset.assetTag,
            requestId: request.id
          }
        }
      })

      return updatedRequest
    })
  }

  /**
   * Assign a technician to an approved maintenance request
   */
  static async assignTechnician(id: string, technicianId: string) {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id }
    })

    if (!request) {
      throw new Error("Maintenance request not found")
    }

    if (
      request.status !== MaintenanceStatus.APPROVED &&
      request.status !== MaintenanceStatus.TECHNICIAN_ASSIGNED
    ) {
      throw new Error("Request must be approved before assigning a technician")
    }

    return await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: MaintenanceStatus.TECHNICIAN_ASSIGNED,
        technicianId
      },
      include: { technician: true, asset: true }
    })
  }

  /**
   * Set a maintenance request as In Progress
   */
  static async startMaintenance(id: string) {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id }
    })

    if (!request) {
      throw new Error("Maintenance request not found")
    }

    if (request.status !== MaintenanceStatus.TECHNICIAN_ASSIGNED) {
      throw new Error("A technician must be assigned before starting work")
    }

    return await prisma.maintenanceRequest.update({
      where: { id },
      data: { status: MaintenanceStatus.IN_PROGRESS },
      include: { asset: true }
    })
  }

  /**
   * Resolve a maintenance request (restores AVAILABLE asset status)
   */
  static async resolveRequest(
    id: string,
    data: {
      actualCost?: number
      notes?: string | null
    }
  ) {
    return await prisma.$transaction(async (tx) => {
      const request = await tx.maintenanceRequest.findUnique({
        where: { id }
      })

      if (!request) {
        throw new Error("Maintenance request not found")
      }

      if (request.status === MaintenanceStatus.RESOLVED || request.status === MaintenanceStatus.REJECTED) {
        throw new Error("Maintenance request is already closed")
      }

      // Update request details
      const resolvedRequest = await tx.maintenanceRequest.update({
        where: { id },
        data: {
          status: MaintenanceStatus.RESOLVED,
          actualCost: data.actualCost,
          notes: data.notes
        },
        include: { asset: true }
      })

      // Update asset back to AVAILABLE
      await tx.asset.update({
        where: { id: request.assetId },
        data: { status: AssetStatus.AVAILABLE }
      })

      // Log activity
      await tx.activityLog.create({
        data: {
          action: "MAINTENANCE_RESOLVE",
          newValue: {
            assetTag: resolvedRequest.asset.assetTag,
            actualCost: data.actualCost,
            notes: data.notes
          }
        }
      })

      return resolvedRequest
    })
  }

  /**
   * Reject a maintenance request
   */
  static async rejectRequest(id: string, notes?: string | null) {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id }
    })

    if (!request) {
      throw new Error("Maintenance request not found")
    }

    if (request.status !== MaintenanceStatus.PENDING) {
      throw new Error("Only pending requests can be rejected")
    }

    return await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: MaintenanceStatus.REJECTED,
        notes
      },
      include: { asset: true }
    })
  }

  /**
   * Fetch all maintenance requests with filtering
   */
  static async getRequests(filters?: {
    assetId?: string
    status?: MaintenanceStatus
    priority?: MaintenancePriority
    requestedById?: string
    technicianId?: string
    skip?: number
    take?: number
  }) {
    const where: any = {}

    if (filters?.assetId) {
      where.assetId = filters.assetId
    }
    if (filters?.status) {
      where.status = filters.status
    }
    if (filters?.priority) {
      where.priority = filters.priority
    }
    if (filters?.requestedById) {
      where.requestedById = filters.requestedById
    }
    if (filters?.technicianId) {
      where.technicianId = filters.technicianId
    }

    const [items, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        include: {
          asset: {
            include: { category: true }
          },
          requestedBy: true,
          technician: true
        },
        orderBy: { createdAt: "desc" },
        skip: filters?.skip,
        take: filters?.take,
      }),
      prisma.maintenanceRequest.count({ where })
    ])

    return { items, total }
  }
}
