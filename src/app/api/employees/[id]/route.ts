import { NextRequest, NextResponse } from "next/server"
import { EmployeeService } from "@/services/employee.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    const employee = await EmployeeService.getEmployeeById(id)
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }
    return NextResponse.json(employee)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rbac = await checkRole([
    Role.ADMIN,
    Role.ASSET_MANAGER,
    Role.DEPARTMENT_HEAD,
    Role.EMPLOYEE
  ])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const { id } = await params
    
    // Check if the user is an employee modifying someone else's profile (restricted)
    if (rbac.user.role === Role.EMPLOYEE && rbac.user.employeeId !== id) {
      return NextResponse.json({ error: "Forbidden: You can only edit your own profile" }, { status: 403 })
    }

    const body = await req.json()
    const { name, phone, profileImage, departmentId, status } = body

    // Only Admin can modify departmentId or status of an employee
    if ((departmentId !== undefined || status !== undefined) && rbac.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Only Administrators can modify department assignments or employee status" }, { status: 403 })
    }

    const updated = await EmployeeService.updateEmployee(id, {
      name,
      phone,
      profileImage,
      departmentId,
      status
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 }
    )
  }
}
export const runtime = "nodejs"
