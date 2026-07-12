import prisma from "@/lib/db"

export class DepartmentService {
  /**
   * Create a new department
   */
  static async createDepartment(data: {
    name: string
    code: string
    description?: string | null
    parentDepartmentId?: string | null
    departmentHeadId?: string | null
  }) {
    // Check if code already exists
    const existing = await prisma.department.findUnique({
      where: { code: data.code }
    })
    if (existing) {
      throw new Error(`Department with code ${data.code} already exists`)
    }

    return await prisma.department.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        parentDepartmentId: data.parentDepartmentId || null,
        departmentHeadId: data.departmentHeadId || null,
        status: true
      },
      include: {
        parentDepartment: true,
        departmentHead: true
      }
    })
  }

  /**
   * Update an existing department
   */
  static async updateDepartment(
    id: string,
    data: {
      name?: string
      code?: string
      description?: string | null
      parentDepartmentId?: string | null
      departmentHeadId?: string | null
      status?: boolean
    }
  ) {
    if (data.code) {
      const existing = await prisma.department.findFirst({
        where: {
          code: data.code,
          id: { not: id }
        }
      })
      if (existing) {
        throw new Error(`Department with code ${data.code} already exists`)
      }
    }

    // Prevent circular parenting reference
    if (data.parentDepartmentId === id) {
      throw new Error("A department cannot be its own parent")
    }

    return await prisma.department.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        parentDepartmentId: data.parentDepartmentId !== undefined ? data.parentDepartmentId : undefined,
        departmentHeadId: data.departmentHeadId !== undefined ? data.departmentHeadId : undefined,
        status: data.status
      },
      include: {
        parentDepartment: true,
        departmentHead: true
      }
    })
  }

  /**
   * Get all departments (with hierarchy and head info)
   */
  static async getAllDepartments(filters?: { status?: boolean }) {
    return await prisma.department.findMany({
      where: {
        status: filters?.status
      },
      include: {
        parentDepartment: true,
        departmentHead: true,
        _count: {
          select: { employees: true, allocations: true }
        }
      },
      orderBy: { name: "asc" }
    })
  }

  /**
   * Get department by ID
   */
  static async getDepartmentById(id: string) {
    return await prisma.department.findUnique({
      where: { id },
      include: {
        parentDepartment: true,
        departmentHead: true,
        subDepartments: true,
        employees: true,
        _count: {
          select: { employees: true, allocations: true }
        }
      }
    })
  }

  /**
   * Toggle department active status
   */
  static async toggleStatus(id: string, status: boolean) {
    return await prisma.department.update({
      where: { id },
      data: { status }
    })
  }
}
