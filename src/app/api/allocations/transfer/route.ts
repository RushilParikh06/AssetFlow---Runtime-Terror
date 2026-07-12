import { NextRequest } from "next/server"
import { AllocationService } from "@/services/allocation.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import prisma from "@/lib/db"
import { Role, TransferStatus } from "@prisma/client"
import { apiSuccess, apiCreated, apiServerError, apiValidationError } from "@/lib/api-response"

export async function GET(req: NextRequest) {
  const rbac = await checkRole([
    Role.ADMIN,
    Role.ASSET_MANAGER,
    Role.DEPARTMENT_HEAD,
    Role.EMPLOYEE,
    Role.AUDITOR
  ])
  if (!rbac.authorized || !rbac.user) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const statusParam = searchParams.get("status") as TransferStatus | null
    const status = statusParam && Object.values(TransferStatus).includes(statusParam) ? statusParam : undefined

    const where: any = {}
    if (status) {
      where.status = status
    }

    // Employees and Dept Heads can only see transfer requests involving them/their department
    if (rbac.user.role === Role.EMPLOYEE) {
      where.OR = [
        { requestedById: rbac.user.employeeId! },
        { targetEmployeeId: rbac.user.employeeId! }
      ]
    } else if (rbac.user.role === Role.DEPARTMENT_HEAD) {
      let deptId: string | null = null
      if (rbac.user.employeeId) {
        const emp = await prisma.employee.findUnique({
          where: { id: rbac.user.employeeId }
        })
        deptId = emp?.departmentId || null
      }

      where.OR = [
        { requestedById: rbac.user.employeeId! },
        { targetEmployeeId: rbac.user.employeeId! },
        { targetDepartmentId: deptId || undefined }
      ]
    }

    const transfers = await prisma.transferRequest.findMany({
      where,
      include: {
        asset: true,
        requestedBy: true,
        targetEmployee: true,
        targetDepartment: true,
        approvedBy: true
      },
      orderBy: { createdAt: "desc" }
    })

    return apiSuccess(transfers)
  } catch (error: any) {
    return apiServerError(error.message || "Internal Server Error")
  }
}

export async function POST(req: NextRequest) {
  const rbac = await checkRole([
    Role.ADMIN,
    Role.ASSET_MANAGER,
    Role.DEPARTMENT_HEAD,
    Role.EMPLOYEE
  ])
  if (!rbac.authorized || !rbac.user) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const body = await req.json()
    const { assetId, targetEmployeeId, targetDepartmentId, notes } = body

    if (!assetId) {
      return apiValidationError("assetId is required", "assetId")
    }

    if (!rbac.user.employeeId) {
      return apiValidationError("Your user account is not linked to an employee profile")
    }

    const transfer = await AllocationService.requestTransfer({
      assetId,
      requestedById: rbac.user.employeeId,
      targetEmployeeId,
      targetDepartmentId,
      notes
    })

    return apiCreated(transfer, "Transfer request submitted")
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}

export async function PATCH(req: NextRequest) {
  const rbac = await checkRole([Role.ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD])
  if (!rbac.authorized || !rbac.user) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const body = await req.json()
    const { requestId } = body

    if (!requestId) {
      return apiValidationError("requestId is required", "requestId")
    }

    if (!rbac.user.employeeId) {
      return apiValidationError("Your user account is not linked to an employee profile")
    }

    const transfer = await AllocationService.approveTransfer(requestId, rbac.user.employeeId)
    return apiSuccess(transfer, 200, "Transfer approved successfully")
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}
export const runtime = "nodejs"
