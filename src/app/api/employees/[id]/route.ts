import { NextRequest } from "next/server"
import { EmployeeService } from "@/services/employee.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"
import { apiSuccess, apiNotFound, apiForbidden, apiServerError } from "@/lib/api-response"

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
      return apiNotFound("Employee")
    }
    return apiSuccess(employee)
  } catch (error: any) {
    return apiServerError(error.message || "Internal Server Error")
  }
}

async function handleUpdate(
  req: NextRequest,
  id: string
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
    // Check if the user is an employee modifying someone else's profile (restricted)
    if (rbac.user.role === Role.EMPLOYEE && rbac.user.employeeId !== id) {
      return apiForbidden("You can only edit your own profile")
    }

    const body = await req.json()
    const { name, phone, profileImage, departmentId, status } = body

    // Only Admin can modify departmentId or status of an employee
    if ((departmentId !== undefined || status !== undefined) && rbac.user.role !== Role.ADMIN) {
      return apiForbidden("Only Administrators can modify department assignments or employee status")
    }

    const updated = await EmployeeService.updateEmployee(id, {
      name,
      phone,
      profileImage,
      departmentId,
      status
    })

    return apiSuccess(updated, 200, "Profile updated successfully")
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handleUpdate(req, id)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handleUpdate(req, id)
}
export const runtime = "nodejs"
