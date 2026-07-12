import { NextRequest, NextResponse } from "next/server"
import { AllocationService } from "@/services/allocation.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import prisma from "@/lib/db"
import { Role, TransferStatus } from "@prisma/client"

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

    return NextResponse.json(transfers)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
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
      return NextResponse.json({ error: "assetId is required" }, { status: 400 })
    }

    if (!rbac.user.employeeId) {
      return NextResponse.json({ error: "Your user account is not linked to an employee profile" }, { status: 400 })
    }

    const transfer = await AllocationService.requestTransfer({
      assetId,
      requestedById: rbac.user.employeeId,
      targetEmployeeId,
      targetDepartmentId,
      notes
    })

    return NextResponse.json(transfer, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 }
    )
  }
}

export async function PUT(req: NextRequest) {
  // Approving transfers is gated to Admin, Asset Manager, or Department Head
  const rbac = await checkRole([Role.ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD])
  if (!rbac.authorized || !rbac.user) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const body = await req.json()
    const { requestId } = body

    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 })
    }

    if (!rbac.user.employeeId) {
      return NextResponse.json({ error: "Your user account is not linked to an employee profile" }, { status: 400 })
    }

    const transfer = await AllocationService.approveTransfer(requestId, rbac.user.employeeId)
    return NextResponse.json(transfer)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 }
    )
  }
}
export const runtime = "nodejs"
