import { NextRequest, NextResponse } from "next/server"
import { EmployeeService } from "@/services/employee.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Gated to Admin only
  const rbac = await checkRole([Role.ADMIN])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { role } = body

    if (!role || !Object.values(Role).includes(role as Role)) {
      return NextResponse.json(
        { error: "A valid role selection is required" },
        { status: 400 }
      )
    }

    const updatedUser = await EmployeeService.promoteEmployee(id, role as Role)
    
    return NextResponse.json({
      success: true,
      message: `Employee role successfully updated to ${role}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 }
    )
  }
}
export const runtime = "nodejs"
