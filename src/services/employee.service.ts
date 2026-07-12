import prisma from "@/lib/db"
import { Role } from "@prisma/client"

export class EmployeeService {
  /**
   * Get all employees in the directory with search and filter
   */
  static async getEmployees(params?: {
    search?: string
    departmentId?: string
    status?: boolean
    role?: Role
  }) {
    const where: any = {}

    if (params?.status !== undefined) {
      where.status = params.status
    }

    if (params?.departmentId) {
      where.departmentId = params.departmentId
    }

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
        { employeeId: { contains: params.search, mode: "insensitive" } }
      ]
    }

    if (params?.role) {
      where.user = {
        role: params.role
      }
    }

    return await prisma.employee.findMany({
      where,
      include: {
        department: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true
          }
        }
      },
      orderBy: { employeeId: "asc" }
    })
  }

  /**
   * Get employee by ID
   */
  static async getEmployeeById(id: string) {
    return await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true
          }
        },
        allocations: {
          include: { asset: true }
        },
        bookings: {
          include: { resource: true }
        }
      }
    })
  }

  /**
   * Update employee profile
   */
  static async updateEmployee(
    id: string,
    data: {
      name?: string
      phone?: string | null
      profileImage?: string | null
      departmentId?: string | null
      status?: boolean
    }
  ) {
    // If updating status, update both Employee and User
    return await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.update({
        where: { id },
        data: {
          name: data.name,
          phone: data.phone,
          profileImage: data.profileImage,
          departmentId: data.departmentId !== undefined ? data.departmentId : undefined,
          status: data.status
        }
      })

      if (data.status !== undefined && employee.userId) {
        await tx.user.update({
          where: { id: employee.userId },
          data: { status: data.status }
        })
      }

      return employee
    })
  }

  /**
   * Promote or change the role of an employee's user account
   */
  static async promoteEmployee(employeeId: string, newRole: Role) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    })

    if (!employee) {
      throw new Error("Employee not found")
    }

    if (!employee.userId) {
      throw new Error("This employee does not have a linked user account for authentication")
    }

    return await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: employee.userId! },
        data: { role: newRole }
      })

      // If promoted to DEPARTMENT_HEAD, check if they need to be assigned to a department
      if (newRole === Role.DEPARTMENT_HEAD && employee.departmentId) {
        // Option: automatically make them head of their department if none exists
        const dept = await tx.department.findUnique({
          where: { id: employee.departmentId }
        })
        if (dept && !dept.departmentHeadId) {
          await tx.department.update({
            where: { id: employee.departmentId },
            data: { departmentHeadId: employee.id }
          })
        }
      }

      return updatedUser
    })
  }
}
