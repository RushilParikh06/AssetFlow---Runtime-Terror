import { NextRequest, NextResponse } from "next/server"
import { CategoryService } from "@/services/category.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"

export async function GET(req: NextRequest) {
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
    const searchParams = req.nextUrl.searchParams
    const statusParam = searchParams.get("status")
    
    let status: boolean | undefined = undefined
    if (statusParam === "active" || statusParam === "true") {
      status = true
    } else if (statusParam === "inactive" || statusParam === "false") {
      status = false
    }

    const categories = await CategoryService.getAllCategories({ status })
    return NextResponse.json(categories)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const rbac = await checkRole([Role.ADMIN])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const body = await req.json()
    const { name, description, customFields, status } = body

    if (!name) {
      return NextResponse.json(
        { error: "Category Name is required" },
        { status: 400 }
      )
    }

    const category = await CategoryService.createCategory({
      name,
      description,
      customFields,
      status
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 }
    )
  }
}
export const runtime = "nodejs"
