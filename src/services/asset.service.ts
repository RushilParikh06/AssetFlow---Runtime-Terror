import prisma from "@/lib/db"
import { AssetStatus, Prisma } from "@prisma/client"

export class AssetService {
  /**
   * Register a new asset with auto-generating asset tag and custom fields validation
   */
  static async registerAsset(data: {
    assetName: string
    categoryId: string
    serialNumber?: string | null
    acquisitionDate: Date
    acquisitionCost: number
    warrantyExpiry?: Date | null
    vendor?: string | null
    condition: string
    location: string
    sharedBookableFlag?: boolean
    documents?: { name: string; url: string; fileType: string; sizeBytes: number }[]
  }) {
    // Validate category existence
    const category = await prisma.assetCategory.findUnique({
      where: { id: data.categoryId }
    })
    if (!category) {
      throw new Error("Category not found")
    }

    // Auto-generate Asset Tag (e.g. AF-0001)
    // Run in a transaction or lock to prevent race conditions
    return await prisma.$transaction(async (tx) => {
      const lastAsset = await tx.asset.findFirst({
        where: { assetTag: { startsWith: "AF-" } },
        orderBy: { assetTag: "desc" }
      })

      let nextTagNumber = 1
      if (lastAsset) {
        const match = lastAsset.assetTag.match(/AF-(\d+)/)
        if (match && match[1]) {
          nextTagNumber = parseInt(match[1], 10) + 1
        }
      }
      const assetTag = `AF-${nextTagNumber.toString().padStart(4, "0")}`

      // Create Asset
      const asset = await tx.asset.create({
        data: {
          assetTag,
          assetName: data.assetName,
          categoryId: data.categoryId,
          serialNumber: data.serialNumber || null,
          acquisitionDate: data.acquisitionDate,
          acquisitionCost: data.acquisitionCost,
          warrantyExpiry: data.warrantyExpiry || null,
          vendor: data.vendor || null,
          condition: data.condition,
          location: data.location,
          sharedBookableFlag: data.sharedBookableFlag ?? false,
          qrCode: `assetflow:${assetTag}`,
          status: AssetStatus.AVAILABLE
        }
      })

      // Add documents if any
      if (data.documents && data.documents.length > 0) {
        await tx.document.createMany({
          data: data.documents.map((doc) => ({
            name: doc.name,
            url: doc.url,
            fileType: doc.fileType,
            sizeBytes: doc.sizeBytes,
            assetId: asset.id
          }))
        })
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          action: "ASSET_REGISTER",
          newValue: { assetTag, name: asset.assetName }
        }
      })

      return asset
    })
  }

  /**
   * Get assets list with comprehensive filters
   */
  static async getAssets(params?: {
    search?: string
    categoryId?: string
    status?: AssetStatus
    location?: string
    sharedBookableFlag?: boolean
    departmentId?: string // filter assets allocated to a department
  }) {
    const where: any = {}

    if (params?.categoryId) {
      where.categoryId = params.categoryId
    }

    if (params?.status) {
      where.status = params.status
    }

    if (params?.location) {
      where.location = { contains: params.location, mode: "insensitive" }
    }

    if (params?.sharedBookableFlag !== undefined) {
      where.sharedBookableFlag = params.sharedBookableFlag
    }

    if (params?.search) {
      where.OR = [
        { assetName: { contains: params.search, mode: "insensitive" } },
        { assetTag: { contains: params.search, mode: "insensitive" } },
        { serialNumber: { contains: params.search, mode: "insensitive" } },
        { location: { contains: params.search, mode: "insensitive" } }
      ]
    }

    // Filter by department through the active allocations
    if (params?.departmentId) {
      where.allocations = {
        some: {
          departmentId: params.departmentId,
          status: "ACTIVE"
        }
      }
    }

    return await prisma.asset.findMany({
      where,
      include: {
        category: true,
        allocations: {
          where: { status: "ACTIVE" },
          include: { assignedTo: true, department: true }
        }
      },
      orderBy: { assetTag: "asc" }
    })
  }

  /**
   * Get asset details by ID (including history)
   */
  static async getAssetById(id: string) {
    return await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        documents: true,
        allocations: {
          include: { assignedTo: true, department: true },
          orderBy: { allocationDate: "desc" }
        },
        maintenanceRequests: {
          include: { requestedBy: true, technician: true },
          orderBy: { createdAt: "desc" }
        },
        bookings: {
          include: { bookedBy: true },
          orderBy: { startTime: "desc" }
        }
      }
    })
  }

  /**
   * Update asset properties
   */
  static async updateAsset(
    id: string,
    data: {
      assetName?: string
      serialNumber?: string | null
      acquisitionDate?: Date
      acquisitionCost?: number
      warrantyExpiry?: Date | null
      vendor?: string | null
      condition?: string
      location?: string
      sharedBookableFlag?: boolean
      status?: AssetStatus
    }
  ) {
    const oldAsset = await prisma.asset.findUnique({ where: { id } })
    if (!oldAsset) {
      throw new Error("Asset not found")
    }

    return await prisma.$transaction(async (tx) => {
      const updatedAsset = await tx.asset.update({
        where: { id },
        data
      })

      // Log activity if key values changed
      await tx.activityLog.create({
        data: {
          action: "ASSET_UPDATE",
          oldValue: { status: oldAsset.status, condition: oldAsset.condition, location: oldAsset.location },
          newValue: { status: updatedAsset.status, condition: updatedAsset.condition, location: updatedAsset.location }
        }
      })

      return updatedAsset
    })
  }

  /**
   * Delete an asset
   */
  static async deleteAsset(id: string) {
    return await prisma.asset.delete({
      where: { id }
    })
  }
}
