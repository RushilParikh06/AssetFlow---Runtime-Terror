import { NextRequest } from "next/server"
import { AssetService } from "@/services/asset.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role, AssetStatus } from "@prisma/client"
import { apiSuccess, apiCreated, apiPaginated, apiServerError, apiValidationError, parsePagination } from "@/lib/api-response"

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
    const { page, pageSize, skip, take } = parsePagination(searchParams)
    const search = searchParams.get("search") || undefined
    const categoryId = searchParams.get("categoryId") || undefined
    const location = searchParams.get("location") || undefined
    const statusParam = searchParams.get("status") as AssetStatus | null
    const status = statusParam && Object.values(AssetStatus).includes(statusParam) ? statusParam : undefined
    
    const sharedParam = searchParams.get("sharedBookableFlag")
    const sharedBookableFlag = sharedParam === "true" ? true : sharedParam === "false" ? false : undefined
    
    const departmentId = searchParams.get("departmentId") || undefined

    const { items, total } = await AssetService.getAssets({
      search,
      categoryId,
      status,
      location,
      sharedBookableFlag,
      departmentId,
      skip,
      take,
    })

    return apiPaginated(items, total, page, pageSize)
  } catch (error: any) {
    return apiServerError(error.message || "Internal Server Error")
  }
}

export async function POST(req: NextRequest) {
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
      return apiValidationError("Missing required fields: assetName, categoryId, acquisitionDate, acquisitionCost, condition, location")
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

    return apiCreated(asset, "Asset registered successfully")
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}
export const runtime = "nodejs"
