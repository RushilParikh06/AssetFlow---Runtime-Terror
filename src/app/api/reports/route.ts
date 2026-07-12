import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role, AssetStatus, AllocationStatus, BookingStatus, MaintenanceStatus } from "@prisma/client"
import { apiSuccess, apiServerError, apiValidationError } from "@/lib/api-response"

// Helper to convert JSON array to a CSV string
function convertToCsv(items: any[], headers: string[], keys: string[]): string {
  const headerRow = headers.join(",")
  const dataRows = items.map((item) => {
    return keys
      .map((key) => {
        let val = item[key]
        if (val === null || val === undefined) return ""
        if (val instanceof Date) return val.toISOString()
        
        // Escape quotes
        let strVal = String(val).replace(/"/g, '""')
        // Wrap in quotes if it contains commas, quotes, or newlines
        if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n") || strVal.includes("\r")) {
          strVal = `"${strVal}"`
        }
        return strVal
      })
      .join(",")
  })
  return [headerRow, ...dataRows].join("\n")
}

export async function GET(req: NextRequest) {
  const rbac = await checkRole([
    Role.ADMIN,
    Role.ASSET_MANAGER,
    Role.DEPARTMENT_HEAD,
    Role.AUDITOR
  ])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get("type") || "assets"
    const format = searchParams.get("format") || "json"

    let data: any[] = []
    let headers: string[] = []
    let keys: string[] = []

    switch (type.toLowerCase()) {
      case "assets":
        const assets = await prisma.asset.findMany({
          include: { category: true }
        })
        data = assets.map((a) => ({
          assetTag: a.assetTag,
          assetName: a.assetName,
          categoryName: a.category.name,
          serialNumber: a.serialNumber || "N/A",
          status: a.status,
          condition: a.condition,
          location: a.location,
          acquisitionCost: a.acquisitionCost,
          acquisitionDate: a.acquisitionDate
        }))
        headers = ["Asset Tag", "Name", "Category", "Serial Number", "Status", "Condition", "Location", "Acquisition Cost", "Acquisition Date"]
        keys = ["assetTag", "assetName", "categoryName", "serialNumber", "status", "condition", "location", "acquisitionCost", "acquisitionDate"]
        break

      case "allocations":
        const allocations = await prisma.allocation.findMany({
          include: { asset: true, assignedTo: true, department: true }
        })
        data = allocations.map((a) => ({
          id: a.id,
          assetTag: a.asset.assetTag,
          assetName: a.asset.assetName,
          assignedTo: a.assignedTo?.name || "N/A",
          department: a.department?.name || "N/A",
          allocationDate: a.allocationDate,
          expectedReturnDate: a.expectedReturnDate || "N/A",
          actualReturnDate: a.actualReturnDate || "N/A",
          status: a.status
        }))
        headers = ["Allocation ID", "Asset Tag", "Asset Name", "Allocated To", "Department", "Allocation Date", "Expected Return", "Actual Return", "Status"]
        keys = ["id", "assetTag", "assetName", "assignedTo", "department", "allocationDate", "expectedReturnDate", "actualReturnDate", "status"]
        break

      case "bookings":
        const bookings = await prisma.booking.findMany({
          include: { resource: true, bookedBy: true }
        })
        data = bookings.map((b) => ({
          id: b.id,
          resourceTag: b.resource.assetTag,
          resourceName: b.resource.assetName,
          bookedBy: b.bookedBy.name,
          startTime: b.startTime,
          endTime: b.endTime,
          purpose: b.purpose || "N/A",
          status: b.status
        }))
        headers = ["Booking ID", "Resource Tag", "Resource Name", "Booked By", "Start Time", "End Time", "Purpose", "Status"]
        keys = ["id", "resourceTag", "resourceName", "bookedBy", "startTime", "endTime", "purpose", "status"]
        break

      case "maintenance":
        const maintenance = await prisma.maintenanceRequest.findMany({
          include: { asset: true, requestedBy: true, technician: true }
        })
        data = maintenance.map((m) => ({
          id: m.id,
          assetTag: m.asset.assetTag,
          assetName: m.asset.assetName,
          issueDescription: m.issueDescription,
          priority: m.priority,
          status: m.status,
          requestedBy: m.requestedBy.name,
          technician: m.technician?.name || "Unassigned",
          estimatedCost: m.estimatedCost || 0,
          actualCost: m.actualCost || 0
        }))
        headers = ["Maintenance ID", "Asset Tag", "Asset Name", "Issue Description", "Priority", "Status", "Requested By", "Technician", "Estimated Cost", "Actual Cost"]
        keys = ["id", "assetTag", "assetName", "issueDescription", "priority", "status", "requestedBy", "technician", "estimatedCost", "actualCost"]
        break

      case "lost":
        const lostAssets = await prisma.asset.findMany({
          where: { status: AssetStatus.LOST },
          include: { category: true }
        })
        data = lostAssets.map((a) => ({
          assetTag: a.assetTag,
          assetName: a.assetName,
          categoryName: a.category.name,
          serialNumber: a.serialNumber || "N/A",
          condition: a.condition,
          location: a.location,
          acquisitionCost: a.acquisitionCost,
          lostDate: a.updatedAt
        }))
        headers = ["Asset Tag", "Name", "Category", "Serial Number", "Condition", "Location", "Acquisition Cost", "Lost Confirmation Date"]
        keys = ["assetTag", "assetName", "categoryName", "serialNumber", "condition", "location", "acquisitionCost", "lostDate"]
        break

      default:
        return apiValidationError("Invalid report type requested")
    }

    if (format.toLowerCase() === "csv") {
      const csvContent = convertToCsv(data, headers, keys)
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=assetflow_${type}_report.csv`
        }
      })
    }

    return apiSuccess({ type, count: data.length, data })
  } catch (error: any) {
    return apiServerError(error.message || "Internal Server Error")
  }
}
export const runtime = "nodejs"
