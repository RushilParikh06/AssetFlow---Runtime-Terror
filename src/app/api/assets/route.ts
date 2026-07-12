import { NextRequest, NextResponse } from "next/server"
import { AssetService } from "@/services/asset.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role, AssetStatus } from "@prisma/client"

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
    const search = searchParams.get("search") || undefined
    const categoryId = searchParams.get("categoryId") || undefined
    const location = searchParams.get("location") || undefined
    const statusParam = searchParams.get("status") as AssetStatus | null
    const status = statusParam && Object.values(AssetStatus).includes(statusParam) ? statusParam : undefined
    
    const sharedParam = searchParams.get("sharedBookableFlag")
    const sharedBookableFlag = sharedParam === "true" ? true : sharedParam === "false" ? false : undefined
    
    const departmentId = searchParams.get("departmentId") || undefined

    const assets = await AssetService.getAssets({
      search,
      categoryId,
      status,
      location,
      sharedBookableFlag,
      departmentId
    })

    return NextResponse.json(assets)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  // Gated to Admin and Asset Manager
  const rbac = await checkRole([Role.ADMIN, Role.ASSET_MANAGER])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const body = await req.json()
    const {
      assetName,
      categoryId,
      serialNumber,
      acquisitionDate,
      acquisitionCost,
      warrantyExpiry,
      vendor,
      condition,
      location,
      sharedBookableFlag,
      documents
    } = body

    if (!assetName || !categoryId || !acquisitionDate || acquisitionCost === undefined || !condition || !location) {
      return NextResponse.json(
        { error: "Missing required fields: assetName, categoryId, acquisitionDate, acquisitionCost, condition, location" },
        { status: 400 }
      )
    }

    const asset = await AssetService.registerAsset({
      assetName,
      categoryId,
      serialNumber,
      acquisitionDate: new Date(acquisitionDate),
      acquisitionCost: parseFloat(acquisitionCost),
      warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
      vendor,
      condition,
      location,
      sharedBookableFlag: !!sharedBookableFlag,
      documents
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 }
    )
  }
}
export const runtime = "nodejs"
