import prisma from "@/lib/db"
import { AssetStatus, AllocationStatus, TransferStatus } from "@prisma/client"

export class AllocationService {
  /**
   * Allocate an asset to an employee or department
   */
  static async allocateAsset(data: {
    assetId: string
    assignedToId?: string | null
    departmentId?: string | null
    expectedReturnDate?: Date | null
    notes?: string | null
    conditionBefore: string
  }) {
    if (!data.assignedToId && !data.departmentId) {
      throw new Error("Must specify either an employee or a department to allocate the asset to")
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Get asset details and lock it
      const asset = await tx.asset.findUnique({
        where: { id: data.assetId }
      })

      if (!asset) {
        throw new Error("Asset not found")
      }

      // 2. Business Rule: Asset must be Available
      if (asset.status !== AssetStatus.AVAILABLE) {
        // If it's already allocated, fetch who currently holds it
        if (asset.status === AssetStatus.ALLOCATED) {
          const activeAllocation = await tx.allocation.findFirst({
            where: { assetId: asset.id, status: AllocationStatus.ACTIVE },
            include: { assignedTo: true, department: true }
          })
          
          let holderName = "another entity"
          if (activeAllocation?.assignedTo) {
            holderName = activeAllocation.assignedTo.name
          } else if (activeAllocation?.department) {
            holderName = activeAllocation.department.name
          }
          
          throw new Error(`Conflict: Asset is currently assigned to ${holderName}`)
        }
        
        throw new Error(`Asset cannot be allocated. Current status is ${asset.status}`)
      }

      // 3. Create Allocation Record
      const allocation = await tx.allocation.create({
        data: {
          assetId: data.assetId,
          assignedToId: data.assignedToId || null,
          departmentId: data.departmentId || null,
          expectedReturnDate: data.expectedReturnDate || null,
          notes: data.notes,
          conditionBefore: data.conditionBefore,
          status: AllocationStatus.ACTIVE
        },
        include: { asset: true, assignedTo: true, department: true }
      })

      // 4. Update Asset Status
      await tx.asset.update({
        where: { id: data.assetId },
        data: { status: AssetStatus.ALLOCATED }
      })

      // 5. Log Activity
      await tx.activityLog.create({
        data: {
          action: "ASSET_ALLOCATE",
          newValue: {
            assetTag: asset.assetTag,
            assignedTo: allocation.assignedTo?.name || null,
            department: allocation.department?.name || null
          }
        }
      })

      return allocation
    })
  }

  /**
   * Raise a request to transfer an allocated asset
   */
  static async requestTransfer(data: {
    assetId: string
    requestedById: string
    targetEmployeeId?: string | null
    targetDepartmentId?: string | null
    notes?: string | null
  }) {
    if (!data.targetEmployeeId && !data.targetDepartmentId) {
      throw new Error("Must specify either a target employee or target department for the transfer")
    }

    const asset = await prisma.asset.findUnique({
      where: { id: data.assetId }
    })

    if (!asset || asset.status !== AssetStatus.ALLOCATED) {
      throw new Error("Asset must be currently allocated to be transferred")
    }

    return await prisma.transferRequest.create({
      data: {
        assetId: data.assetId,
        requestedById: data.requestedById,
        targetEmployeeId: data.targetEmployeeId || null,
        targetDepartmentId: data.targetDepartmentId || null,
        notes: data.notes,
        status: TransferStatus.REQUESTED
      },
      include: { asset: true, requestedBy: true }
    })
  }

  /**
   * Approve a transfer request and re-allocate the asset
   */
  static async approveTransfer(requestId: string, approvedById: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get transfer details
      const request = await tx.transferRequest.findUnique({
        where: { id: requestId },
        include: { asset: true }
      })

      if (!request) {
        throw new Error("Transfer request not found")
      }

      if (request.status !== TransferStatus.REQUESTED) {
        throw new Error("Transfer request is already processed")
      }

      // 2. Find and close the active allocation
      const activeAllocation = await tx.allocation.findFirst({
        where: { assetId: request.assetId, status: AllocationStatus.ACTIVE }
      })

      if (activeAllocation) {
        await tx.allocation.update({
          where: { id: activeAllocation.id },
          data: {
            actualReturnDate: new Date(),
            conditionAfter: "Transferred",
            status: AllocationStatus.RETURNED
          }
        })
      }

      // 3. Create new allocation
      const newAllocation = await tx.allocation.create({
        data: {
          assetId: request.assetId,
          assignedToId: request.targetEmployeeId,
          departmentId: request.targetDepartmentId,
          conditionBefore: activeAllocation?.conditionBefore || "Good",
          status: AllocationStatus.ACTIVE
        },
        include: { assignedTo: true, department: true }
      })

      // 4. Update transfer request status
      const updatedRequest = await tx.transferRequest.update({
        where: { id: requestId },
        data: {
          status: TransferStatus.APPROVED,
          approvedById
        }
      })

      // 5. Log activity
      await tx.activityLog.create({
        data: {
          action: "ASSET_TRANSFER",
          oldValue: { from: activeAllocation?.assignedToId || activeAllocation?.departmentId },
          newValue: {
            to: newAllocation.assignedTo?.name || newAllocation.department?.name,
            assetTag: request.asset.assetTag
          }
        }
      })

      return updatedRequest
    })
  }

  /**
   * Return an asset and mark it as Available
   */
  static async returnAsset(data: {
    allocationId: string
    conditionAfter: string
    notes?: string | null
  }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch the active allocation
      const allocation = await tx.allocation.findUnique({
        where: { id: data.allocationId }
      })

      if (!allocation || allocation.status !== AllocationStatus.ACTIVE) {
        throw new Error("Active allocation record not found")
      }

      // 2. Close allocation
      const closedAllocation = await tx.allocation.update({
        where: { id: data.allocationId },
        data: {
          actualReturnDate: new Date(),
          conditionAfter: data.conditionAfter,
          notes: data.notes || allocation.notes,
          status: AllocationStatus.RETURNED
        },
        include: { asset: true }
      })

      // 3. Revert asset status to Available
      await tx.asset.update({
        where: { id: allocation.assetId },
        data: {
          status: AssetStatus.AVAILABLE,
          condition: data.conditionAfter // Update asset's current condition
        }
      })

      // 4. Log activity
      await tx.activityLog.create({
        data: {
          action: "ASSET_RETURN",
          newValue: {
            assetTag: closedAllocation.asset.assetTag,
            conditionAfter: data.conditionAfter
          }
        }
      })

      return closedAllocation
    })
  }

  /**
   * Fetch active allocations, including overdue ones
   */
  static async getActiveAllocations(filters?: { overdueOnly?: boolean }) {
    const where: any = { status: AllocationStatus.ACTIVE }

    if (filters?.overdueOnly) {
      where.expectedReturnDate = { lt: new Date() }
    }

    return await prisma.allocation.findMany({
      where,
      include: {
        asset: true,
        assignedTo: true,
        department: true
      },
      orderBy: { allocationDate: "desc" }
    })
  }
}
