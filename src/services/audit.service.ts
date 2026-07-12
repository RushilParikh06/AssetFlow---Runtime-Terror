import prisma from "@/lib/db"
import { AuditStatus, VerificationStatus, AssetStatus } from "@prisma/client"

export class AuditService {
  /**
   * Create an audit cycle and initialize audit items for scoped assets
   */
  static async createAuditCycle(data: {
    name: string
    description?: string | null
    startDate: Date
    endDate: Date
    assetIds: string[] // Assets scoped for this audit
  }) {
    if (data.assetIds.length === 0) {
      throw new Error("An audit cycle must include at least one asset in its scope")
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Create Audit Record
      const audit = await tx.audit.create({
        data: {
          name: data.name,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          status: AuditStatus.ACTIVE
        }
      })

      // 2. Initialize Audit Items for each asset
      // Default initial status to MISSING (will be verified by the auditor)
      await tx.auditItem.createMany({
        data: data.assetIds.map((assetId) => ({
          auditId: audit.id,
          assetId,
          status: VerificationStatus.MISSING, // Initial state, to be updated
          notes: "Pending verification"
        }))
      })

      // 3. Log activity
      await tx.activityLog.create({
        data: {
          action: "AUDIT_CREATE",
          newValue: { name: audit.name, assetCount: data.assetIds.length }
        }
      })

      return audit
    })
  }

  /**
   * Record verification for a specific asset within an active audit cycle
   */
  static async verifyAsset(data: {
    auditId: string
    assetId: string
    status: VerificationStatus
    verifiedById: string
    notes?: string | null
  }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Check if audit is active
      const audit = await tx.audit.findUnique({
        where: { id: data.auditId }
      })

      if (!audit) {
        throw new Error("Audit cycle not found")
      }

      if (audit.status !== AuditStatus.ACTIVE) {
        throw new Error("Cannot verify assets on a closed or draft audit cycle")
      }

      // 2. Find and update the audit item
      const auditItem = await tx.auditItem.findFirst({
        where: { auditId: data.auditId, assetId: data.assetId }
      })

      if (!auditItem) {
        throw new Error("Asset is not scoped in this audit cycle")
      }

      const updatedItem = await tx.auditItem.update({
        where: { id: auditItem.id },
        data: {
          status: data.status,
          notes: data.notes,
          verifiedById: data.verifiedById
        },
        include: { asset: true }
      })

      // If damaged, we can optionally log it, but the status is committed on close
      return updatedItem
    })
  }

  /**
   * Close an audit cycle, locking it and updating affected asset statuses
   */
  static async closeAuditCycle(id: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch audit details
      const audit = await tx.audit.findUnique({
        where: { id },
        include: {
          auditItems: {
            include: { asset: true }
          }
        }
      })

      if (!audit) {
        throw new Error("Audit cycle not found")
      }

      if (audit.status !== AuditStatus.ACTIVE) {
        throw new Error("Only active audit cycles can be closed")
      }

      // 2. Process audit items
      for (const item of audit.auditItems) {
        if (item.status === VerificationStatus.MISSING) {
          // Rule: confirmed missing items flip to LOST
          await tx.asset.update({
            where: { id: item.assetId },
            data: { status: AssetStatus.LOST }
          })
        } else if (item.status === VerificationStatus.DAMAGED) {
          // If damaged, we could update the asset condition or flag it
          await tx.asset.update({
            where: { id: item.assetId },
            data: { condition: "Damaged" }
          })
        }
      }

      // 3. Mark audit as Closed (Immutable)
      const closedAudit = await tx.audit.update({
        where: { id },
        data: { status: AuditStatus.CLOSED }
      })

      // 4. Log activity
      await tx.activityLog.create({
        data: {
          action: "AUDIT_CLOSE",
          newValue: { auditName: audit.name }
        }
      })

      return closedAudit
    })
  }

  /**
   * Get audit cycle details and generate a discrepancy report
   */
  static async getAuditDetails(id: string) {
    const audit = await prisma.audit.findUnique({
      where: { id },
      include: {
        auditItems: {
          include: {
            asset: { include: { category: true } },
            verifiedBy: true
          }
        }
      }
    })

    if (!audit) return null

    // Compute discrepancies: items that are Missing or Damaged
    const verifiedItems = audit.auditItems.filter(item => item.status === VerificationStatus.VERIFIED)
    const missingItems = audit.auditItems.filter(item => item.status === VerificationStatus.MISSING)
    const damagedItems = audit.auditItems.filter(item => item.status === VerificationStatus.DAMAGED)

    return {
      audit,
      summary: {
        totalScoped: audit.auditItems.length,
        verifiedCount: verifiedItems.length,
        missingCount: missingItems.length,
        damagedCount: damagedItems.length,
        discrepancyRate: audit.auditItems.length > 0
          ? ((missingItems.length + damagedItems.length) / audit.auditItems.length) * 100
          : 0
      },
      discrepancyReport: {
        missing: missingItems,
        damaged: damagedItems
      }
    }
  }

  /**
   * List all audit cycles
   */
  static async getAuditCycles(params?: { skip?: number; take?: number }) {
    const [items, total] = await Promise.all([
      prisma.audit.findMany({
        include: {
          _count: {
            select: { auditItems: true }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: params?.skip,
        take: params?.take,
      }),
      prisma.audit.count()
    ])

    return { items, total }
  }
}
