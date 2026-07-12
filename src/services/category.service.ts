import prisma from "@/lib/db"

export class CategoryService {
  /**
   * Create a new category
   */
  static async createCategory(data: {
    name: string
    description?: string | null
    customFields: any // JSON array of custom field definitions
    status?: boolean
  }) {
    const existing = await prisma.assetCategory.findUnique({
      where: { name: data.name }
    })
    if (existing) {
      throw new Error(`Category with name ${data.name} already exists`)
    }

    return await prisma.assetCategory.create({
      data: {
        name: data.name,
        description: data.description,
        customFields: data.customFields || [],
        status: data.status ?? true
      }
    })
  }

  /**
   * Update an existing category
   */
  static async updateCategory(
    id: string,
    data: {
      name?: string
      description?: string | null
      customFields?: any
      status?: boolean
    }
  ) {
    if (data.name) {
      const existing = await prisma.assetCategory.findFirst({
        where: {
          name: data.name,
          id: { not: id }
        }
      })
      if (existing) {
        throw new Error(`Category with name ${data.name} already exists`)
      }
    }

    return await prisma.assetCategory.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        customFields: data.customFields,
        status: data.status
      }
    })
  }

  /**
   * Get all categories
   */
  static async getAllCategories(filters?: { status?: boolean; skip?: number; take?: number }) {
    const where: any = {}
    if (filters?.status !== undefined) {
      where.status = filters.status
    }

    const [items, total] = await Promise.all([
      prisma.assetCategory.findMany({
        where,
        include: {
          _count: {
            select: { assets: true }
          }
        },
        orderBy: { name: "asc" },
        skip: filters?.skip,
        take: filters?.take,
      }),
      prisma.assetCategory.count({ where })
    ])

    return { items, total }
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(id: string) {
    return await prisma.assetCategory.findUnique({
      where: { id },
      include: {
        assets: true,
        _count: {
          select: { assets: true }
        }
      }
    })
  }
}
