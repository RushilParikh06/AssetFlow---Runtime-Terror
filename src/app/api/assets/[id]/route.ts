import { NextRequest } from "next/server"
import { AssetService } from "@/services/asset.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"
import { apiSuccess, apiNotFound, apiServerError, apiValidationError } from "@/lib/api-response"

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
    const asset = await AssetService.getAssetById(id)
    if (!asset) {
      return apiNotFound("Asset")
    }
    return apiSuccess(asset)
  } catch (error: any) {
    return apiServerError(error.message || "Internal Server Error")
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rbac = await checkRole([Role.ADMIN, Role.ASSET_MANAGER])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const { id } = await params
    const body = await req.json()
    
    const updateData: any = { ...body }
    if (body.acquisitionDate) updateData.acquisitionDate = new Date(body.acquisitionDate)
    if (body.warrantyExpiry) updateData.warrantyExpiry = new Date(body.warrantyExpiry)
    if (body.acquisitionCost) updateData.acquisitionCost = parseFloat(body.acquisitionCost)

    const updated = await AssetService.updateAsset(id, updateData)
    return apiSuccess(updated, 200, "Asset updated successfully")
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rbac = await checkRole([Role.ADMIN])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const { id } = await params
    await AssetService.deleteAsset(id)
    return apiSuccess(null, 200, "Asset deleted successfully")
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}
export const runtime = "nodejs"
